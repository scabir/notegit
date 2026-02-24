import type { TranslationDictionary, TranslationValue } from "./types";

const isTranslationDictionary = (
  value: TranslationValue | undefined,
): value is TranslationDictionary =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const cloneTranslationValue = (value: TranslationValue): TranslationValue => {
  if (!isTranslationDictionary(value)) {
    return value;
  }

  const cloned: TranslationDictionary = {};
  for (const [key, nested] of Object.entries(value)) {
    cloned[key] = cloneTranslationValue(nested);
  }
  return cloned;
};

export const mergeTranslationsWithFallback = (
  fallback: TranslationDictionary,
  override?: TranslationDictionary | null,
): TranslationDictionary => {
  const merged = cloneTranslationValue(fallback) as TranslationDictionary;
  if (!override) {
    return merged;
  }

  for (const [key, overrideValue] of Object.entries(override)) {
    const fallbackValue = merged[key];

    if (
      isTranslationDictionary(fallbackValue) &&
      isTranslationDictionary(overrideValue)
    ) {
      merged[key] = mergeTranslationsWithFallback(fallbackValue, overrideValue);
      continue;
    }

    merged[key] = cloneTranslationValue(overrideValue);
  }

  return merged;
};
