import { IpcMain } from 'electron';
import { SearchService } from '../services/SearchService';
import { ApiResponse, ApiErrorCode } from '../../shared/types/api';
import { logger } from '../utils/logger';

export function registerSearchHandlers(ipcMain: IpcMain, searchService: SearchService) {
  // Search across files
  ipcMain.handle(
    'search:query',
    async (_event, query: string, options?: { maxResults?: number }): Promise<ApiResponse<any>> => {
      try {
        const results = await searchService.search(query, options);
        return {
          ok: true,
          data: results,
        };
      } catch (error: any) {
        logger.error('Failed to execute search', { query, error });
        return {
          ok: false,
          error: error.code
            ? error
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: error.message || 'Failed to search',
                details: error,
              },
        };
      }
    }
  );
}

