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
  private readonly AUTO_PUSH_INTERVAL = 30000; // 30 seconds
  private currentRepoPath: string | null = null;
  private filesService: FilesService | null = null;

  constructor(
    private gitAdapter: GitAdapter,
    private fsAdapter: FsAdapter,
    private configService: ConfigService
  ) { }

  /**
   * Set FilesService (to avoid circular dependency)
   */
  setFilesService(filesService: FilesService): void {
    this.filesService = filesService;
  }

  /**
   * Open existing repo or clone new one
   */
  async openOrClone(settings: RepoSettings): Promise<OpenOrCloneRepoResponse> {
    logger.info('Opening or cloning repository', {
      remoteUrl: settings.remoteUrl,
      branch: settings.branch,
    });

    // Determine local path (in app data directory)
    const reposDir = path.join(app.getPath('userData'), 'repos');
    await this.fsAdapter.mkdir(reposDir, { recursive: true });

    // Extract repo name from URL
    const repoName = this.extractRepoName(settings.remoteUrl);
    const localPath = path.join(reposDir, repoName);

    try {
      // Check if repo already exists
      const exists = await this.fsAdapter.exists(localPath);

      if (!exists) {
        // Clone the repository
        logger.info('Repository not found locally, cloning...', { localPath });

        try {
          await this.gitAdapter.clone(settings.remoteUrl, localPath, settings.branch, settings.pat);
        } catch (cloneError: any) {
          // Handle empty repository (no branches exist yet)
          if (cloneError.message?.includes('Remote branch') && cloneError.message?.includes('not found')) {
            logger.info('Empty repository detected, initializing locally...', { localPath });

            // Create directory and initialize git
            await this.fsAdapter.mkdir(localPath, { recursive: true });
            await this.gitAdapter.init(localPath);

            // Create initial README
            const readmePath = path.join(localPath, 'README.md');
            await this.fsAdapter.writeFile(readmePath, `# ${repoName}\n\nThis repository was initialized by notegit.\n`);

            // Configure remote
            await this.gitAdapter.addRemote(settings.remoteUrl);

            // Create initial commit
            await this.gitAdapter.add('README.md');
            await this.gitAdapter.commit('Initial commit from notegit');

            // Push to create the branch
            logger.info('Pushing initial commit to create remote branch...', { branch: settings.branch });
            await this.gitAdapter.push(settings.pat);

            logger.info('Successfully initialized empty repository');
          } else {
            throw cloneError;
          }
        }
      } else {
        // Initialize Git adapter for existing repo
        logger.info('Repository exists locally, opening...', { localPath });
        await this.gitAdapter.init(localPath);
      }

      this.currentRepoPath = localPath;

      // Update local path in settings
      settings.localPath = localPath;
      await this.configService.updateRepoSettings(settings);

      // Get initial status
      const status = await this.getStatus();

      // Build file tree
      let tree: FileTreeNode[] = [];
      if (this.filesService) {
        await this.filesService.init();
        tree = await this.filesService.listTree();
      }

      // Start auto-push mechanism
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

  /**
   * Get current repository status
   */
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

  /**
   * Fetch from remote and return updated status
   */
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

      // Return updated status with needsPull flag
      return await this.getStatus();
    } catch (error: any) {
      logger.error('Failed to fetch', { error });
      throw error;
    }
  }

  /**
   * Pull from remote
   */
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

  /**
   * Push to remote (with pull-then-push pattern)
   */
  async push(): Promise<void> {
    await this.performPullThenPush();
  }

  /**
   * Perform pull-then-push operation
   * Ensures remote changes are merged before pushing
   */
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

      // 1. Fetch to update remote refs
      await this.gitAdapter.fetch();

      // 2. Check if behind
      const { ahead, behind } = await this.gitAdapter.getAheadBehind();

      // 3. Pull if remote has changes
      if (behind > 0) {
        logger.info('Remote has changes, pulling', { behind });
        try {
          await this.gitAdapter.pull(repoSettings.pat);
        } catch (error: any) {
          // Check if it's a merge conflict
          if (error.code === ApiErrorCode.GIT_CONFLICT ||
            error.message?.includes('CONFLICT') ||
            error.message?.includes('Automatic merge failed')) {
            logger.warn('Merge conflict detected, committing conflicted state');

            // Stage all files (including conflicted ones)
            await this.gitAdapter.add('.');

            // Commit with conflict markers preserved
            await this.gitAdapter.commit('Merge remote changes - conflicts present');

            logger.info('Conflicts committed with markers');
          } else {
            // Other error, rethrow
            throw error;
          }
        }
      }

      // 4. Push
      logger.info('Pushing to remote');
      await this.gitAdapter.push(repoSettings.pat);
      logger.info('Push completed successfully');

    } catch (error: any) {
      logger.error('Pull-then-push failed', { error });
      throw error;
    }
  }

  /**
   * Start auto-push timer
   * Periodically checks connection and pushes if there are commits waiting
   */
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
        // Silently fail - will retry on next interval
        logger.debug('Auto-push attempt failed, will retry', { error });
      }
    }, this.AUTO_PUSH_INTERVAL);
  }

  /**
   * Stop auto-push timer
   */
  stopAutoPush(): void {
    if (this.autoPushTimer) {
      logger.info('Stopping auto-push timer');
      clearInterval(this.autoPushTimer);
      this.autoPushTimer = null;
    }
  }

  /**
   * Try to push pending commits if connection is available
   */
  private async tryAutoPush(): Promise<void> {
    if (!this.currentRepoPath) {
      return;
    }

    try {
      // Get current status
      const status = await this.getStatus();

      // If there are no commits to push, do nothing
      if (status.ahead === 0) {
        return;
      }

      logger.debug('Auto-push: commits waiting', { ahead: status.ahead });

      // Try to fetch to check connection
      const repoSettings = await this.configService.getRepoSettings();
      if (!repoSettings) {
        return;
      }

      await this.gitAdapter.fetch();

      // If fetch succeeded, use performPullThenPush
      logger.info('Auto-push: connection available, syncing');
      await this.performPullThenPush();

      logger.info('Auto-push: push successful', {
        commitsCount: status.ahead,
      });
    } catch (error) {
      // Failed to fetch or push - probably offline
      logger.debug('Auto-push: offline or failed', { error });
    }
  }

  /**
   * Extract repository name from Git URL
   */
  private extractRepoName(remoteUrl: string): string {
    // Extract repo name from URLs like:
    // https://github.com/user/repo.git
    // git@github.com:user/repo.git
    const match = remoteUrl.match(/\/([^\/]+?)(?:\.git)?$/);
    if (match) {
      return match[1];
    }

    // Fallback to hash of URL
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

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    this.stopAutoPush();
  }
}

