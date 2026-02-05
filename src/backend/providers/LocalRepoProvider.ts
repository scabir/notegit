import { FsAdapter } from '../adapters/FsAdapter';
import {
  RepoSettings,
  RepoStatus,
  ApiError,
  ApiErrorCode,
  LocalRepoSettings,
  REPO_PROVIDERS,
} from '../../shared/types';
import type { RepoProvider } from './types';

export class LocalRepoProvider implements RepoProvider {
  readonly type = REPO_PROVIDERS.local;
  private settings: LocalRepoSettings | null = null;
  private repoPath: string | null = null;

  constructor(private fsAdapter: FsAdapter) { }

  configure(settings: RepoSettings): void {
    if (settings.provider !== REPO_PROVIDERS.local) {
      throw this.createError(
        ApiErrorCode.REPO_PROVIDER_MISMATCH,
        'LocalRepoProvider configured with non-local settings',
        { provider: settings.provider }
      );
    }

    this.settings = settings;
    this.repoPath = settings.localPath || null;
  }

  async open(settings: RepoSettings): Promise<{ localPath: string }> {
    if (settings.provider !== REPO_PROVIDERS.local) {
      throw this.createError(
        ApiErrorCode.REPO_PROVIDER_MISMATCH,
        'LocalRepoProvider cannot open non-local repository',
        { provider: settings.provider }
      );
    }

    this.configure(settings);

    const localPath = settings.localPath;
    if (!localPath) {
      throw this.createError(
        ApiErrorCode.VALIDATION_ERROR,
        'Local path is required for local repository',
        null
      );
    }

    const exists = await this.fsAdapter.exists(localPath);
    if (!exists) {
      await this.fsAdapter.mkdir(localPath, { recursive: true });
    } else {
      const stats = await this.fsAdapter.stat(localPath);
      if (!stats.isDirectory()) {
        throw this.createError(
          ApiErrorCode.VALIDATION_ERROR,
          'Local path must be a directory',
          { localPath }
        );
      }
    }

    this.repoPath = localPath;
    return { localPath };
  }

  async getStatus(): Promise<RepoStatus> {
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

    return {
      provider: REPO_PROVIDERS.local,
      branch: REPO_PROVIDERS.local,
      ahead: 0,
      behind: 0,
      hasUncommitted: false,
      pendingPushCount: 0,
      needsPull: false,
    };
  }

  async fetch(): Promise<RepoStatus> {
    throw this.createError(
      ApiErrorCode.VALIDATION_ERROR,
      'Local repositories do not support fetch',
      null
    );
  }

  async pull(): Promise<void> {
    throw this.createError(
      ApiErrorCode.VALIDATION_ERROR,
      'Local repositories do not support pull',
      null
    );
  }

  async push(): Promise<void> {
    throw this.createError(
      ApiErrorCode.VALIDATION_ERROR,
      'Local repositories do not support push',
      null
    );
  }

  startAutoSync(): void {
    // No-op for local repositories
  }

  stopAutoSync(): void {
    // No-op for local repositories
  }

  private createError(code: ApiErrorCode, message: string, details?: any): ApiError {
    return {
      code,
      message,
      details,
    };
  }
}
