import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
import { ApiError, ApiErrorCode } from '../../shared/types';
import { logger } from '../utils/logger';

export class LogsService {
    private readonly logsDir: string;

    constructor() {
        const userDataPath = app.getPath('userData');
        this.logsDir = path.join(userDataPath, 'logs');
    }

    /**
     * Get the content of a log file
     */
    async getLogContent(logType: 'combined' | 'error'): Promise<string> {
        try {
            const logFilePath = this.getLogFilePath(logType);

            // Check if file exists
            try {
                await fs.access(logFilePath);
            } catch {
                // File doesn't exist yet, return empty
                return `No ${logType} logs yet.`;
            }

            // Read the log file
            const content = await fs.readFile(logFilePath, 'utf-8');

            return content || `Log file is empty.`;
        } catch (error: any) {
            logger.error('Failed to read log file', { logType, error });
            throw this.createError(
                ApiErrorCode.UNKNOWN_ERROR,
                `Failed to read ${logType} log: ${error.message}`,
                error
            );
        }
    }

    /**
     * Get the path to a log file
     */
    getLogFilePath(logType: 'combined' | 'error'): string {
        const fileName = logType === 'combined' ? 'combined.log' : 'error.log';
        return path.join(this.logsDir, fileName);
    }

    /**
     * Export log file to a specified destination
     */
    async exportLogs(logType: 'combined' | 'error', destPath: string): Promise<void> {
        try {
            const logFilePath = this.getLogFilePath(logType);

            // Check if source log file exists
            try {
                await fs.access(logFilePath);
            } catch {
                throw this.createError(
                    ApiErrorCode.FS_NOT_FOUND,
                    `Log file not found: ${logType}`,
                    null
                );
            }

            // Copy log file to destination
            await fs.copyFile(logFilePath, destPath);

            logger.info('Logs exported successfully', { logType, destPath });
        } catch (error: any) {
            logger.error('Failed to export logs', { logType, destPath, error });
            throw this.createError(
                ApiErrorCode.UNKNOWN_ERROR,
                `Failed to export ${logType} log: ${error.message}`,
                error
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
