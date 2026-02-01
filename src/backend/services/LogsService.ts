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

    async getLogContent(logType: 'combined' | 'error'): Promise<string> {
        try {
            const logFilePath = await this.getLatestLogFilePath(logType);
            if (!logFilePath) {
                return `No ${logType} logs yet.`;
            }

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

    getLogsDirectory(): string {
        return this.logsDir;
    }

    private getLogFilePrefix(logType: 'combined' | 'error'): string {
        return logType === 'combined' ? 'combined-' : 'error-';
    }

    private async getLatestLogFilePath(logType: 'combined' | 'error'): Promise<string | null> {
        try {
            const entries = await fs.readdir(this.logsDir);
            const prefix = this.getLogFilePrefix(logType);
            const candidates = entries
                .filter((name) => name.startsWith(prefix) && name.endsWith('.log'))
                .sort();

            if (candidates.length === 0) {
                return null;
            }

            const latest = candidates[candidates.length - 1];
            return path.join(this.logsDir, latest);
        } catch (error: any) {
            if (error?.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    async exportLogs(logType: 'combined' | 'error', destPath: string): Promise<void> {
        try {
            const logFilePath = await this.getLatestLogFilePath(logType);
            if (!logFilePath) {
                throw this.createError(
                    ApiErrorCode.FS_NOT_FOUND,
                    `Log file not found: ${logType}`,
                    null
                );
            }

            await fs.copyFile(logFilePath, destPath);

            logger.info('Logs exported successfully', { logType, destPath });
        } catch (error: any) {
            logger.error('Failed to export logs', { logType, destPath, error });
            if (error?.code === ApiErrorCode.FS_NOT_FOUND) {
                throw error;
            }
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
