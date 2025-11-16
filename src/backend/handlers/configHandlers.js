"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerConfigHandlers = registerConfigHandlers;
const types_1 = require("../../shared/types");
const logger_1 = require("../utils/logger");
function registerConfigHandlers(ipcMain, configService, gitAdapter) {
    ipcMain.handle('config:getFull', async () => {
        try {
            const config = await configService.getFull();
            return {
                ok: true,
                data: config,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get full config', { error });
            return {
                ok: false,
                error: {
                    code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                    message: 'Failed to load configuration',
                    details: error,
                },
            };
        }
    });
    ipcMain.handle('config:updateAppSettings', async (_event, settings) => {
        try {
            await configService.updateAppSettings(settings);
            return {
                ok: true,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to update app settings', { error });
            return {
                ok: false,
                error: {
                    code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                    message: 'Failed to update app settings',
                    details: error,
                },
            };
        }
    });
    ipcMain.handle('config:updateRepoSettings', async (_event, settings) => {
        try {
            await configService.updateRepoSettings(settings);
            return {
                ok: true,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to update repo settings', { error });
            return {
                ok: false,
                error: {
                    code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                    message: 'Failed to update repository settings',
                    details: error,
                },
            };
        }
    });
    ipcMain.handle('config:checkGitInstalled', async () => {
        try {
            const isInstalled = await gitAdapter.checkGitInstalled();
            return {
                ok: true,
                data: isInstalled,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to check Git installation', { error });
            return {
                ok: true,
                data: false,
            };
        }
    });
}
