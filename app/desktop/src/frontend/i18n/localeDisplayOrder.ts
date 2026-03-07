import { DEFAULT_APP_LANGUAGE } from "../../shared/types";

const LOCALE_USAGE_RANK: Record<string, number> = {
  "zh-CN": 1118,
  "hi-IN": 609,
  "es-ES": 559,
  "fr-FR": 312,
  "ar-SA": 274,
  "pt-PT": 263,
  "ru-RU": 255,
  "de-DE": 134,
  "ja-JP": 126,
  "tr-TR": 90,
  "it-IT": 68,
  "uk-UA": 41,
  "pl-PL": 39,
  "ku-KRD": 30,
  "el-GR": 14,
  "sv-SE": 13,
};

export const sortLocalesForDisplay = (supportedLocales: string[]): string[] => {
  const uniqueLocales = Array.from(
    new Set(
      supportedLocales
        .map((locale) => locale.trim())
        .filter((locale) => locale.length > 0),
    ),
  );

  const hasEnglish = uniqueLocales.includes(DEFAULT_APP_LANGUAGE);
  const nonEnglishLocales = uniqueLocales.filter(
    (locale) => locale !== DEFAULT_APP_LANGUAGE,
  );

  nonEnglishLocales.sort((left, right) => {
    const leftCount = LOCALE_USAGE_RANK[left] ?? -1;
    const rightCount = LOCALE_USAGE_RANK[right] ?? -1;
    if (leftCount !== rightCount) {
      return rightCount - leftCount;
    }
    return left.localeCompare(right);
  });

  if (!hasEnglish) {
    return nonEnglishLocales;
  }

  return [DEFAULT_APP_LANGUAGE, ...nonEnglishLocales];
};
