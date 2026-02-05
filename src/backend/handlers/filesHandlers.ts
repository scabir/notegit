import { IpcMain } from 'electron';
import {
  ApiResponse,
  FileTreeNode,
  FileContent,
  ApiErrorCode,
  REPO_PROVIDERS,
} from '../../shared/types';
import { FilesService } from '../services/FilesService';
import { logger } from '../utils/logger';
import { RepoService } from '../services/RepoService';

export function registerFilesHandlers(ipcMain: IpcMain, filesService: FilesService, repoService: RepoService): void {
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
        try {
          await repoService.queueS3Upload(path);
        } catch (error) {
          logger.warn('Failed to queue S3 upload operation', { path, error });
        }
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
    'files:commitAndPushAll',
    async (): Promise<ApiResponse<{ message: string }>> => {
      try {
        const statusResponse = await repoService.getStatus();

        if (statusResponse.provider === REPO_PROVIDERS.s3) {
          await repoService.push();
          return {
            ok: true,
            data: { message: 'Synced successfully' },
          };
        }

        if (statusResponse.provider === REPO_PROVIDERS.local) {
          return {
            ok: false,
            error: {
              code: ApiErrorCode.VALIDATION_ERROR,
              message: 'Local repositories do not support sync',
              details: { provider: statusResponse.provider },
            },
          };
        }

        if (!statusResponse.hasUncommitted) {
          return {
            ok: true,
            data: { message: 'Nothing to commit' },
          };
        }

        const gitStatus = await filesService.getGitStatus();
        const changedFiles = [
          ...gitStatus.modified,
          ...gitStatus.added,
          ...gitStatus.deleted,
        ].slice(0, 5);

        let commitMessage = 'Update: ';
        if (changedFiles.length > 0) {
          commitMessage += changedFiles.join(', ');
          if (gitStatus.modified.length + gitStatus.added.length + gitStatus.deleted.length > 5) {
            commitMessage += ` and ${gitStatus.modified.length + gitStatus.added.length + gitStatus.deleted.length - 5} more`;
          }
        } else {
          commitMessage += 'multiple files';
        }

        await filesService.commitAll(commitMessage);

        await repoService.push();

        return {
          ok: true,
          data: { message: 'Changes committed and pushed successfully' },
        };
      } catch (error: any) {
        logger.error('Failed to commit and push all changes', { error });
        return {
          ok: false,
          error: error.code
            ? error
            : {
              code: ApiErrorCode.UNKNOWN_ERROR,
              message: error.message || 'Failed to commit and push changes',
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
      void repoService.queueS3Delete(path).catch((error) => {
        logger.warn('Failed to queue S3 delete operation', { path, error });
      });
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
        void repoService.queueS3Move(oldPath, newPath).catch((error) => {
          logger.warn('Failed to queue S3 move operation', { oldPath, newPath, error });
        });
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
    'files:duplicate',
    async (_event, repoPath: string): Promise<ApiResponse<string>> => {
      try {
        const duplicatedPath = await filesService.duplicateFile(repoPath);
        return {
          ok: true,
          data: duplicatedPath,
        };
      } catch (error: any) {
        logger.error('Failed to duplicate file', { repoPath, error });
        return {
          ok: false,
          error: error.code
            ? error
            : {
              code: ApiErrorCode.UNKNOWN_ERROR,
              message: error.message || 'Failed to duplicate file',
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
