import { IpcMain } from 'electron';
import {
  ApiResponse,
  FileTreeNode,
  FileContent,
  ApiErrorCode,
} from '../../shared/types';
import { FilesService } from '../services/FilesService';
import { logger } from '../utils/logger';

export function registerFilesHandlers(ipcMain: IpcMain, filesService: FilesService): void {
  ipcMain.handle('files:listTree', async (): Promise<ApiResponse<FileTreeNode[]>> => {
    try {
      const tree = await filesService.listTree();
      return {
        ok: true,
        data: tree,
      };
    } catch (error: any) {
      logger.error('Failed to list file tree', { error });
      return {
        ok: false,
        error: error.code
          ? error
          : {
              code: ApiErrorCode.UNKNOWN_ERROR,
              message: error.message || 'Failed to list files',
              details: error,
            },
      };
    }
  });

  ipcMain.handle('files:read', async (_event, path: string): Promise<ApiResponse<FileContent>> => {
    try {
      const content = await filesService.readFile(path);
      return {
        ok: true,
        data: content,
      };
    } catch (error: any) {
      logger.error('Failed to read file', { path, error });
      return {
        ok: false,
        error: error.code
          ? error
          : {
              code: ApiErrorCode.UNKNOWN_ERROR,
              message: error.message || 'Failed to read file',
              details: error,
            },
      };
    }
  });

  ipcMain.handle(
    'files:save',
    async (_event, path: string, content: string): Promise<ApiResponse<void>> => {
      try {
        await filesService.saveFile(path, content);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error('Failed to save file', { path, error });
        return {
          ok: false,
          error: error.code
            ? error
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: error.message || 'Failed to save file',
                details: error,
              },
        };
      }
    }
  );

  ipcMain.handle(
    'files:saveWithGitWorkflow',
    async (
      _event,
      path: string,
      content: string,
      isAutosave: boolean = false
    ): Promise<
      ApiResponse<{ pullFailed?: boolean; pushFailed?: boolean; conflictDetected?: boolean }>
    > => {
      try {
        const result = await filesService.saveWithGitWorkflow(path, content, isAutosave);
        return {
          ok: true,
          data: result,
        };
      } catch (error: any) {
        logger.error('Failed to save with Git workflow', { path, error });
        return {
          ok: false,
          error: error.code
            ? error
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: error.message || 'Failed to save with Git workflow',
                details: error,
              },
        };
      }
    }
  );

  ipcMain.handle(
    'files:commit',
    async (_event, path: string, message: string): Promise<ApiResponse<void>> => {
      try {
        await filesService.commitFile(path, message);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error('Failed to commit file', { path, error });
        return {
          ok: false,
          error: error.code
            ? error
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: error.message || 'Failed to commit file',
                details: error,
              },
        };
      }
    }
  );

  ipcMain.handle(
    'files:commitAll',
    async (_event, message: string): Promise<ApiResponse<void>> => {
      try {
        await filesService.commitAll(message);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error('Failed to commit all changes', { error });
        return {
          ok: false,
          error: error.code
            ? error
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: error.message || 'Failed to commit all changes',
                details: error,
              },
        };
      }
    }
  );

  ipcMain.handle(
    'files:create',
    async (_event, parentPath: string, name: string): Promise<ApiResponse<void>> => {
      try {
        await filesService.createFile(parentPath, name);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error('Failed to create file', { parentPath, name, error });
        return {
          ok: false,
          error: error.code
            ? error
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: error.message || 'Failed to create file',
                details: error,
              },
        };
      }
    }
  );

  ipcMain.handle(
    'files:createFolder',
    async (_event, parentPath: string, name: string): Promise<ApiResponse<void>> => {
      try {
        await filesService.createFolder(parentPath, name);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error('Failed to create folder', { parentPath, name, error });
        return {
          ok: false,
          error: error.code
            ? error
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: error.message || 'Failed to create folder',
                details: error,
              },
        };
      }
    }
  );

  ipcMain.handle('files:delete', async (_event, path: string): Promise<ApiResponse<void>> => {
    try {
      await filesService.deletePath(path);
      return {
        ok: true,
      };
    } catch (error: any) {
      logger.error('Failed to delete path', { path, error });
      return {
        ok: false,
        error: error.code
          ? error
          : {
              code: ApiErrorCode.UNKNOWN_ERROR,
              message: error.message || 'Failed to delete',
              details: error,
            },
      };
    }
  });

  ipcMain.handle(
    'files:rename',
    async (_event, oldPath: string, newPath: string): Promise<ApiResponse<void>> => {
      try {
        await filesService.renamePath(oldPath, newPath);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error('Failed to rename path', { oldPath, newPath, error });
        return {
          ok: false,
          error: error.code
            ? error
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: error.message || 'Failed to rename',
                details: error,
              },
        };
      }
    }
  );

  ipcMain.handle(
    'files:saveAs',
    async (_event, repoPath: string, destPath: string): Promise<ApiResponse<void>> => {
      try {
        await filesService.saveFileAs(repoPath, destPath);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error('Failed to save file as', { repoPath, destPath, error });
        return {
          ok: false,
          error: error.code
            ? error
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: error.message || 'Failed to save file',
                details: error,
              },
        };
      }
    }
  );

  ipcMain.handle(
    'files:import',
    async (_event, sourcePath: string, targetPath: string): Promise<ApiResponse<void>> => {
      try {
        await filesService.importFile(sourcePath, targetPath);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error('Failed to import file', { sourcePath, targetPath, error });
        return {
          ok: false,
          error: error.code
            ? error
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: error.message || 'Failed to import file',
                details: error,
              },
        };
      }
    }
  );
}

