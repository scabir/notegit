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

type PendingS3Operation =
  | { type: 'delete'; path: string }
  | { type: 'move'; from: string; to: string }
  | { type: 'upload'; path: string };

export class S3RepoProvider implements RepoProvider {
  type: 's3' = 's3';
  private settings: S3RepoSettings | null = null;
  private repoPath: string | null = null;
  private autoSyncTimer: NodeJS.Timeout | null = null;
  private autoSyncIntervalMs = 30000;
  private lastSyncTime: Date | null = null;
  private syncInProgress = false;
  private pendingOperations: PendingS3Operation[] = [];
  private pendingSyncTimer: NodeJS.Timeout | null = null;

  constructor(private s3Adapter: S3Adapter) {}

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

    const localChanges = await this.countLocalChanges();
    const remoteChanges = await this.countRemoteChanges();

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
    await this.ensureRepoReady();

    const prefix = this.normalizedPrefix();
    const objects = await this.s3Adapter.listObjects(prefix);

    for (const object of objects) {
      const relativePath = this.fromS3Key(object.key);
      if (!relativePath || relativePath.endsWith('/')) {
        continue;
      }

      const localFilePath = path.join(this.repoPath!, relativePath);
      let shouldDownload = false;

      try {
        const stats = await fs.stat(localFilePath);
        if (object.lastModified && object.lastModified > stats.mtime) {
          shouldDownload = true;
        }
      } catch {
        shouldDownload = true;
      }

      if (!shouldDownload) {
        continue;
      }

      await this.downloadObjectToLocal(object.key, relativePath, object.lastModified);
    }

    this.lastSyncTime = new Date();
    logger.info('S3 pull completed', { updatedAt: this.lastSyncTime });
  }

  async push(): Promise<void> {
    await this.sync();
  }

  async queueDelete(path: string): Promise<void> {
    const operation: PendingS3Operation = { type: 'delete', path };
    await this.applyOrQueueOperation(operation);
  }

  async queueMove(oldPath: string, newPath: string): Promise<void> {
    const operation: PendingS3Operation = { type: 'move', from: oldPath, to: newPath };
    await this.applyOrQueueOperation(operation);
  }

  async queueUpload(path: string): Promise<void> {
    const operation: PendingS3Operation = { type: 'upload', path };
    await this.applyOrQueueOperation(operation);
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

    this.autoSyncTimer = setInterval(async () => {
      try {
        await this.sync();
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

  private async sync(): Promise<void> {
    if (this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;

    try {
      await this.ensureRepoReady();
      await this.applyPendingOperations();

      const lastSync = this.lastSyncTime?.getTime() || 0;
      const localFiles = await this.listLocalFiles(this.repoPath!);
      const localStats = new Map<string, Awaited<ReturnType<typeof fs.stat>>>();

      for (const relativePath of localFiles) {
        const fullPath = path.join(this.repoPath!, relativePath);
        localStats.set(relativePath, await fs.stat(fullPath));
      }

      const remoteObjects = await this.s3Adapter.listObjects(this.normalizedPrefix());
      const remoteByRelative = new Map<string, typeof remoteObjects[number]>();

      for (const object of remoteObjects) {
        const relativePath = this.fromS3Key(object.key);
        if (!relativePath || relativePath.endsWith('/')) {
          continue;
        }
        remoteByRelative.set(relativePath, object);
      }

      for (const [relativePath, remoteObject] of remoteByRelative.entries()) {
        const localStat = localStats.get(relativePath);
        const remoteMtime = remoteObject.lastModified?.getTime() || 0;

        if (localStat) {
          const localMtime = localStat.mtime.getTime();
          if (remoteMtime > localMtime) {
            await this.downloadObjectToLocal(
              remoteObject.key,
              relativePath,
              remoteObject.lastModified
            );
          } else if (localMtime > remoteMtime) {
            await this.uploadLocalFile(relativePath);
          }
          continue;
        }

        if (lastSync && remoteMtime <= lastSync) {
          await this.s3Adapter.deleteObject(remoteObject.key);
          continue;
        }

        await this.downloadObjectToLocal(
          remoteObject.key,
          relativePath,
          remoteObject.lastModified
        );
      }

      for (const relativePath of localStats.keys()) {
        if (remoteByRelative.has(relativePath)) {
          continue;
        }
        await this.uploadLocalFile(relativePath);
      }

      this.lastSyncTime = new Date();
      logger.info('S3 sync completed', { updatedAt: this.lastSyncTime });
    } finally {
      this.syncInProgress = false;
    }
  }

  private async uploadLocalFile(relativePath: string): Promise<void> {
    const fullPath = path.join(this.repoPath!, relativePath);
    const body = await fs.readFile(fullPath);
    await this.s3Adapter.putObject(this.toS3Key(relativePath), body);
  }

  private async downloadObjectToLocal(
    key: string,
    relativePath: string,
    lastModified?: Date
  ): Promise<void> {
    const localFilePath = path.join(this.repoPath!, relativePath);
    const content = await this.s3Adapter.getObject(key);
    await fs.mkdir(path.dirname(localFilePath), { recursive: true });
    await fs.writeFile(localFilePath, content);

    if (lastModified) {
      await fs.utimes(localFilePath, lastModified, lastModified);
    }
  }

  private async applyOrQueueOperation(operation: PendingS3Operation): Promise<void> {
    if (this.syncInProgress) {
      this.pendingOperations.push(operation);
      return;
    }

    this.syncInProgress = true;

    try {
      await this.applyOperation(operation);
    } catch (error) {
      this.pendingOperations.push(operation);
      this.schedulePendingSync();
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async applyPendingOperations(): Promise<void> {
    if (this.pendingOperations.length === 0) {
      return;
    }

    const pending = [...this.pendingOperations];
    this.pendingOperations = [];

    for (let index = 0; index < pending.length; index += 1) {
      const operation = pending[index];
      try {
        await this.applyOperation(operation);
      } catch (error) {
        logger.warn('Failed to apply pending S3 operation', { operation, error });
        this.pendingOperations = pending.slice(index);
        return;
      }
    }
  }

  private async applyOperation(operation: PendingS3Operation): Promise<void> {
    if (operation.type === 'delete') {
      await this.deleteRemotePath(operation.path);
      return;
    }

    if (operation.type === 'move') {
      await this.moveRemotePath(operation.from, operation.to);
      return;
    }

    await this.uploadLocalFile(operation.path);
  }

  private async deleteRemotePath(relativePath: string): Promise<void> {
    await this.ensureRepoReady();

    const key = this.toS3Key(relativePath);
    await this.s3Adapter.deleteObject(key);

    const prefix = this.ensureTrailingSlash(key);
    const objects = await this.s3Adapter.listObjects(prefix);
    for (const object of objects) {
      await this.s3Adapter.deleteObject(object.key);
    }
  }

  private async moveRemotePath(oldPath: string, newPath: string): Promise<void> {
    await this.ensureRepoReady();

    const newLocalPath = path.join(this.repoPath!, newPath);
    const stats = await fs.stat(newLocalPath);

    if (stats.isDirectory()) {
      const basePath = path.join(this.repoPath!, newPath);
      const localFiles = await this.listLocalFiles(basePath);
      for (const relativePath of localFiles) {
        const fullRelativePath = path.join(newPath, relativePath);
        await this.uploadLocalFile(fullRelativePath);
      }

      await this.deleteRemotePath(oldPath);
      return;
    }

    await this.uploadLocalFile(newPath);
    await this.deleteRemotePath(oldPath);
  }

  private ensureTrailingSlash(value: string): string {
    return value.endsWith('/') ? value : `${value}/`;
  }

  private schedulePendingSync(): void {
    if (this.pendingSyncTimer || this.syncInProgress) {
      return;
    }

    this.pendingSyncTimer = setTimeout(() => {
      this.pendingSyncTimer = null;
      void this.sync().catch((error) => {
        logger.debug('Deferred S3 sync failed', { error });
      });
    }, 1000);
  }

  private async countLocalChanges(): Promise<number> {
    await this.ensureRepoReady();

    const lastSync = this.lastSyncTime?.getTime() || 0;
    const files = await this.listLocalFiles(this.repoPath!);
    let count = 0;

    for (const relativePath of files) {
      const fullPath = path.join(this.repoPath!, relativePath);
      const stats = await fs.stat(fullPath);
      if (stats.mtime.getTime() > lastSync) {
        count += 1;
      }
    }

    return count;
  }

  private async countRemoteChanges(): Promise<number> {
    await this.ensureRepoReady();

    const lastSync = this.lastSyncTime?.getTime() || 0;
    const objects = await this.s3Adapter.listObjects(this.normalizedPrefix());

    if (!lastSync) {
      return objects.length;
    }

    return objects.filter((obj) => (obj.lastModified?.getTime() || 0) > lastSync).length;
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

  private shouldIgnoreEntry(name: string): boolean {
    if (name === '.git' || name === '.DS_Store') {
      return true;
    }
    if (name.startsWith('.notegit')) {
      return true;
    }
    return false;
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
