import { IpcMain } from 'electron';
import { LogsService } from '../services/LogsService';
import { ApiResponse } from '../../shared/types';
import { logger } from '../utils/logger';

export function registerLogsHandlers(ipcMain: IpcMain, logsService: LogsService): void {
    // Get log content
    ipcMain.handle('logs:getContent', async (_, logType: 'combined' | 'error'): Promise<ApiResponse<string>> => {
        try {
            const content = await logsService.getLogContent(logType);
            return { ok: true, data: content };
        } catch (error: any) {
            logger.error('Failed to get log content', { error });
            return {
                ok: false,
                error: {
                    code: error.code || 'UNKNOWN_ERROR',
                    message: error.message || 'Failed to get log content',
                    details: error,
                },
            };
        }
    });

    // Export logs
    ipcMain.handle('logs:export', async (_, logType: 'combined' | 'error', destPath: string): Promise<ApiResponse<void>> => {
        try {
            await logsService.exportLogs(logType, destPath);
            return { ok: true };
        } catch (error: any) {
            logger.error('Failed to export logs', { error });
            return {
                ok: false,
                error: {
                    code: error.code || 'UNKNOWN_ERROR',
                    message: error.message || 'Failed to export logs',
                    details: error,
                },
            };
        }
    });
}
