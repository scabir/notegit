import {
  RepoSettings,
  CommitEntry,
  DiffHunk,
  ApiError,
  ApiErrorCode,
  REPO_PROVIDERS,
} from '../../shared/types';
import type { HistoryProvider } from './types';

export class LocalHistoryProvider implements HistoryProvider {
  readonly type = REPO_PROVIDERS.local;

  configure(settings: RepoSettings): void {
    if (settings.provider !== REPO_PROVIDERS.local) {
      throw this.createError(
        ApiErrorCode.REPO_PROVIDER_MISMATCH,
        'LocalHistoryProvider configured with non-local settings',
        { provider: settings.provider }
      );
    }
  }

  async getForFile(_filePath: string): Promise<CommitEntry[]> {
    return [];
  }

  async getVersion(_versionId: string, _filePath: string): Promise<string> {
    throw this.createError(
      ApiErrorCode.VALIDATION_ERROR,
      'History is not available for local repositories',
      null
    );
  }

  async getDiff(_versionA: string, _versionB: string, _filePath: string): Promise<DiffHunk[]> {
    throw this.createError(
      ApiErrorCode.VALIDATION_ERROR,
      'History is not available for local repositories',
      null
    );
  }

  private createError(code: ApiErrorCode, message: string, details?: any): ApiError {
    return {
      code,
      message,
      details,
    };
  }
}
