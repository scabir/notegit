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

export class S3RepoProvider implements RepoProvider {
  type: 's3' = 's3';
  private settings: S3RepoSettings | null = null;
  private repoPath: string | null = null;
  private autoSyncTimer: NodeJS.Timeout | null = null;
  private readonly AUTO_SYNC_INTERVAL = 30000;
  private lastSyncTime: Date | null = null;
  private syncInProgress = false;

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

      const content = await this.s3Adapter.getObject(object.key);
      await fs.mkdir(path.dirname(localFilePath), { recursive: true });
      await fs.writeFile(localFilePath, content);

      if (object.lastModified) {
        await fs.utimes(localFilePath, object.lastModified, object.lastModified);
      }
    }

    this.lastSyncTime = new Date();
    logger.info('S3 pull completed', { updatedAt: this.lastSyncTime });
  }

  async push(): Promise<void> {
    await this.sync();
  }

  startAutoSync(): void {
    if (this.autoSyncTimer) {
      logger.debug('S3 auto-sync timer already running');
      return;
    }

    logger.info('Starting S3 auto-sync timer', {
      intervalMs: this.AUTO_SYNC_INTERVAL,
    });

    this.autoSyncTimer = setInterval(async () => {
      try {
        await this.sync();
      } catch (error) {
        logger.debug('S3 auto-sync attempt failed, will retry', { error });
      }
    }, this.AUTO_SYNC_INTERVAL);
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
      await this.pull();
      await this.pushLocalChanges();
    } finally {
      this.syncInProgress = false;
    }
  }

  private async pushLocalChanges(): Promise<void> {
    await this.ensureRepoReady();

    const localFiles = await this.listLocalFiles(this.repoPath!);
    const prefix = this.normalizedPrefix();
    const remoteObjects = await this.s3Adapter.listObjects(prefix);
    const remoteMap = new Map(
      remoteObjects.map((obj) => [obj.key, obj.lastModified?.getTime() || 0])
    );

    for (const relativePath of localFiles) {
      const fullPath = path.join(this.repoPath!, relativePath);
      const stats = await fs.stat(fullPath);
      const key = this.toS3Key(relativePath);
      const remoteMtime = remoteMap.get(key) || 0;

      if (stats.mtime.getTime() <= remoteMtime) {
        continue;
      }

      const body = await fs.readFile(fullPath);
      await this.s3Adapter.putObject(key, body);
    }

    this.lastSyncTime = new Date();
    logger.info('S3 push completed', { updatedAt: this.lastSyncTime });
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
