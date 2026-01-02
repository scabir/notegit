import * as path from 'path';
import { app } from 'electron';
import { GitAdapter } from '../adapters/GitAdapter';
import { FsAdapter } from '../adapters/FsAdapter';
import { ConfigService } from './ConfigService';
import type { FilesService } from './FilesService';
import {
  RepoSettings,
  RepoStatus,
  OpenOrCloneRepoResponse,
  FileTreeNode,
  ApiError,
  ApiErrorCode,
} from '../../shared/types';
import { logger } from '../utils/logger';

export class RepoService {
  private autoPushTimer: NodeJS.Timeout | null = null;
  private readonly AUTO_PUSH_INTERVAL = 30000;
  private currentRepoPath: string | null = null;
  private filesService: FilesService | null = null;

  constructor(
    private gitAdapter: GitAdapter,
    private fsAdapter: FsAdapter,
    private configService: ConfigService
  ) { }

  setFilesService(filesService: FilesService): void {
    this.filesService = filesService;
  }

  async openOrClone(settings: RepoSettings): Promise<OpenOrCloneRepoResponse> {
    logger.info('Opening or cloning repository', {
      remoteUrl: settings.remoteUrl,
      branch: settings.branch,
    });

    const reposDir = path.join(app.getPath('userData'), 'repos');
    await this.fsAdapter.mkdir(reposDir, { recursive: true });

    const repoName = this.extractRepoName(settings.remoteUrl);
    const localPath = path.join(reposDir, repoName);

    try {
      const exists = await this.fsAdapter.exists(localPath);

    if (!exists) {
        logger.info('Repository not found locally, cloning...', { localPath });

        try {
          await this.gitAdapter.clone(settings.remoteUrl, localPath, settings.branch, settings.pat);
        } catch (cloneError: any) {
    if (cloneError.message?.includes('Remote branch') && cloneError.message?.includes('not found')) {
            logger.info('Empty repository detected, initializing locally...', { localPath });

            await this.fsAdapter.mkdir(localPath, { recursive: true });
            await this.gitAdapter.init(localPath);

            const readmePath = path.join(localPath, 'README.md');
            await this.fsAdapter.writeFile(readmePath, `# ${repoName}\n\nThis repository was initialized by notegit.\n`);

            await this.gitAdapter.addRemote(settings.remoteUrl);

            await this.gitAdapter.add('README.md');
            await this.gitAdapter.commit('Initial commit from notegit');

            logger.info('Pushing initial commit to create remote branch...', { branch: settings.branch });
            await this.gitAdapter.push(settings.pat);

            logger.info('Successfully initialized empty repository');
          } else {
            throw cloneError;
          }
        }
      } else {
        logger.info('Repository exists locally, opening...', { localPath });
        await this.gitAdapter.init(localPath);
      }

      this.currentRepoPath = localPath;

      settings.localPath = localPath;
      await this.configService.updateRepoSettings(settings);

      const status = await this.getStatus();

      let tree: FileTreeNode[] = [];
    if (this.filesService) {
        await this.filesService.init();
        tree = await this.filesService.listTree();
      }

      this.startAutoPush();

      return {
        localPath,
        tree,
        status,
      };
    } catch (error: any) {
      logger.error('Failed to open or clone repository', { error });
      throw error;
    }
  }

  async getStatus(): Promise<RepoStatus> {
    if (!this.currentRepoPath) {
      const repoSettings = await this.configService.getRepoSettings();
    if (repoSettings?.localPath) {
        this.currentRepoPath = repoSettings.localPath;
        await this.gitAdapter.init(this.currentRepoPath);
      } else {
        throw this.createError(
          ApiErrorCode.VALIDATION_ERROR,
          'No repository configured',
          null
        );
      }
    }

    try {
      const gitStatus = await this.gitAdapter.status();
      const branch = await this.gitAdapter.getCurrentBranch();
      const { ahead, behind } = await this.gitAdapter.getAheadBehind();

      const status: RepoStatus = {
        branch,
        ahead,
        behind,
        hasUncommitted: gitStatus.files.length > 0,
        pendingPushCount: ahead,
        needsPull: behind > 0,
      };

      logger.debug('Repository status', { status });
      return status;
    } catch (error: any) {
      logger.error('Failed to get repository status', { error });
      throw error;
    }
  }

  async fetch(): Promise<RepoStatus> {
    if (!this.currentRepoPath) {
      throw this.createError(
        ApiErrorCode.VALIDATION_ERROR,
        'No repository configured',
        null
      );
    }

    try {
      logger.info('Fetching from remote');
      await this.gitAdapter.fetch();
      logger.info('Fetch completed successfully');

      return await this.getStatus();
    } catch (error: any) {
      logger.error('Failed to fetch', { error });
      throw error;
    }
  }

  async pull(): Promise<void> {
    if (!this.currentRepoPath) {
      throw this.createError(
        ApiErrorCode.VALIDATION_ERROR,
        'No repository configured',
        null
      );
    }

    try {
      const repoSettings = await this.configService.getRepoSettings();
    if (!repoSettings) {
        throw this.createError(
          ApiErrorCode.VALIDATION_ERROR,
          'Repository settings not found',
          null
        );
      }

      logger.info('Pulling from remote');
      await this.gitAdapter.pull(repoSettings.pat);
      logger.info('Pull completed successfully');
    } catch (error: any) {
      logger.error('Failed to pull', { error });
      throw error;
    }
  }

  async push(): Promise<void> {
    await this.performPullThenPush();
  }

  private async performPullThenPush(): Promise<void> {
    if (!this.currentRepoPath) {
      throw this.createError(
        ApiErrorCode.VALIDATION_ERROR,
        'No repository configured',
        null
      );
    }

    try {
      const repoSettings = await this.configService.getRepoSettings();
    if (!repoSettings) {
        throw this.createError(
          ApiErrorCode.VALIDATION_ERROR,
          'Repository settings not found',
          null
        );
      }

      logger.info('Performing pull-then-push sync');

      await this.gitAdapter.fetch();

      const { ahead, behind } = await this.gitAdapter.getAheadBehind();

    if (behind > 0) {
        logger.info('Remote has changes, pulling', { behind });
        try {
          await this.gitAdapter.pull(repoSettings.pat);
        } catch (error: any) {
    if (error.code === ApiErrorCode.GIT_CONFLICT ||
            error.message?.includes('CONFLICT') ||
            error.message?.includes('Automatic merge failed')) {
            logger.warn('Merge conflict detected, committing conflicted state');

            await this.gitAdapter.add('.');

            await this.gitAdapter.commit('Merge remote changes - conflicts present');

            logger.info('Conflicts committed with markers');
          } else {
            throw error;
          }
        }
      }

      logger.info('Pushing to remote');
      await this.gitAdapter.push(repoSettings.pat);
      logger.info('Push completed successfully');

    } catch (error: any) {
      logger.error('Pull-then-push failed', { error });
      throw error;
    }
  }

  startAutoPush(): void {
    if (this.autoPushTimer) {
      logger.debug('Auto-push timer already running');
      return;
    }

    logger.info('Starting auto-push timer', {
      intervalMs: this.AUTO_PUSH_INTERVAL,
    });

    this.autoPushTimer = setInterval(async () => {
      try {
        await this.tryAutoPush();
      } catch (error) {
        logger.debug('Auto-push attempt failed, will retry', { error });
      }
    }, this.AUTO_PUSH_INTERVAL);
  }

  stopAutoPush(): void {
    if (this.autoPushTimer) {
      logger.info('Stopping auto-push timer');
  clearInterval(this.autoPushTimer);
      this.autoPushTimer = null;
    }
  }

  private async tryAutoPush(): Promise<void> {
    if (!this.currentRepoPath) {
      return;
    }

    try {
      const status = await this.getStatus();

    if (status.ahead === 0) {
        return;
      }

      logger.debug('Auto-push: commits waiting', { ahead: status.ahead });

      const repoSettings = await this.configService.getRepoSettings();
    if (!repoSettings) {
        return;
      }

      await this.gitAdapter.fetch();

      logger.info('Auto-push: connection available, syncing');
      await this.performPullThenPush();

      logger.info('Auto-push: push successful', {
        commitsCount: status.ahead,
      });
    } catch (error) {
      logger.debug('Auto-push: offline or failed', { error });
    }
  }

  private extractRepoName(remoteUrl: string): string {
    const match = remoteUrl.match(/\/([^\/]+?)(?:\.git)?$/);
    if (match) {
      return match[1];
    }

    const crypto = require('crypto');
    return crypto.createHash('md5').update(remoteUrl).digest('hex').substring(0, 8);
  }

  private createError(code: ApiErrorCode, message: string, details?: any): ApiError {
    return {
      code,
      message,
      details,
    };
  }

  destroy(): void {
    this.stopAutoPush();
  }
}
