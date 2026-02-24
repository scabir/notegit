import type {
  TranslationDictionary,
  TranslationValidationResult,
} from "../i18n-core";

export const DEFAULT_APP_LANGUAGE = "en-GB";
export const EXPORT_CANCELLED_REASON = "EXPORT_CANCELLED";

export interface I18nBundle {
  requestedLocale: string;
  locale: string;
  fallbackLocale: string;
  translations: TranslationDictionary;
  namespaces: string[];
  validation: TranslationValidationResult;
}

export interface I18nMeta {
  currentLocale: string;
  fallbackLocale: string;
  supportedLocales: string[];
}
