import simpleGit, { SimpleGit } from 'simple-git';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ApiError, ApiErrorCode } from '../../shared/types';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export class GitAdapter {
  private git: SimpleGit | null = null;
  private repoPath: string | null = null;

  /**
   * Check if Git CLI is installed on the system
   */
  async checkGitInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('git --version');
      logger.info('Git CLI found', { version: stdout.trim() });
      return true;
    } catch (error) {
      logger.error('Git CLI not found', { error });
      return false;
    }
  }

  /**
   * Initialize Git adapter for a specific repository
   */
  async init(repoPath: string): Promise<void> {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
    logger.debug('GitAdapter initialized', { repoPath });
  }

  /**
   * Clone a repository
   */
  async clone(remoteUrl: string, localPath: string, branch: string, pat?: string): Promise<void> {
    try {
      logger.info('Cloning repository', { remoteUrl, localPath, branch });

      // If PAT is provided, inject it into the URL for HTTPS auth
      let authUrl = remoteUrl;
      if (pat && remoteUrl.startsWith('https://')) {
        // Format: https://PAT@github.com/user/repo.git
        authUrl = remoteUrl.replace('https://', `https://${pat}@`);
      }

      await simpleGit().clone(authUrl, localPath, ['--branch', branch]);
      
      // Initialize for this repo
      await this.init(localPath);
      
      logger.info('Repository cloned successfully');
    } catch (error: any) {
      logger.error('Failed to clone repository', { error });
      
      if (error.message?.includes('Authentication failed')) {
        throw this.createError(
          ApiErrorCode.GIT_AUTH_FAILED,
          'Authentication failed. Please check your credentials.',
          error
        );
      }
      
      throw this.createError(
        ApiErrorCode.GIT_CLONE_FAILED,
        `Failed to clone repository: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get repository status
   */
  async status(): Promise<any> {
    this.ensureInitialized();
    
    try {
      const status = await this.git!.status();
      logger.debug('Git status', { status });
      return status;
    } catch (error: any) {
      logger.error('Failed to get git status', { error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to get git status: ${error.message}`,
        error
      );
    }
  }

  /**
   * Pull from remote
   */
  async pull(pat?: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      logger.info('Pulling from remote');
      
      // Set up credentials if PAT provided
      if (pat) {
        await this.configureAuth(pat);
      }
      
      await this.git!.pull();
      logger.info('Pull completed successfully');
    } catch (error: any) {
      logger.error('Failed to pull', { error });
      
      if (error.message?.includes('Authentication failed') || error.message?.includes('403')) {
        throw this.createError(
          ApiErrorCode.GIT_AUTH_FAILED,
          'Authentication failed during pull',
          error
        );
      }
      
      if (error.message?.includes('CONFLICT')) {
        throw this.createError(
          ApiErrorCode.GIT_CONFLICT,
          'Merge conflict detected. Please resolve conflicts manually.',
          error
        );
      }
      
      throw this.createError(
        ApiErrorCode.GIT_PULL_FAILED,
        `Failed to pull: ${error.message}`,
        error
      );
    }
  }

  /**
   * Push to remote
   */
  async push(pat?: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      logger.info('Pushing to remote');
      
      // Set up credentials if PAT provided
      if (pat) {
        await this.configureAuth(pat);
      }
      
      await this.git!.push();
      logger.info('Push completed successfully');
    } catch (error: any) {
      logger.error('Failed to push', { error });
      
      if (error.message?.includes('Authentication failed') || error.message?.includes('403')) {
        throw this.createError(
          ApiErrorCode.GIT_AUTH_FAILED,
          'Authentication failed during push',
          error
        );
      }
      
      throw this.createError(
        ApiErrorCode.GIT_PUSH_FAILED,
        `Failed to push: ${error.message}`,
        error
      );
    }
  }

  /**
   * Fetch from remote (used for connection check)
   */
  async fetch(): Promise<void> {
    this.ensureInitialized();
    
    try {
      logger.debug('Fetching from remote');
      await this.git!.fetch();
    } catch (error: any) {
      logger.debug('Fetch failed (may be offline)', { error });
      throw error;
    }
  }

  /**
   * Add file to staging
   */
  async add(filePath: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.git!.add(filePath);
      logger.debug('File added to staging', { filePath });
    } catch (error: any) {
      logger.error('Failed to add file', { filePath, error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to add file: ${error.message}`,
        error
      );
    }
  }

  /**
   * Commit staged changes
   */
  async commit(message: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.git!.commit(message);
      logger.info('Commit created', { message });
    } catch (error: any) {
      logger.error('Failed to commit', { error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to commit: ${error.message}`,
        error
      );
    }
  }

  /**
   * Add remote repository
   */
  async addRemote(remoteUrl: string, name: string = 'origin'): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.git!.addRemote(name, remoteUrl);
      logger.info('Remote added', { name, remoteUrl });
    } catch (error: any) {
      logger.error('Failed to add remote', { error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to add remote: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get commit log for a file
   */
  async log(filePath?: string): Promise<any[]> {
    this.ensureInitialized();
    
    try {
      const options: any = {
        file: filePath,
        maxCount: 100, // Limit to last 100 commits
      };
      
      const log = await this.git!.log(options);
      logger.debug('Retrieved git log', { fileCount: log.all.length });
      return [...log.all]; // Create mutable copy
    } catch (error: any) {
      logger.error('Failed to get git log', { error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to get git log: ${error.message}`,
        error
      );
    }
  }

  /**
   * Show file content at specific commit
   */
  async show(commitHash: string, filePath: string): Promise<string> {
    this.ensureInitialized();
    
    try {
      const content = await this.git!.show([`${commitHash}:${filePath}`]);
      logger.debug('Retrieved file content from commit', { commitHash, filePath });
      return content;
    } catch (error: any) {
      logger.error('Failed to show file from commit', { commitHash, filePath, error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to show file: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get diff between commits
   */
  async diff(commit1: string, commit2: string, filePath?: string): Promise<string> {
    this.ensureInitialized();
    
    try {
      const args = [commit1, commit2];
      if (filePath) {
        args.push('--', filePath);
      }
      
      const diff = await this.git!.diff(args);
      logger.debug('Retrieved diff', { commit1, commit2, filePath });
      return diff;
    } catch (error: any) {
      logger.error('Failed to get diff', { commit1, commit2, error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to get diff: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get count of commits ahead/behind remote
   */
  async getAheadBehind(): Promise<{ ahead: number; behind: number }> {
    this.ensureInitialized();
    
    try {
      const status = await this.git!.status();
      return {
        ahead: status.ahead,
        behind: status.behind,
      };
    } catch (error: any) {
      logger.error('Failed to get ahead/behind count', { error });
      return { ahead: 0, behind: 0 };
    }
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    this.ensureInitialized();
    
    try {
      const status = await this.git!.status();
      return status.current || 'main';
    } catch (error: any) {
      logger.error('Failed to get current branch', { error });
      return 'main';
    }
  }

  private async configureAuth(pat: string): Promise<void> {
    // Configure git credential helper to use PAT
    // This is a simple approach - for production, might want credential caching
    await this.git!.addConfig('credential.helper', 'store');
  }

  private ensureInitialized(): void {
    if (!this.git || !this.repoPath) {
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        'GitAdapter not initialized. Call init() first.',
        null
      );
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

