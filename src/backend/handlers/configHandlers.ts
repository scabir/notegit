import { IpcMain } from 'electron';
import {
  ApiResponse,
  FullConfig,
  AppSettings,
  RepoSettings,
  ApiErrorCode,
} from '../../shared/types';
import { ConfigService } from '../services/ConfigService';
import { GitAdapter } from '../adapters/GitAdapter';
import { logger } from '../utils/logger';

export function registerConfigHandlers(
  ipcMain: IpcMain,
  configService: ConfigService,
  gitAdapter: GitAdapter
): void {
  ipcMain.handle('config:getFull', async (): Promise<ApiResponse<FullConfig>> => {
    try {
      const config = await configService.getFull();
      return {
        ok: true,
        data: config,
      };
    } catch (error: any) {
      logger.error('Failed to get full config', { error });
      return {
        ok: false,
        error: {
          code: ApiErrorCode.UNKNOWN_ERROR,
          message: 'Failed to load configuration',
          details: error,
        },
      };
    }
  });

  ipcMain.handle(
    'config:updateAppSettings',
    async (_event, settings: Partial<AppSettings>): Promise<ApiResponse<void>> => {
      try {
        await configService.updateAppSettings(settings);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error('Failed to update app settings', { error });
        return {
          ok: false,
          error: {
            code: ApiErrorCode.UNKNOWN_ERROR,
            message: 'Failed to update app settings',
            details: error,
          },
        };
      }
    }
  );

  ipcMain.handle(
    'config:updateRepoSettings',
    async (_event, settings: RepoSettings): Promise<ApiResponse<void>> => {
      try {
        await configService.updateRepoSettings(settings);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error('Failed to update repo settings', { error });
        return {
          ok: false,
          error: {
            code: ApiErrorCode.UNKNOWN_ERROR,
            message: 'Failed to update repository settings',
            details: error,
          },
        };
      }
    }
  );

  ipcMain.handle('config:checkGitInstalled', async (): Promise<ApiResponse<boolean>> => {
    try {
      const isInstalled = await gitAdapter.checkGitInstalled();
      return {
        ok: true,
        data: isInstalled,
      };
    } catch (error: any) {
      logger.error('Failed to check Git installation', { error });
      return {
        ok: true,
        data: false,
      };
    }
  });
}

