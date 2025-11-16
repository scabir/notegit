"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRepoHandlers = registerRepoHandlers;
const types_1 = require("../../shared/types");
const logger_1 = require("../utils/logger");
function registerRepoHandlers(ipcMain, repoService) {
    ipcMain.handle('repo:openOrClone', async (_event, settings) => {
        try {
            const result = await repoService.openOrClone(settings);
            return {
                ok: true,
                data: result,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to open or clone repository', { error });
            return {
                ok: false,
                error: error.code
                    ? error
                    : {
                        code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                        message: error.message || 'Failed to open or clone repository',
                        details: error,
                    },
            };
        }
    });
    ipcMain.handle('repo:getStatus', async () => {
        try {
            const status = await repoService.getStatus();
            return {
                ok: true,
                data: status,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get repository status', { error });
            return {
                ok: false,
                error: error.code
                    ? error
                    : {
                        code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                        message: error.message || 'Failed to get repository status',
                        details: error,
                    },
            };
        }
    });
    ipcMain.handle('repo:pull', async () => {
        try {
            await repoService.pull();
            return {
                ok: true,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to pull', { error });
            return {
                ok: false,
                error: error.code
                    ? error
                    : {
                        code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                        message: error.message || 'Failed to pull from remote',
                        details: error,
                    },
            };
        }
    });
    ipcMain.handle('repo:push', async () => {
        try {
            await repoService.push();
            return {
                ok: true,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to push', { error });
            return {
                ok: false,
                error: error.code
                    ? error
                    : {
                        code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                        message: error.message || 'Failed to push to remote',
                        details: error,
                    },
            };
        }
    });
    ipcMain.handle('repo:startAutoPush', async () => {
        try {
            repoService.startAutoPush();
            return {
                ok: true,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to start auto-push', { error });
            return {
                ok: false,
                error: {
                    code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                    message: error.message || 'Failed to start auto-push',
                    details: error,
                },
            };
        }
    });
}
