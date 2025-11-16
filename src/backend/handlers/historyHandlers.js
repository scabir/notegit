"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHistoryHandlers = registerHistoryHandlers;
const types_1 = require("../../shared/types");
const logger_1 = require("../utils/logger");
function registerHistoryHandlers(ipcMain, historyService) {
    ipcMain.handle('history:getForFile', async (_event, path) => {
        try {
            const history = await historyService.getForFile(path);
            return {
                ok: true,
                data: history,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get file history', { path, error });
            return {
                ok: false,
                error: error.code
                    ? error
                    : {
                        code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                        message: error.message || 'Failed to get file history',
                        details: error,
                    },
            };
        }
    });
    ipcMain.handle('history:getVersion', async (_event, commitHash, path) => {
        try {
            const content = await historyService.getVersion(commitHash, path);
            return {
                ok: true,
                data: content,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get file version', { commitHash, path, error });
            return {
                ok: false,
                error: error.code
                    ? error
                    : {
                        code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                        message: error.message || 'Failed to get file version',
                        details: error,
                    },
            };
        }
    });
    ipcMain.handle('history:getDiff', async (_event, hash1, hash2, path) => {
        try {
            const diff = await historyService.getDiff(hash1, hash2, path);
            return {
                ok: true,
                data: diff,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get diff', { hash1, hash2, path, error });
            return {
                ok: false,
                error: error.code
                    ? error
                    : {
                        code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                        message: error.message || 'Failed to get diff',
                        details: error,
                    },
            };
        }
    });
}
