import type {
  TranslationDictionary,
  TranslationValidationResult,
  TranslationValue,
  TranslationValueType,
} from "./types";

const isTranslationDictionary = (
  value: TranslationValue,
): value is TranslationDictionary =>
  typeof value === "object" && value !== null && !Array.isArray(value);

interface TranslationShape {
  leafKeys: Set<string>;
  keyTypes: Map<string, TranslationValueType>;
}

const collectTranslationShape = (
  dictionary: TranslationDictionary,
  prefix = "",
  shape: TranslationShape = {
    leafKeys: new Set<string>(),
    keyTypes: new Map<string, TranslationValueType>(),
  },
): TranslationShape => {
  for (const [rawKey, value] of Object.entries(dictionary)) {
    const key = prefix ? `${prefix}.${rawKey}` : rawKey;

    if (isTranslationDictionary(value)) {
      shape.keyTypes.set(key, "object");
      collectTranslationShape(value, key, shape);
      continue;
    }

    shape.keyTypes.set(key, "leaf");
    shape.leafKeys.add(key);
  }

  return shape;
};

export const extractTranslationKeys = (
  dictionary: TranslationDictionary,
): string[] => {
  return Array.from(collectTranslationShape(dictionary).leafKeys).sort();
};

export const validateTranslationKeys = (
  fallback: TranslationDictionary,
  candidate: TranslationDictionary,
): TranslationValidationResult => {
  const fallbackShape = collectTranslationShape(fallback);
  const candidateShape = collectTranslationShape(candidate);

  const missingKeys = Array.from(fallbackShape.leafKeys).filter(
    (key) => !candidateShape.leafKeys.has(key),
  );

  const extraKeys = Array.from(candidateShape.leafKeys).filter(
    (key) => !fallbackShape.leafKeys.has(key),
  );

  const typeMismatches = Array.from(fallbackShape.keyTypes.entries())
    .filter(([key, expected]) => {
      const actual = candidateShape.keyTypes.get(key);
      return Boolean(actual) && actual !== expected;
    })
    .map(([key, expected]) => ({
      key,
      expected,
      actual: candidateShape.keyTypes.get(key)!,
    }));

  return {
    missingKeys: missingKeys.sort(),
    extraKeys: extraKeys.sort(),
    typeMismatches: typeMismatches.sort((a, b) => a.key.localeCompare(b.key)),
    isValid:
      missingKeys.length === 0 &&
      extraKeys.length === 0 &&
      typeMismatches.length === 0,
  };
};
