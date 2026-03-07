import { IpcMain } from "electron";
import {
  ApiResponse,
  FullConfig,
  AppSettings,
  RepoSettings,
  Profile,
  ApiErrorCode,
} from "../../shared/types";
import { ConfigService } from "../services/ConfigService";
import { RepoService } from "../services/RepoService";
import { GitAdapter } from "../adapters/GitAdapter";
import { logger } from "../utils/logger";
import {
  BackendTranslate,
  createFallbackBackendTranslator,
} from "../i18n/backendTranslator";
import { localizeApiError } from "../i18n/localizeApiError";

export function registerConfigHandlers(
  ipcMain: IpcMain,
  configService: ConfigService,
  repoService: RepoService,
  gitAdapter: GitAdapter,
  translate: BackendTranslate = createFallbackBackendTranslator(),
): void {
  const t = (
    key: string,
    fallback?: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<string> => translate(key, { fallback, params });

  ipcMain.handle(
    "config:getFull",
    async (): Promise<ApiResponse<FullConfig>> => {
      try {
        const config = await configService.getFull();
        return {
          ok: true,
          data: config,
        };
      } catch (error: any) {
        logger.error("Failed to get full config", { error });
        return {
          ok: false,
          error: {
            code: ApiErrorCode.UNKNOWN_ERROR,
            message: await t(
              "config.errors.failedLoadConfiguration",
              "Failed to load configuration",
            ),
            details: error,
          },
        };
      }
    },
  );

  ipcMain.handle(
    "config:updateAppSettings",
    async (
      _event,
      settings: Partial<AppSettings>,
    ): Promise<ApiResponse<void>> => {
      try {
        await configService.updateAppSettings(settings);
        try {
          await repoService.refreshAutoSyncSettings();
        } catch (error) {
          logger.warn("Failed to refresh auto-sync settings", { error });
        }
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error("Failed to update app settings", { error });
        return {
          ok: false,
          error: {
            code: ApiErrorCode.UNKNOWN_ERROR,
            message: await t(
              "config.errors.failedUpdateAppSettings",
              "Failed to update app settings",
            ),
            details: error,
          },
        };
      }
    },
  );

  ipcMain.handle(
    "config:updateRepoSettings",
    async (_event, settings: RepoSettings): Promise<ApiResponse<void>> => {
      try {
        await configService.updateRepoSettings(settings);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error("Failed to update repo settings", { error });
        return {
          ok: false,
          error: error.code
            ? await localizeApiError(error, translate)
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: await t(
                  "config.errors.failedUpdateRepositorySettings",
                  "Failed to update repository settings",
                ),
                details: error,
              },
        };
      }
    },
  );

  ipcMain.handle(
    "config:getAppSettings",
    async (): Promise<ApiResponse<AppSettings>> => {
      try {
        const settings = await configService.getAppSettings();
        return {
          ok: true,
          data: settings,
        };
      } catch (error: any) {
        logger.error("Failed to get app settings", { error });
        return {
          ok: false,
          error: {
            code: ApiErrorCode.UNKNOWN_ERROR,
            message: await t(
              "config.errors.failedLoadApplicationSettings",
              "Failed to load application settings",
            ),
            details: error,
          },
        };
      }
    },
  );

  ipcMain.handle(
    "config:checkGitInstalled",
    async (): Promise<ApiResponse<boolean>> => {
      try {
        const isInstalled = await gitAdapter.checkGitInstalled();
        return {
          ok: true,
          data: isInstalled,
        };
      } catch (error: any) {
        logger.error("Failed to check Git installation", { error });
        return {
          ok: true,
          data: false,
        };
      }
    },
  );

  ipcMain.handle(
    "config:getFavorites",
    async (): Promise<ApiResponse<string[]>> => {
      try {
        const favorites = await configService.getFavorites();
        return {
          ok: true,
          data: favorites,
        };
      } catch (error: any) {
        logger.error("Failed to get favorites", { error });
        return {
          ok: false,
          error: {
            code: ApiErrorCode.UNKNOWN_ERROR,
            message: await t(
              "config.errors.failedLoadFavorites",
              "Failed to load favorites",
            ),
            details: error,
          },
        };
      }
    },
  );

  ipcMain.handle(
    "config:updateFavorites",
    async (_event, favorites: string[]): Promise<ApiResponse<void>> => {
      try {
        await configService.updateFavorites(favorites);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error("Failed to update favorites", { error });
        return {
          ok: false,
          error: {
            code: ApiErrorCode.UNKNOWN_ERROR,
            message: await t(
              "config.errors.failedSaveFavorites",
              "Failed to save favorites",
            ),
            details: error,
          },
        };
      }
    },
  );

  ipcMain.handle(
    "config:getProfiles",
    async (): Promise<ApiResponse<Profile[]>> => {
      try {
        const profiles = await configService.getProfiles();
        return {
          ok: true,
          data: profiles,
        };
      } catch (error: any) {
        logger.error("Failed to get profiles", { error });
        return {
          ok: false,
          error: {
            code: ApiErrorCode.UNKNOWN_ERROR,
            message: await t(
              "config.errors.failedLoadProfiles",
              "Failed to load profiles",
            ),
            details: error,
          },
        };
      }
    },
  );

  ipcMain.handle(
    "config:getActiveProfileId",
    async (): Promise<ApiResponse<string | null>> => {
      try {
        const profileId = await configService.getActiveProfileId();
        return {
          ok: true,
          data: profileId,
        };
      } catch (error: any) {
        logger.error("Failed to get active profile ID", { error });
        return {
          ok: false,
          error: {
            code: ApiErrorCode.UNKNOWN_ERROR,
            message: await t(
              "config.errors.failedLoadActiveProfileId",
              "Failed to load active profile ID",
            ),
            details: error,
          },
        };
      }
    },
  );

  ipcMain.handle(
    "config:createProfile",
    async (
      _event,
      name: string,
      repoSettings: Partial<RepoSettings>,
    ): Promise<ApiResponse<Profile>> => {
      try {
        const profile = await configService.createProfile(name, repoSettings);

        logger.info("Profile created, preparing repository", {
          profileId: profile.id,
          localPath: profile.repoSettings.localPath,
          provider: profile.repoSettings.provider,
        });

        try {
          await repoService.prepareRepo(profile.repoSettings);
        } catch (prepareError: any) {
          logger.error("Failed to prepare repository for profile", {
            error: prepareError,
          });
          await configService.deleteProfile(profile.id);
          return {
            ok: false,
            error: prepareError.code
              ? await localizeApiError(prepareError, translate)
              : {
                  code: ApiErrorCode.UNKNOWN_ERROR,
                  message: await t(
                    "config.errors.failedPrepareRepositoryTemplate",
                    "Failed to prepare repository: {message}",
                    {
                      message:
                        prepareError.message ||
                        (await t("common.errors.unknown")),
                    },
                  ),
                  details: prepareError,
                },
          };
        }

        return {
          ok: true,
          data: profile,
        };
      } catch (error: any) {
        logger.error("Failed to create profile", { error });
        return {
          ok: false,
          error: error.code
            ? await localizeApiError(error, translate)
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: await t(
                  "config.errors.failedCreateProfileTemplate",
                  "Failed to create profile: {message}",
                  {
                    message:
                      error.message || (await t("common.errors.unknown")),
                  },
                ),
                details: error,
              },
        };
      }
    },
  );

  ipcMain.handle(
    "config:deleteProfile",
    async (_event, profileId: string): Promise<ApiResponse<void>> => {
      try {
        await configService.deleteProfile(profileId);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error("Failed to delete profile", { error });
        return {
          ok: false,
          error: {
            code: ApiErrorCode.UNKNOWN_ERROR,
            message: await t(
              "config.errors.failedDeleteProfile",
              "Failed to delete profile",
            ),
            details: error,
          },
        };
      }
    },
  );

  ipcMain.handle(
    "config:setActiveProfile",
    async (_event, profileId: string): Promise<ApiResponse<void>> => {
      try {
        await configService.setActiveProfileId(profileId);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error("Failed to set active profile", { error });
        return {
          ok: false,
          error: {
            code: ApiErrorCode.UNKNOWN_ERROR,
            message: await t(
              "config.errors.failedSetActiveProfile",
              "Failed to set active profile",
            ),
            details: error,
          },
        };
      }
    },
  );
}
