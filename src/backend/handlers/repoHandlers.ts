import { IpcMain } from 'electron';
import {
  ApiResponse,
  OpenOrCloneRepoResponse,
  RepoStatus,
  RepoSettings,
  ApiErrorCode,
} from '../../shared/types';
import { RepoService } from '../services/RepoService';
import { logger } from '../utils/logger';

export function registerRepoHandlers(ipcMain: IpcMain, repoService: RepoService): void {
  ipcMain.handle(
    'repo:openOrClone',
    async (_event, settings: RepoSettings): Promise<ApiResponse<OpenOrCloneRepoResponse>> => {
      try {
        const result = await repoService.openOrClone(settings);
        return {
          ok: true,
          data: result,
        };
      } catch (error: any) {
        logger.error('Failed to open or clone repository', { error });
        return {
          ok: false,
          error: error.code
            ? error
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: error.message || 'Failed to open or clone repository',
                details: error,
              },
        };
      }
    }
  );

  ipcMain.handle('repo:getStatus', async (): Promise<ApiResponse<RepoStatus>> => {
    try {
      const status = await repoService.getStatus();
      return {
        ok: true,
        data: status,
      };
    } catch (error: any) {
      logger.error('Failed to get repository status', { error });
      return {
        ok: false,
        error: error.code
          ? error
          : {
              code: ApiErrorCode.UNKNOWN_ERROR,
              message: error.message || 'Failed to get repository status',
              details: error,
            },
      };
    }
  });

  ipcMain.handle('repo:pull', async (): Promise<ApiResponse<void>> => {
    try {
      await repoService.pull();
      return {
        ok: true,
      };
    } catch (error: any) {
      logger.error('Failed to pull', { error });
      return {
        ok: false,
        error: error.code
          ? error
          : {
              code: ApiErrorCode.UNKNOWN_ERROR,
              message: error.message || 'Failed to pull from remote',
              details: error,
            },
      };
    }
  });

  ipcMain.handle('repo:push', async (): Promise<ApiResponse<void>> => {
    try {
      await repoService.push();
      return {
        ok: true,
      };
    } catch (error: any) {
      logger.error('Failed to push', { error });
      return {
        ok: false,
        error: error.code
          ? error
          : {
              code: ApiErrorCode.UNKNOWN_ERROR,
              message: error.message || 'Failed to push to remote',
              details: error,
            },
      };
    }
  });

  ipcMain.handle('repo:startAutoPush', async (): Promise<ApiResponse<void>> => {
    try {
      repoService.startAutoPush();
      return {
        ok: true,
      };
    } catch (error: any) {
      logger.error('Failed to start auto-push', { error });
      return {
        ok: false,
        error: {
          code: ApiErrorCode.UNKNOWN_ERROR,
          message: error.message || 'Failed to start auto-push',
          details: error,
        },
      };
    }
  });
}

