import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { S3Adapter } from '../adapters/S3Adapter';
import {
  RepoSettings,
  RepoStatus,
  ApiError,
  ApiErrorCode,
  S3RepoSettings,
} from '../../shared/types';
import { logger } from '../utils/logger';
import type { RepoProvider } from './types';

type SyncMode = 'pull' | 'sync';

type S3SyncManifestEntry = {
  localHash?: string;
  localMtimeMs?: number;
  remoteETag?: string;
  remoteLastModifiedMs?: number;
  deleted?: boolean;
  conflict?: boolean;
  conflictRemoteETag?: string;
  conflictRemoteDeleted?: boolean;
  conflictLocalHash?: string;
  conflictDetectedAt?: string;
};

type S3SyncManifest = {
  version: number;
  updatedAt: string;
  files: Record<string, S3SyncManifestEntry>;
};

type LocalFileInfo = {
  relativePath: string;
  hash: string;
  mtimeMs: number;
};

type RemoteFileInfo = {
  key: string;
  eTag?: string;
  lastModifiedMs: number;
};

export class S3RepoProvider implements RepoProvider {
  readonly type = 's3';
  private readonly conflictSuffix = 's3-conflict';
  private readonly manifestFolder = '.notegit';
  private readonly manifestFile = 's3-sync.json';
  private readonly manifestVersion = 1;
  private settings: S3RepoSettings | null = null;
  private repoPath: string | null = null;
  private autoSyncTimer: NodeJS.Timeout | null = null;
  private autoSyncIntervalMs = 30000;
  private lastSyncTime: Date | null = null;
  private syncInProgress = false;
  private pendingSyncTimer: NodeJS.Timeout | null = null;
  private pendingSyncRequested = false;

  constructor(private s3Adapter: S3Adapter) { }

  configure(settings: RepoSettings): void {
    if (settings.provider !== 's3') {
      throw this.createError(
        ApiErrorCode.REPO_PROVIDER_MISMATCH,
        'S3RepoProvider configured with non-s3 settings',
        { provider: settings.provider }
      );
    }

    this.settings = settings;
    this.repoPath = settings.localPath || null;
    this.s3Adapter.configure(settings);
  }

  async open(settings: RepoSettings): Promise<{ localPath: string }> {
    if (settings.provider !== 's3') {
      throw this.createError(
        ApiErrorCode.REPO_PROVIDER_MISMATCH,
        'S3RepoProvider cannot open non-s3 repository',
        { provider: settings.provider }
      );
    }

    this.configure(settings);

    const localPath = settings.localPath;
    if (!localPath) {
      throw this.createError(
        ApiErrorCode.VALIDATION_ERROR,
        'Local path is required for S3 repository',
        null
      );
    }

    const versioning = await this.s3Adapter.getBucketVersioning();
    if (versioning !== 'Enabled') {
      throw this.createError(
        ApiErrorCode.S3_VERSIONING_REQUIRED,
        'S3 bucket versioning must be enabled to use history',
        { status: versioning }
      );
    }

    await fs.mkdir(localPath, { recursive: true });
    this.repoPath = localPath;

    await this.pull();

    return { localPath };
  }

  async getStatus(): Promise<RepoStatus> {
    await this.ensureRepoReady();

    const { localChanges, remoteChanges } = await this.calculateChangeCounts();

    const status: RepoStatus = {
      provider: 's3',
      branch: this.getDisplayName(),
      ahead: localChanges,
      behind: remoteChanges,
      hasUncommitted: localChanges > 0,
      pendingPushCount: localChanges,
      needsPull: remoteChanges > 0,
      isConnected: true,
      lastSyncTime: this.lastSyncTime || undefined,
    };

    logger.debug('S3 repository status', { status });
    return status;
  }

  async fetch(): Promise<RepoStatus> {
    await this.ensureRepoReady();
    return await this.getStatus();
  }

  async pull(): Promise<void> {
    await this.sync('pull');
  }

  async push(): Promise<void> {
    await this.sync('sync');
  }

  async queueDelete(_path: string): Promise<void> {
    await this.requestSync();
  }

  async queueMove(_oldPath: string, _newPath: string): Promise<void> {
    await this.requestSync();
  }

  async queueUpload(_path: string): Promise<void> {
    await this.requestSync();
  }

  startAutoSync(intervalMs?: number): void {
    if (intervalMs && intervalMs > 0) {
      this.autoSyncIntervalMs = intervalMs;
    }

    if (this.autoSyncTimer) {
      logger.debug('Restarting S3 auto-sync timer', {
        intervalMs: this.autoSyncIntervalMs,
      });
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }

    logger.info('Starting S3 auto-sync timer', {
      intervalMs: this.autoSyncIntervalMs,
    });

    void this.pull().catch((error) => {
      logger.debug('Initial S3 pull failed', { error });
    });

    this.autoSyncTimer = setInterval(async () => {
      try {
        await this.sync('sync');
      } catch (error) {
        logger.debug('S3 auto-sync attempt failed, will retry', { error });
      }
    }, this.autoSyncIntervalMs);
  }

  stopAutoSync(): void {
    if (this.autoSyncTimer) {
      logger.info('Stopping S3 auto-sync timer');
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }

  private async sync(mode: SyncMode = 'sync'): Promise<void> {
    if (this.syncInProgress) {
      this.pendingSyncRequested = true;
      return;
    }

    this.syncInProgress = true;

    try {
      await this.ensureRepoReady();

      const manifest = await this.loadManifest();
      const localInfo = await this.collectLocalInfo(manifest);
      const remoteInfo = await this.collectRemoteInfo();
      const allPaths = new Set<string>([
        ...Object.keys(manifest.files),
        ...localInfo.keys(),
        ...remoteInfo.keys(),
      ]);

      for (const relativePath of allPaths) {
        await this.reconcilePath(relativePath, localInfo, remoteInfo, manifest, mode);
      }

      manifest.updatedAt = new Date().toISOString();
      await this.saveManifest(manifest);

      this.lastSyncTime = new Date();
      logger.info(`S3 ${mode} completed`, { updatedAt: this.lastSyncTime });
    } finally {
      this.syncInProgress = false;
    }

    if (this.pendingSyncRequested) {
      this.pendingSyncRequested = false;
      await this.sync(mode);
    }
  }

  private async requestSync(): Promise<void> {
    try {
      await this.sync('sync');
    } catch (error) {
      this.schedulePendingSync();
      throw error;
    }
  }

  private async calculateChangeCounts(): Promise<{ localChanges: number; remoteChanges: number }> {
    await this.ensureRepoReady();

    const manifest = await this.loadManifest();
    const localInfo = await this.collectLocalInfo(manifest);
    const remoteInfo = await this.collectRemoteInfo();
    const allPaths = new Set<string>([
      ...Object.keys(manifest.files),
      ...localInfo.keys(),
      ...remoteInfo.keys(),
    ]);

    let localChanges = 0;
    let remoteChanges = 0;

    for (const relativePath of allPaths) {
      const normalized = this.normalizeRelativePath(relativePath);
      const entry = manifest.files[normalized];
      const local = localInfo.get(normalized);
      const remote = remoteInfo.get(normalized);

      if (entry?.conflict) {
        localChanges += 1;
        remoteChanges += 1;
        continue;
      }

      const baseEntry = entry && !entry.deleted ? entry : undefined;
      const localChanged = local
        ? !baseEntry?.localHash || local.hash !== baseEntry.localHash
        : Boolean(baseEntry?.localHash);
      const remoteChanged = remote
        ? !baseEntry?.remoteETag || remote.eTag !== baseEntry.remoteETag
        : Boolean(baseEntry?.remoteETag);

      if (localChanged) {
        localChanges += 1;
      }
      if (remoteChanged) {
        remoteChanges += 1;
      }
    }

    return { localChanges, remoteChanges };
  }

  private async collectLocalInfo(manifest: S3SyncManifest): Promise<Map<string, LocalFileInfo>> {
    const files = await this.listLocalFiles(this.repoPath!);
    const result = new Map<string, LocalFileInfo>();

    for (const relativePath of files) {
      const normalized = this.normalizeRelativePath(relativePath);
      const fullPath = path.join(this.repoPath!, relativePath);
      const stats = await fs.stat(fullPath);
      const entry = manifest.files[normalized];
      let hash = entry?.localHash;

      if (!hash || entry?.localMtimeMs !== stats.mtimeMs) {
        hash = await this.hashFile(fullPath);
      }

      result.set(normalized, {
        relativePath: normalized,
        hash,
        mtimeMs: stats.mtimeMs,
      });
    }

    return result;
  }

  private async collectRemoteInfo(): Promise<Map<string, RemoteFileInfo>> {
    const objects = await this.s3Adapter.listObjects(this.normalizedPrefix());
    const result = new Map<string, RemoteFileInfo>();

    for (const object of objects) {
      const relativePath = this.fromS3Key(object.key);
      if (!relativePath || relativePath.endsWith('/')) {
        continue;
      }
      if (this.shouldIgnoreRemotePath(relativePath)) {
        continue;
      }

      const normalized = this.normalizeRelativePath(relativePath);
      result.set(normalized, {
        key: object.key,
        eTag: this.normalizeETag(object.eTag),
        lastModifiedMs: object.lastModified?.getTime() || 0,
      });
    }

    return result;
  }

  private async reconcilePath(
    relativePath: string,
    localInfo: Map<string, LocalFileInfo>,
    remoteInfo: Map<string, RemoteFileInfo>,
    manifest: S3SyncManifest,
    mode: SyncMode
  ): Promise<void> {
    const normalized = this.normalizeRelativePath(relativePath);
    const local = localInfo.get(normalized);
    const remote = remoteInfo.get(normalized);
    const entry = manifest.files[normalized];

    const localExists = Boolean(local);
    const remoteExists = Boolean(remote);
    const allowUpload = mode === 'sync';
    const allowRemoteDelete = mode === 'sync';
    const allowDownload = true;
    const allowLocalDelete = true;

    if (entry?.conflict) {
      const conflictRemoteMatches = entry.conflictRemoteDeleted
        ? !remoteExists
        : Boolean(remote?.eTag && entry.conflictRemoteETag === remote.eTag);
      const conflictLocalMatches = entry.conflictLocalHash
        ? Boolean(local?.hash && entry.conflictLocalHash === local.hash)
        : false;

      if (conflictRemoteMatches && conflictLocalMatches) {
        return;
      }

      if (conflictRemoteMatches && (!conflictLocalMatches || !localExists)) {
        this.clearConflict(entry);
      } else {
        if (remoteExists) {
          await this.createConflictCopy(normalized, local, remote!, manifest);
        } else {
          this.markConflict(manifest, normalized, local, undefined, true);
        }
        return;
      }
    }

    const baseEntry = entry && !entry.deleted ? entry : undefined;
    const localChanged = localExists
      ? !baseEntry?.localHash || local!.hash !== baseEntry.localHash
      : Boolean(baseEntry?.localHash);
    const remoteChanged = remoteExists
      ? !baseEntry?.remoteETag || remote!.eTag !== baseEntry.remoteETag
      : Boolean(baseEntry?.remoteETag);
    const hasBaseline = Boolean(baseEntry?.localHash && baseEntry?.remoteETag);

    if (localExists && remoteExists) {
      if (hasBaseline && localChanged && remoteChanged) {
        await this.createConflictCopy(normalized, local!, remote!, manifest);
        return;
      }

      if (!hasBaseline) {
        if (remote!.lastModifiedMs > local!.mtimeMs) {
          const downloaded = await this.downloadRemoteFile(normalized, remote!);
          this.updateManifestEntry(manifest, normalized, downloaded, remote!);
          return;
        }
        if (local!.mtimeMs > remote!.lastModifiedMs && allowUpload) {
          const uploaded = await this.uploadLocalFile(normalized, local!);
          this.updateManifestEntry(manifest, normalized, local!, uploaded);
          return;
        }
        if (remote!.lastModifiedMs === local!.mtimeMs) {
          this.updateManifestEntry(manifest, normalized, local!, remote!);
        }
        return;
      }

      if (remoteChanged && allowDownload) {
        const downloaded = await this.downloadRemoteFile(normalized, remote!);
        this.updateManifestEntry(manifest, normalized, downloaded, remote!);
        return;
      }

      if (localChanged && allowUpload) {
        const uploaded = await this.uploadLocalFile(normalized, local!);
        this.updateManifestEntry(manifest, normalized, local!, uploaded);
      }
      return;
    }

    if (localExists && !remoteExists) {
      if (hasBaseline && remoteChanged && localChanged) {
        this.markConflict(manifest, normalized, local!, undefined, true);
        logger.warn('S3 conflict detected: remote deleted while local changed', {
          file: normalized,
        });
        return;
      }

      if (hasBaseline && remoteChanged && !localChanged) {
        if (allowLocalDelete) {
          await this.deleteLocalFile(normalized);
          this.markDeleted(manifest, normalized);
        }
        return;
      }

      if (allowUpload) {
        const uploaded = await this.uploadLocalFile(normalized, local!);
        this.updateManifestEntry(manifest, normalized, local!, uploaded);
      }
      return;
    }

    if (!localExists && remoteExists) {
      if (hasBaseline && localChanged && remoteChanged) {
        await this.createConflictCopy(normalized, undefined, remote!, manifest);
        return;
      }

      if (hasBaseline && localChanged && !remoteChanged) {
        if (allowRemoteDelete) {
          await this.deleteRemoteKey(normalized);
          this.markDeleted(manifest, normalized);
        } else if (allowDownload) {
          const downloaded = await this.downloadRemoteFile(normalized, remote!);
          this.updateManifestEntry(manifest, normalized, downloaded, remote!);
        }
        return;
      }

      if (allowDownload) {
        const downloaded = await this.downloadRemoteFile(normalized, remote!);
        this.updateManifestEntry(manifest, normalized, downloaded, remote!);
      }
      return;
    }

    if (!localExists && !remoteExists) {
      if (entry && !entry.deleted && (entry.localHash || entry.remoteETag)) {
        this.markDeleted(manifest, normalized);
      }
    }
  }

  private async downloadRemoteFile(
    relativePath: string,
    remote: RemoteFileInfo
  ): Promise<LocalFileInfo> {
    const localFilePath = path.join(this.repoPath!, relativePath);
    const content = await this.s3Adapter.getObject(remote.key);
    await fs.mkdir(path.dirname(localFilePath), { recursive: true });
    await fs.writeFile(localFilePath, content);

    const mtimeMs = remote.lastModifiedMs || Date.now();
    const mtimeDate = new Date(mtimeMs);
    await fs.utimes(localFilePath, mtimeDate, mtimeDate);

    return {
      relativePath,
      hash: this.hashBuffer(content),
      mtimeMs,
    };
  }

  private async uploadLocalFile(relativePath: string, _local: LocalFileInfo): Promise<RemoteFileInfo> {
    const fullPath = path.join(this.repoPath!, relativePath);
    const body = await fs.readFile(fullPath);
    await this.s3Adapter.putObject(this.toS3Key(relativePath), body);
    const head = await this.s3Adapter.headObject(this.toS3Key(relativePath));

    return {
      key: head.key,
      eTag: this.normalizeETag(head.eTag),
      lastModifiedMs: head.lastModified?.getTime() || Date.now(),
    };
  }

  private async deleteRemoteKey(relativePath: string): Promise<void> {
    await this.s3Adapter.deleteObject(this.toS3Key(relativePath));
  }

  private async deleteLocalFile(relativePath: string): Promise<void> {
    const fullPath = path.join(this.repoPath!, relativePath);
    await fs.rm(fullPath, { force: true });
  }

  private updateManifestEntry(
    manifest: S3SyncManifest,
    relativePath: string,
    local: LocalFileInfo,
    remote: RemoteFileInfo
  ): void {
    const normalized = this.normalizeRelativePath(relativePath);
    manifest.files[normalized] = {
      localHash: local.hash,
      localMtimeMs: local.mtimeMs,
      remoteETag: remote.eTag,
      remoteLastModifiedMs: remote.lastModifiedMs,
      deleted: false,
    };
  }

  private markDeleted(manifest: S3SyncManifest, relativePath: string): void {
    const normalized = this.normalizeRelativePath(relativePath);
    manifest.files[normalized] = {
      deleted: true,
    };
  }

  private markConflict(
    manifest: S3SyncManifest,
    relativePath: string,
    local?: LocalFileInfo,
    remote?: RemoteFileInfo,
    remoteDeleted?: boolean
  ): void {
    const normalized = this.normalizeRelativePath(relativePath);
    const entry = manifest.files[normalized] || {};
    if (local) {
      entry.localHash = local.hash;
      entry.localMtimeMs = local.mtimeMs;
    }
    if (remote) {
      entry.remoteETag = remote.eTag;
      entry.remoteLastModifiedMs = remote.lastModifiedMs;
    }
    entry.deleted = false;
    entry.conflict = true;
    entry.conflictLocalHash = local?.hash;
    entry.conflictRemoteETag = remote?.eTag;
    entry.conflictRemoteDeleted = Boolean(remoteDeleted);
    entry.conflictDetectedAt = new Date().toISOString();
    manifest.files[normalized] = entry;
    logger.warn('S3 conflict detected', { file: normalized });
  }

  private clearConflict(entry: S3SyncManifestEntry): void {
    entry.conflict = false;
    entry.conflictLocalHash = undefined;
    entry.conflictRemoteETag = undefined;
    entry.conflictRemoteDeleted = undefined;
    entry.conflictDetectedAt = undefined;
  }

  private async createConflictCopy(
    relativePath: string,
    local: LocalFileInfo | undefined,
    remote: RemoteFileInfo,
    manifest: S3SyncManifest
  ): Promise<void> {
    const stamp = this.formatConflictTimestamp(new Date(remote.lastModifiedMs || Date.now()));
    const conflictPath = await this.resolveConflictPath(relativePath, stamp);
    if (!conflictPath) {
      this.markConflict(manifest, relativePath, local, remote, false);
      return;
    }

    const content = await this.s3Adapter.getObject(remote.key);
    const localFilePath = path.join(this.repoPath!, conflictPath);
    await fs.mkdir(path.dirname(localFilePath), { recursive: true });
    await fs.writeFile(localFilePath, content);

    this.markConflict(manifest, relativePath, local, remote, false);
    logger.warn('S3 conflict detected; saved remote copy locally', {
      file: relativePath,
      conflictCopy: conflictPath,
    });
  }

  private formatConflictTimestamp(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    const hours = pad(date.getUTCHours());
    const minutes = pad(date.getUTCMinutes());
    const seconds = pad(date.getUTCSeconds());
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  private buildConflictPath(relativePath: string, stamp: string): string {
    const ext = path.extname(relativePath);
    const baseName = path.basename(relativePath, ext);
    const dirName = path.dirname(relativePath);
    const conflictName = `${baseName}.${this.conflictSuffix}-${stamp}${ext}`;
    return dirName === '.' ? conflictName : path.join(dirName, conflictName);
  }

  private async resolveConflictPath(relativePath: string, stamp: string): Promise<string | null> {
    const conflictPath = this.buildConflictPath(relativePath, stamp);
    const fullPath = path.join(this.repoPath!, conflictPath);

    if (await this.pathExists(fullPath)) {
      return null;
    }

    return conflictPath;
  }

  private async pathExists(fullPath: string): Promise<boolean> {
    try {
      await fs.stat(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  private hashBuffer(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private async hashFile(fullPath: string): Promise<string> {
    const buffer = await fs.readFile(fullPath);
    return this.hashBuffer(buffer);
  }

  private async loadManifest(): Promise<S3SyncManifest> {
    const manifestPath = this.getManifestPath();
    try {
      const content = await fs.readFile(manifestPath, 'utf-8');
      const parsed = JSON.parse(content) as S3SyncManifest;
      if (parsed && parsed.version === this.manifestVersion && parsed.files) {
        return parsed;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.warn('Failed to read S3 sync manifest, recreating', { error });
      }
    }

    return {
      version: this.manifestVersion,
      updatedAt: new Date().toISOString(),
      files: {},
    };
  }

  private async saveManifest(manifest: S3SyncManifest): Promise<void> {
    const manifestPath = this.getManifestPath();
    await fs.mkdir(path.dirname(manifestPath), { recursive: true });
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  }

  private getManifestPath(): string {
    return path.join(this.repoPath!, this.manifestFolder, this.manifestFile);
  }

  private normalizeETag(eTag?: string): string | undefined {
    if (!eTag) {
      return undefined;
    }
    return eTag.replace(/"/g, '');
  }

  private schedulePendingSync(): void {
    if (this.pendingSyncTimer || this.syncInProgress) {
      return;
    }

    this.pendingSyncTimer = setTimeout(() => {
      this.pendingSyncTimer = null;
      void this.sync('sync').catch((error) => {
        logger.debug('Deferred S3 sync failed', { error });
      });
    }, 1000);
  }

  private async listLocalFiles(dirPath: string, basePath: string = dirPath): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      if (this.shouldIgnoreEntry(entry.name)) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        files.push(...(await this.listLocalFiles(fullPath, basePath)));
      } else if (entry.isFile()) {
        const relative = path.relative(basePath, fullPath);
        files.push(relative);
      }
    }

    return files;
  }

  private normalizeRelativePath(relativePath: string): string {
    return path.normalize(relativePath);
  }

  private shouldIgnoreEntry(name: string): boolean {
    if (name === '.git' || name === '.DS_Store') {
      return true;
    }
    if (name.startsWith('.notegit')) {
      return true;
    }
    if (this.isConflictFileName(name)) {
      return true;
    }
    return false;
  }

  private shouldIgnoreRemotePath(relativePath: string): boolean {
    const parts = relativePath.split('/');
    return parts.some((part) => this.shouldIgnoreEntry(part));
  }

  private isConflictFileName(name: string): boolean {
    return name.includes(`.${this.conflictSuffix}-`);
  }

  private normalizedPrefix(): string {
    const prefix = this.settings?.prefix?.trim() || '';
    if (!prefix) {
      return '';
    }
    return prefix.replace(/^\/+|\/+$/g, '') + '/';
  }

  private toS3Key(relativePath: string): string {
    const normalized = relativePath.split(path.sep).join('/');
    return `${this.normalizedPrefix()}${normalized}`;
  }

  private fromS3Key(key: string): string {
    const prefix = this.normalizedPrefix();
    if (prefix && key.startsWith(prefix)) {
      return key.slice(prefix.length);
    }
    return key;
  }

  private getDisplayName(): string {
    if (!this.settings) {
      return 's3';
    }
    const prefix = this.settings.prefix ? `/${this.settings.prefix}` : '';
    return `${this.settings.bucket}${prefix}`;
  }

  private async ensureRepoReady(): Promise<void> {
    if (!this.repoPath) {
      if (this.settings?.localPath) {
        this.repoPath = this.settings.localPath;
      } else {
        throw this.createError(
          ApiErrorCode.VALIDATION_ERROR,
          'No repository configured',
          null
        );
      }
    }
  }

  private createError(code: ApiErrorCode, message: string, details?: any): ApiError {
    return {
      code,
      message,
      details,
    };
  }
}
