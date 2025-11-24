import { IpcMain } from 'electron';
import {
  ApiResponse,
  FullConfig,
  AppSettings,
  RepoSettings,
  Profile,
  ApiErrorCode,
} from '../../shared/types';
import { ConfigService } from '../services/ConfigService';
import { GitAdapter } from '../adapters/GitAdapter';
import { FsAdapter } from '../adapters/FsAdapter';
import { logger } from '../utils/logger';

export function registerConfigHandlers(
  ipcMain: IpcMain,
  configService: ConfigService,
  gitAdapter: GitAdapter,
  fsAdapter: FsAdapter
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

  // Profile management handlers

  ipcMain.handle('config:getProfiles', async (): Promise<ApiResponse<Profile[]>> => {
    try {
      const profiles = await configService.getProfiles();
      return {
        ok: true,
        data: profiles,
      };
    } catch (error: any) {
      logger.error('Failed to get profiles', { error });
      return {
        ok: false,
        error: {
          code: ApiErrorCode.UNKNOWN_ERROR,
          message: 'Failed to load profiles',
          details: error,
        },
      };
    }
  });

  ipcMain.handle('config:getActiveProfileId', async (): Promise<ApiResponse<string | null>> => {
    try {
      const profileId = await configService.getActiveProfileId();
      return {
        ok: true,
        data: profileId,
      };
    } catch (error: any) {
      logger.error('Failed to get active profile ID', { error });
      return {
        ok: false,
        error: {
          code: ApiErrorCode.UNKNOWN_ERROR,
          message: 'Failed to load active profile ID',
          details: error,
        },
      };
    }
  });

  ipcMain.handle(
    'config:createProfile',
    async (_event, name: string, repoSettings: Partial<RepoSettings>): Promise<ApiResponse<Profile>> => {
      try {
        // Create the profile with auto-generated local path
        const profile = await configService.createProfile(name, repoSettings);
        
        logger.info('Profile created, starting clone/pull', { 
          profileId: profile.id, 
          localPath: profile.repoSettings.localPath 
        });
        
        // Check if local path exists
        const localExists = await fsAdapter.exists(profile.repoSettings.localPath);
        
        if (!localExists) {
          // Clone the repo
          logger.info('Local repo does not exist, cloning...', { 
            remoteUrl: profile.repoSettings.remoteUrl,
            localPath: profile.repoSettings.localPath
          });
          
          try {
            await gitAdapter.clone(
              profile.repoSettings.remoteUrl,
              profile.repoSettings.localPath,
              profile.repoSettings.branch,
              profile.repoSettings.pat
            );
            logger.info('Repository cloned successfully');
          } catch (cloneError: any) {
            logger.error('Failed to clone repository', { error: cloneError });
            // Delete the failed profile
            await configService.deleteProfile(profile.id);
            return {
              ok: false,
              error: {
                code: ApiErrorCode.GIT_CLONE_FAILED,
                message: `Failed to clone repository: ${cloneError.message || 'Unknown error'}`,
                details: cloneError,
              },
            };
          }
        } else {
          // Pull from remote to sync
          logger.info('Local repo exists, pulling to sync...', { 
            localPath: profile.repoSettings.localPath 
          });
          
          try {
            // Initialize GitAdapter with the repo path
            gitAdapter.init(profile.repoSettings.localPath);
            await gitAdapter.pull(profile.repoSettings.pat);
            logger.info('Repository pulled successfully');
          } catch (pullError: any) {
            logger.warn('Failed to pull repository, continuing anyway', { error: pullError });
            // Don't fail on pull error, just warn
          }
        }
        
        return {
          ok: true,
          data: profile,
        };
      } catch (error: any) {
        logger.error('Failed to create profile', { error });
        return {
          ok: false,
          error: {
            code: ApiErrorCode.UNKNOWN_ERROR,
            message: `Failed to create profile: ${error.message || 'Unknown error'}`,
            details: error,
          },
        };
      }
    }
  );

  ipcMain.handle(
    'config:deleteProfile',
    async (_event, profileId: string): Promise<ApiResponse<void>> => {
      try {
        await configService.deleteProfile(profileId);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error('Failed to delete profile', { error });
        return {
          ok: false,
          error: {
            code: ApiErrorCode.UNKNOWN_ERROR,
            message: 'Failed to delete profile',
            details: error,
          },
        };
      }
    }
  );

  ipcMain.handle(
    'config:setActiveProfile',
    async (_event, profileId: string): Promise<ApiResponse<void>> => {
      try {
        await configService.setActiveProfileId(profileId);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error('Failed to set active profile', { error });
        return {
          ok: false,
          error: {
            code: ApiErrorCode.UNKNOWN_ERROR,
            message: 'Failed to set active profile',
            details: error,
          },
        };
      }
    }
  );
}

