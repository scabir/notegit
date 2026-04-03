import { IpcMain } from "electron";
import {
  ApiResponse,
  FullConfig,
  AppSettings,
  RepoSettings,
  Profile,
  ApiErrorCode,
  REPO_PROVIDERS,
  AuthMethod,
} from "../../shared/types";
import { ConfigService } from "../services/ConfigService";
import { RepoService } from "../services/RepoService";
import { GitAdapter } from "../adapters/GitAdapter";
import type { FilesService } from "../services/FilesService";
import type { SearchService } from "../services/SearchService";
import { logger } from "../utils/logger";
import {
  BackendTranslate,
  createFallbackBackendTranslator,
} from "../i18n/backendTranslator";
import { localizeApiError } from "../i18n/localizeApiError";
import {
  assertBoolean,
  assertInteger,
  assertOneOf,
  assertPlainObject,
  assertString,
  assertStringArray,
} from "../utils/inputValidation";

interface ProfileSwitchServices {
  filesService?: Pick<FilesService, "reset">;
  searchService?: Pick<SearchService, "reset" | "setRepoPath">;
}

const MAX_IPC_PROFILE_NAME_LENGTH = 120;
const MAX_IPC_PROFILE_ID_LENGTH = 256;
const MAX_IPC_PATH_LENGTH = 4096;
const MAX_IPC_URL_LENGTH = 4096;
const MAX_IPC_TOKEN_LENGTH = 10000;
const MAX_IPC_REGION_LENGTH = 128;
const MAX_IPC_BUCKET_LENGTH = 256;
const MAX_IPC_PREFIX_LENGTH = 1024;
const MAX_IPC_FAVORITES_COUNT = 5000;

const REPO_PROVIDER_VALUES = Object.values(REPO_PROVIDERS);
const AUTH_METHOD_VALUES = Object.values(AuthMethod);
const THEME_VALUES = ["light", "dark", "system"] as const;

const validateRepoSettingsInput = (
  value: unknown,
  field: string,
  options: { requireProvider?: boolean } = {},
): Partial<RepoSettings> => {
  const settings = assertPlainObject(value, field);
  const { requireProvider = false } = options;

  if (requireProvider || settings.provider !== undefined) {
    assertOneOf(settings.provider, `${field}.provider`, REPO_PROVIDER_VALUES, {
      allowEmpty: false,
    });
  }

  if (settings.localPath !== undefined) {
    assertString(settings.localPath, `${field}.localPath`, {
      allowEmpty: false,
      maxLength: MAX_IPC_PATH_LENGTH,
    });
  }

  if (settings.remoteUrl !== undefined) {
    assertString(settings.remoteUrl, `${field}.remoteUrl`, {
      allowEmpty: false,
      maxLength: MAX_IPC_URL_LENGTH,
    });
  }

  if (settings.branch !== undefined) {
    assertString(settings.branch, `${field}.branch`, {
      allowEmpty: false,
      maxLength: 256,
    });
  }

  if (settings.pat !== undefined) {
    assertString(settings.pat, `${field}.pat`, {
      maxLength: MAX_IPC_TOKEN_LENGTH,
    });
  }

  if (settings.authMethod !== undefined) {
    assertOneOf(
      settings.authMethod,
      `${field}.authMethod`,
      AUTH_METHOD_VALUES,
      {
        allowEmpty: false,
      },
    );
  }

  if (settings.bucket !== undefined) {
    assertString(settings.bucket, `${field}.bucket`, {
      allowEmpty: false,
      maxLength: MAX_IPC_BUCKET_LENGTH,
    });
  }

  if (settings.region !== undefined) {
    assertString(settings.region, `${field}.region`, {
      allowEmpty: false,
      maxLength: MAX_IPC_REGION_LENGTH,
    });
  }

  if (settings.prefix !== undefined) {
    assertString(settings.prefix, `${field}.prefix`, {
      maxLength: MAX_IPC_PREFIX_LENGTH,
    });
  }

  if (settings.accessKeyId !== undefined) {
    assertString(settings.accessKeyId, `${field}.accessKeyId`, {
      maxLength: MAX_IPC_TOKEN_LENGTH,
    });
  }

  if (settings.secretAccessKey !== undefined) {
    assertString(settings.secretAccessKey, `${field}.secretAccessKey`, {
      maxLength: MAX_IPC_TOKEN_LENGTH,
    });
  }

  if (settings.sessionToken !== undefined) {
    assertString(settings.sessionToken, `${field}.sessionToken`, {
      maxLength: MAX_IPC_TOKEN_LENGTH,
    });
  }

  return settings as Partial<RepoSettings>;
};

const validateAppSettingsInput = (value: unknown): Partial<AppSettings> => {
  const settings = assertPlainObject(value, "settings");

  if (settings.language !== undefined) {
    assertString(settings.language, "settings.language", {
      allowEmpty: false,
      maxLength: 32,
    });
  }

  if (settings.autoSaveEnabled !== undefined) {
    assertBoolean(settings.autoSaveEnabled, "settings.autoSaveEnabled");
  }

  if (settings.autoSaveIntervalSec !== undefined) {
    assertInteger(
      settings.autoSaveIntervalSec,
      "settings.autoSaveIntervalSec",
      {
        min: 1,
        max: 86400,
      },
    );
  }

  if (settings.s3AutoSyncEnabled !== undefined) {
    assertBoolean(settings.s3AutoSyncEnabled, "settings.s3AutoSyncEnabled");
  }

  if (settings.s3AutoSyncIntervalSec !== undefined) {
    assertInteger(
      settings.s3AutoSyncIntervalSec,
      "settings.s3AutoSyncIntervalSec",
      {
        min: 1,
        max: 86400,
      },
    );
  }

  if (settings.theme !== undefined) {
    assertOneOf(settings.theme, "settings.theme", THEME_VALUES, {
      allowEmpty: false,
    });
  }

  if (settings.editorPrefs !== undefined) {
    const editorPrefs = assertPlainObject(
      settings.editorPrefs,
      "settings.editorPrefs",
    );
    if (editorPrefs.fontSize !== undefined) {
      assertInteger(editorPrefs.fontSize, "settings.editorPrefs.fontSize", {
        min: 8,
        max: 72,
      });
    }
    if (editorPrefs.lineNumbers !== undefined) {
      assertBoolean(
        editorPrefs.lineNumbers,
        "settings.editorPrefs.lineNumbers",
      );
    }
    if (editorPrefs.tabSize !== undefined) {
      assertInteger(editorPrefs.tabSize, "settings.editorPrefs.tabSize", {
        min: 1,
        max: 12,
      });
    }
    if (editorPrefs.showPreview !== undefined) {
      assertBoolean(
        editorPrefs.showPreview,
        "settings.editorPrefs.showPreview",
      );
    }
  }

  return settings as Partial<AppSettings>;
};

export function registerConfigHandlers(
  ipcMain: IpcMain,
  configService: ConfigService,
  repoService: RepoService,
  gitAdapter: GitAdapter,
  translate: BackendTranslate = createFallbackBackendTranslator(),
  profileSwitchServices: ProfileSwitchServices = {},
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
        const validatedSettings = validateAppSettingsInput(settings);
        await configService.updateAppSettings(validatedSettings);
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
          error: error.code
            ? await localizeApiError(error, translate)
            : {
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
        const validatedSettings = validateRepoSettingsInput(
          settings,
          "settings",
          { requireProvider: true },
        ) as RepoSettings;
        await configService.updateRepoSettings(validatedSettings);
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
        const validatedFavorites = assertStringArray(favorites, "favorites", {
          maxItems: MAX_IPC_FAVORITES_COUNT,
          itemMaxLength: MAX_IPC_PATH_LENGTH,
        });
        await configService.updateFavorites(validatedFavorites);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error("Failed to update favorites", { error });
        return {
          ok: false,
          error: error.code
            ? await localizeApiError(error, translate)
            : {
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
        const validatedName = assertString(name, "name", {
          allowEmpty: false,
          maxLength: MAX_IPC_PROFILE_NAME_LENGTH,
        });
        const validatedRepoSettings = validateRepoSettingsInput(
          repoSettings,
          "repoSettings",
        );

        const profile = await configService.createProfile(
          validatedName,
          validatedRepoSettings,
        );

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
        const validatedProfileId = assertString(profileId, "profileId", {
          allowEmpty: false,
          maxLength: MAX_IPC_PROFILE_ID_LENGTH,
        });
        await configService.deleteProfile(validatedProfileId);
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error("Failed to delete profile", { error });
        return {
          ok: false,
          error: error.code
            ? await localizeApiError(error, translate)
            : {
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
        const validatedProfileId = assertString(profileId, "profileId", {
          allowEmpty: false,
          maxLength: MAX_IPC_PROFILE_ID_LENGTH,
        });
        await configService.setActiveProfileId(validatedProfileId);
        repoService.resetActiveRepo?.();
        profileSwitchServices.filesService?.reset();
        profileSwitchServices.searchService?.reset();

        try {
          const repoSettings = await configService.getRepoSettings();
          if (repoSettings?.localPath) {
            profileSwitchServices.searchService?.setRepoPath(
              repoSettings.localPath,
            );
          }
        } catch (error) {
          logger.warn(
            "Failed to refresh search repo path after profile switch",
            {
              error,
              profileId: validatedProfileId,
            },
          );
        }

        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error("Failed to set active profile", { error });
        return {
          ok: false,
          error: error.code
            ? await localizeApiError(error, translate)
            : {
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
