import { DEFAULT_APP_LANGUAGE } from "../../shared/types";
import type { TranslationDictionary } from "../../shared/i18n-core";
import { ConfigService } from "../services/ConfigService";
import { TranslationService } from "../services/TranslationService";

type TranslationParams = Record<string, string | number | boolean>;

export interface BackendTranslateOptions {
  fallback?: string;
  params?: TranslationParams;
  locale?: string;
}

export type BackendTranslate = (
  key: string,
  options?: BackendTranslateOptions,
) => Promise<string>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const resolveTranslationValue = (
  dictionary: TranslationDictionary,
  key: string,
): unknown => {
  const segments = key
    .split(".")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return undefined;
  }

  let current: unknown = dictionary;
  for (const segment of segments) {
    if (!isRecord(current) || !(segment in current)) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
};

const interpolate = (message: string, params?: TranslationParams): string => {
  if (!params) {
    return message;
  }

  let output = message;
  for (const [key, value] of Object.entries(params)) {
    output = output.split(`{${key}}`).join(String(value));
  }

  return output;
};

export const createFallbackBackendTranslator = (): BackendTranslate => {
  return async (key, options) =>
    interpolate(options?.fallback || key, options?.params);
};

export const createBackendTranslator = (
  translationService: TranslationService,
  configService: Pick<ConfigService, "getAppSettings">,
): BackendTranslate => {
  const dictionaryCache = new Map<string, TranslationDictionary>();

  const resolveLanguage = async (): Promise<string> => {
    try {
      const appSettings = await configService.getAppSettings();
      const configured = appSettings.language?.trim();
      return configured || DEFAULT_APP_LANGUAGE;
    } catch (_error) {
      return DEFAULT_APP_LANGUAGE;
    }
  };

  const loadDictionary = async (
    locale: string,
    depth = 0,
  ): Promise<TranslationDictionary> => {
    const normalizedLocale = locale.trim() || DEFAULT_APP_LANGUAGE;
    const cached = dictionaryCache.get(normalizedLocale);
    if (cached) {
      return cached;
    }

    try {
      const bundle = await translationService.getBundle("backend", locale);
      dictionaryCache.set(normalizedLocale, bundle.translations);
      dictionaryCache.set(bundle.locale, bundle.translations);
      return bundle.translations;
    } catch (_error) {
      if (normalizedLocale !== DEFAULT_APP_LANGUAGE && depth < 1) {
        return loadDictionary(DEFAULT_APP_LANGUAGE, depth + 1);
      }

      return {};
    }
  };

  return async (key: string, options?: BackendTranslateOptions) => {
    const locale = options?.locale || (await resolveLanguage());
    const dictionary = await loadDictionary(locale);
    const value = resolveTranslationValue(dictionary, key);

    let resolved: string;
    if (typeof value === "string") {
      resolved = value;
    } else if (typeof value === "number" || typeof value === "boolean") {
      resolved = String(value);
    } else {
      resolved = options?.fallback || key;
    }

    return interpolate(resolved, options?.params);
  };
};
