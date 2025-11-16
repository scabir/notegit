"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFilesHandlers = registerFilesHandlers;
const types_1 = require("../../shared/types");
const logger_1 = require("../utils/logger");
function registerFilesHandlers(ipcMain, filesService) {
    ipcMain.handle('files:listTree', async () => {
        try {
            const tree = await filesService.listTree();
            return {
                ok: true,
                data: tree,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to list file tree', { error });
            return {
                ok: false,
                error: error.code
                    ? error
                    : {
                        code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                        message: error.message || 'Failed to list files',
                        details: error,
                    },
            };
        }
    });
    ipcMain.handle('files:read', async (_event, path) => {
        try {
            const content = await filesService.readFile(path);
            return {
                ok: true,
                data: content,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to read file', { path, error });
            return {
                ok: false,
                error: error.code
                    ? error
                    : {
                        code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                        message: error.message || 'Failed to read file',
                        details: error,
                    },
            };
        }
    });
    ipcMain.handle('files:save', async (_event, path, content) => {
        try {
            await filesService.saveFile(path, content);
            return {
                ok: true,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to save file', { path, error });
            return {
                ok: false,
                error: error.code
                    ? error
                    : {
                        code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                        message: error.message || 'Failed to save file',
                        details: error,
                    },
            };
        }
    });
    ipcMain.handle('files:commit', async (_event, path, message) => {
        try {
            await filesService.commitFile(path, message);
            return {
                ok: true,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to commit file', { path, error });
            return {
                ok: false,
                error: error.code
                    ? error
                    : {
                        code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                        message: error.message || 'Failed to commit file',
                        details: error,
                    },
            };
        }
    });
    ipcMain.handle('files:create', async (_event, parentPath, name) => {
        try {
            await filesService.createFile(parentPath, name);
            return {
                ok: true,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create file', { parentPath, name, error });
            return {
                ok: false,
                error: error.code
                    ? error
                    : {
                        code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                        message: error.message || 'Failed to create file',
                        details: error,
                    },
            };
        }
    });
    ipcMain.handle('files:createFolder', async (_event, parentPath, name) => {
        try {
            await filesService.createFolder(parentPath, name);
            return {
                ok: true,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create folder', { parentPath, name, error });
            return {
                ok: false,
                error: error.code
                    ? error
                    : {
                        code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                        message: error.message || 'Failed to create folder',
                        details: error,
                    },
            };
        }
    });
    ipcMain.handle('files:delete', async (_event, path) => {
        try {
            await filesService.deletePath(path);
            return {
                ok: true,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to delete path', { path, error });
            return {
                ok: false,
                error: error.code
                    ? error
                    : {
                        code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                        message: error.message || 'Failed to delete',
                        details: error,
                    },
            };
        }
    });
    ipcMain.handle('files:rename', async (_event, oldPath, newPath) => {
        try {
            await filesService.renamePath(oldPath, newPath);
            return {
                ok: true,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to rename path', { oldPath, newPath, error });
            return {
                ok: false,
                error: error.code
                    ? error
                    : {
                        code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                        message: error.message || 'Failed to rename',
                        details: error,
                    },
            };
        }
    });
    ipcMain.handle('files:saveAs', async (_event, repoPath, destPath) => {
        try {
            await filesService.saveFileAs(repoPath, destPath);
            return {
                ok: true,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to save file as', { repoPath, destPath, error });
            return {
                ok: false,
                error: error.code
                    ? error
                    : {
                        code: types_1.ApiErrorCode.UNKNOWN_ERROR,
                        message: error.message || 'Failed to save file',
                        details: error,
                    },
            };
        }
    });
}
