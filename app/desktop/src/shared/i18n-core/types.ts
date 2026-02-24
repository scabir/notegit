export type TranslationLeaf = string;

export type TranslationValue = TranslationLeaf | TranslationDictionary;

export interface TranslationDictionary {
  [key: string]: TranslationValue;
}

export type TranslationValueType = "leaf" | "object";

export interface TranslationTypeMismatch {
  key: string;
  expected: TranslationValueType;
  actual: TranslationValueType;
}

export interface TranslationValidationResult {
  missingKeys: string[];
  extraKeys: string[];
  typeMismatches: TranslationTypeMismatch[];
  isValid: boolean;
}
