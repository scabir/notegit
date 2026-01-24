import * as crypto from 'crypto';
import * as path from 'path';
import { GitAdapter } from '../adapters/GitAdapter';
import { FsAdapter } from '../adapters/FsAdapter';
import {
  RepoSettings,
  RepoStatus,
  ApiError,
  ApiErrorCode,
  GitRepoSettings,
} from '../../shared/types';
import { logger } from '../utils/logger';
import type { RepoProvider } from './types';

export class GitRepoProvider implements RepoProvider {
  readonly type = 'git' as const;
  private settings: GitRepoSettings | null = null;
  private repoPath: string | null = null;
  private autoSyncTimer: NodeJS.Timeout | null = null;
  private readonly AUTO_SYNC_INTERVAL = 30000;

  constructor(
    private gitAdapter: GitAdapter,
    private fsAdapter: FsAdapter
  ) {}

  configure(settings: RepoSettings): void {
    if (settings.provider !== 'git') {
      throw this.createError(
        ApiErrorCode.REPO_PROVIDER_MISMATCH,
        'GitRepoProvider configured with non-git settings',
        { provider: settings.provider }
      );
    }

    this.settings = settings;
    this.repoPath = settings.localPath || null;
  }

  async open(settings: RepoSettings): Promise<{ localPath: string }> {
    if (settings.provider !== 'git') {
      throw this.createError(
        ApiErrorCode.REPO_PROVIDER_MISMATCH,
        'GitRepoProvider cannot open non-git repository',
        { provider: settings.provider }
      );
    }

    this.configure(settings);

    const localPath = settings.localPath;
    if (!localPath) {
      throw this.createError(
        ApiErrorCode.VALIDATION_ERROR,
        'Local path is required for Git repository',
        null
      );
    }

    const exists = await this.fsAdapter.exists(localPath);

    if (!exists) {
      logger.info('Git repo not found locally, cloning...', { localPath });

      try {
        await this.gitAdapter.clone(
          settings.remoteUrl,
          localPath,
          settings.branch,
          settings.pat
        );
      } catch (cloneError: any) {
        if (
          cloneError.message?.includes('Remote branch') &&
          cloneError.message?.includes('not found')
        ) {
          logger.info('Empty repository detected, initializing locally...', { localPath });

          await this.fsAdapter.mkdir(localPath, { recursive: true });
          await this.gitAdapter.init(localPath);

          const repoName = this.extractRepoName(settings.remoteUrl);
          const readmePath = path.join(localPath, 'README.md');
          await this.fsAdapter.writeFile(
            readmePath,
            `# ${repoName}\n\nThis repository was initialized by notegit.\n`
          );

          await this.gitAdapter.addRemote(settings.remoteUrl);
          await this.gitAdapter.add('README.md');
          await this.gitAdapter.commit('Initial commit from notegit');

          logger.info('Pushing initial commit to create remote branch...', {
            branch: settings.branch,
          });
          await this.gitAdapter.push(settings.pat);
        } else {
          throw cloneError;
        }
      }
    } else {
      logger.info('Git repo exists locally, opening...', { localPath });
      await this.gitAdapter.init(localPath);
    }

    this.repoPath = localPath;
    return { localPath };
  }

  async getStatus(): Promise<RepoStatus> {
    await this.ensureRepoReady();

    const gitStatus = await this.gitAdapter.status();
    const branch = await this.gitAdapter.getCurrentBranch();
    const { ahead, behind } = await this.gitAdapter.getAheadBehind();

    const status: RepoStatus = {
      provider: 'git',
      branch,
      ahead,
      behind,
      hasUncommitted: gitStatus.files.length > 0,
      pendingPushCount: ahead,
      needsPull: behind > 0,
    };

    logger.debug('Git repository status', { status });
    return status;
  }

  async fetch(): Promise<RepoStatus> {
    await this.ensureRepoReady();

    logger.info('Fetching from git remote');
    await this.gitAdapter.fetch();
    logger.info('Fetch completed successfully');

    return await this.getStatus();
  }

  async pull(): Promise<void> {
    await this.ensureRepoReady();

    if (!this.settings) {
      throw this.createError(
        ApiErrorCode.VALIDATION_ERROR,
        'Repository settings not found',
        null
      );
    }

    logger.info('Pulling from git remote');
    await this.gitAdapter.pull(this.settings.pat);
    logger.info('Pull completed successfully');
  }

  async push(): Promise<void> {
    await this.performPullThenPush();
  }

  startAutoSync(_intervalMs?: number): void {
    if (this.autoSyncTimer) {
      logger.debug('Git auto-sync timer already running');
      return;
    }

    logger.info('Starting git auto-sync timer', {
      intervalMs: this.AUTO_SYNC_INTERVAL,
    });

    this.autoSyncTimer = setInterval(async () => {
      try {
        await this.tryAutoPush();
      } catch (error) {
        logger.debug('Git auto-sync attempt failed, will retry', { error });
      }
    }, this.AUTO_SYNC_INTERVAL);
  }

  stopAutoSync(): void {
    if (this.autoSyncTimer) {
      logger.info('Stopping git auto-sync timer');
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }

  private async performPullThenPush(): Promise<void> {
    await this.ensureRepoReady();

    if (!this.settings) {
      throw this.createError(
        ApiErrorCode.VALIDATION_ERROR,
        'Repository settings not found',
        null
      );
    }

    logger.info('Performing git pull-then-push sync');

    await this.gitAdapter.fetch();

    const { ahead, behind } = await this.gitAdapter.getAheadBehind();

    if (behind > 0) {
      logger.info('Remote has changes, pulling', { behind });
      try {
        await this.gitAdapter.pull(this.settings.pat);
      } catch (error: any) {
        if (
          error.code === ApiErrorCode.GIT_CONFLICT ||
          error.message?.includes('CONFLICT') ||
          error.message?.includes('Automatic merge failed')
        ) {
          logger.warn('Merge conflict detected, committing conflicted state');

          await this.gitAdapter.add('.');
          await this.gitAdapter.commit('Merge remote changes - conflicts present');

          logger.info('Conflicts committed with markers');
        } else {
          throw error;
        }
      }
    }

    logger.info('Pushing to remote', { ahead });
    await this.gitAdapter.push(this.settings.pat);
    logger.info('Push completed successfully');
  }

  private async tryAutoPush(): Promise<void> {
    if (!this.repoPath) {
      return;
    }

    try {
      const status = await this.getStatus();

      if (status.ahead === 0) {
        return;
      }

      logger.debug('Git auto-push: commits waiting', { ahead: status.ahead });

      await this.gitAdapter.fetch();

      logger.info('Git auto-push: syncing');
      await this.performPullThenPush();

      logger.info('Git auto-push: push successful', {
        commitsCount: status.ahead,
      });
    } catch (error) {
      logger.debug('Git auto-push: offline or failed', { error });
    }
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

    await this.gitAdapter.init(this.repoPath);
  }

  private extractRepoName(remoteUrl: string): string {
    const match = remoteUrl.match(/\/([^/]+?)(?:\.git)?$/);
    if (match) {
      return match[1];
    }

    return crypto.createHash('md5').update(remoteUrl).digest('hex').substring(0, 8);
  }

  private createError(code: ApiErrorCode, message: string, details?: any): ApiError {
    return {
      code,
      message,
      details,
    };
  }
}
