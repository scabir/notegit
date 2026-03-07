import { IpcMain } from "electron";
import {
  ApiErrorCode,
  ApiResponse,
  DEFAULT_APP_LANGUAGE,
  I18nBundle,
  I18nMeta,
} from "../../shared/types";
import { ConfigService } from "../services/ConfigService";
import { TranslationService } from "../services/TranslationService";
import { logger } from "../utils/logger";
import {
  BackendTranslate,
  createFallbackBackendTranslator,
} from "../i18n/backendTranslator";

const isLocaleSupported = (
  locale: string,
  supportedLocales: string[],
): boolean => supportedLocales.includes(locale);

export function registerI18nHandlers(
  ipcMain: IpcMain,
  translationService: TranslationService,
  configService: ConfigService,
  translate: BackendTranslate = createFallbackBackendTranslator(),
): void {
  const t = (
    key: string,
    fallback?: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<string> => translate(key, { fallback, params });

  ipcMain.handle("i18n:getMeta", async (): Promise<ApiResponse<I18nMeta>> => {
    try {
      const supportedLocales =
        await translationService.listSupportedLocales("frontend");
      const appSettings = await configService.getAppSettings();
      const currentLocale = appSettings.language || DEFAULT_APP_LANGUAGE;
      const fallbackLocale = translationService.getFallbackLocale();

      return {
        ok: true,
        data: {
          currentLocale,
          fallbackLocale,
          supportedLocales,
        },
      };
    } catch (error: any) {
      logger.error("Failed to load i18n metadata", { error });
      return {
        ok: false,
        error: {
          code: ApiErrorCode.UNKNOWN_ERROR,
          message: await t(
            "i18n.errors.failedLoadMetadata",
            "Failed to load i18n metadata",
          ),
          details: error,
        },
      };
    }
  });

  ipcMain.handle(
    "i18n:getFrontendBundle",
    async (): Promise<ApiResponse<I18nBundle>> => {
      try {
        const appSettings = await configService.getAppSettings();
        const requestedLocale = appSettings.language || DEFAULT_APP_LANGUAGE;
        const bundle = await translationService.getBundle(
          "frontend",
          requestedLocale,
        );

        return {
          ok: true,
          data: bundle,
        };
      } catch (error: any) {
        logger.error("Failed to load frontend translation bundle", { error });
        return {
          ok: false,
          error: {
            code: ApiErrorCode.UNKNOWN_ERROR,
            message: await t(
              "i18n.errors.failedLoadFrontendTranslations",
              "Failed to load frontend translations",
            ),
            details: error,
          },
        };
      }
    },
  );

  ipcMain.handle(
    "i18n:setLanguage",
    async (_event, language: string): Promise<ApiResponse<void>> => {
      try {
        const normalizedLanguage = language?.trim();
        if (!normalizedLanguage) {
          return {
            ok: false,
            error: {
              code: ApiErrorCode.VALIDATION_ERROR,
              message: await t(
                "i18n.errors.languageRequired",
                "Language is required",
              ),
            },
          };
        }

        const supportedLocales =
          await translationService.listSupportedLocales("frontend");
        if (!isLocaleSupported(normalizedLanguage, supportedLocales)) {
          return {
            ok: false,
            error: {
              code: ApiErrorCode.VALIDATION_ERROR,
              message: await t(
                "i18n.errors.unsupportedLanguage",
                "Unsupported language: {language}",
                {
                  language: normalizedLanguage,
                },
              ),
              details: { supportedLocales },
            },
          };
        }

        await configService.updateAppSettings({ language: normalizedLanguage });
        return {
          ok: true,
        };
      } catch (error: any) {
        logger.error("Failed to set language", { language, error });
        return {
          ok: false,
          error: {
            code: ApiErrorCode.UNKNOWN_ERROR,
            message: await t(
              "i18n.errors.failedSetLanguage",
              "Failed to set language",
            ),
            details: error,
          },
        };
      }
    },
  );
}
