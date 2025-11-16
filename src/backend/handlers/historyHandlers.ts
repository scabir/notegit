import { IpcMain } from 'electron';
import {
  ApiResponse,
  CommitEntry,
  DiffHunk,
  ApiErrorCode,
} from '../../shared/types';
import { HistoryService } from '../services/HistoryService';
import { logger } from '../utils/logger';

export function registerHistoryHandlers(ipcMain: IpcMain, historyService: HistoryService): void {
  ipcMain.handle(
    'history:getForFile',
    async (_event, path: string): Promise<ApiResponse<CommitEntry[]>> => {
      try {
        const history = await historyService.getForFile(path);
        return {
          ok: true,
          data: history,
        };
      } catch (error: any) {
        logger.error('Failed to get file history', { path, error });
        return {
          ok: false,
          error: error.code
            ? error
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: error.message || 'Failed to get file history',
                details: error,
              },
        };
      }
    }
  );

  ipcMain.handle(
    'history:getVersion',
    async (_event, commitHash: string, path: string): Promise<ApiResponse<string>> => {
      try {
        const content = await historyService.getVersion(commitHash, path);
        return {
          ok: true,
          data: content,
        };
      } catch (error: any) {
        logger.error('Failed to get file version', { commitHash, path, error });
        return {
          ok: false,
          error: error.code
            ? error
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: error.message || 'Failed to get file version',
                details: error,
              },
        };
      }
    }
  );

  ipcMain.handle(
    'history:getDiff',
    async (_event, hash1: string, hash2: string, path: string): Promise<ApiResponse<DiffHunk[]>> => {
      try {
        const diff = await historyService.getDiff(hash1, hash2, path);
        return {
          ok: true,
          data: diff,
        };
      } catch (error: any) {
        logger.error('Failed to get diff', { hash1, hash2, path, error });
        return {
          ok: false,
          error: error.code
            ? error
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: error.message || 'Failed to get diff',
                details: error,
              },
        };
      }
    }
  );
}

