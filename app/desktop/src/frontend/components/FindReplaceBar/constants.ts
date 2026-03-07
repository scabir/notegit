import { getDefaultTranslation } from "../../i18n/defaultTranslations";

type TranslateFn = (key: string) => string;

export const FIND_REPLACE_KEYS = {
  findPlaceholder: "findReplaceBar.findPlaceholder",
  replacePlaceholder: "findReplaceBar.replacePlaceholder",
  noMatches: "findReplaceBar.noMatches",
  findPrevious: "findReplaceBar.findPrevious",
  findNext: "findReplaceBar.findNext",
  replaceCurrent: "findReplaceBar.replaceCurrent",
  replaceAll: "findReplaceBar.replaceAll",
  close: "findReplaceBar.close",
} as const;

const defaultText = (key: string): string => getDefaultTranslation(key);

export const buildFindReplaceText = (t: TranslateFn) => ({
  findPlaceholder: t(FIND_REPLACE_KEYS.findPlaceholder),
  replacePlaceholder: t(FIND_REPLACE_KEYS.replacePlaceholder),
  noMatches: t(FIND_REPLACE_KEYS.noMatches),
  findPrevious: t(FIND_REPLACE_KEYS.findPrevious),
  findNext: t(FIND_REPLACE_KEYS.findNext),
  replaceCurrent: t(FIND_REPLACE_KEYS.replaceCurrent),
  replaceAll: t(FIND_REPLACE_KEYS.replaceAll),
  close: t(FIND_REPLACE_KEYS.close),
});

export const FIND_REPLACE_TEXT = {
  findPlaceholder: defaultText(FIND_REPLACE_KEYS.findPlaceholder),
  replacePlaceholder: defaultText(FIND_REPLACE_KEYS.replacePlaceholder),
  noMatches: defaultText(FIND_REPLACE_KEYS.noMatches),
  findPrevious: defaultText(FIND_REPLACE_KEYS.findPrevious),
  findNext: defaultText(FIND_REPLACE_KEYS.findNext),
  replaceCurrent: defaultText(FIND_REPLACE_KEYS.replaceCurrent),
  replaceAll: defaultText(FIND_REPLACE_KEYS.replaceAll),
  close: defaultText(FIND_REPLACE_KEYS.close),
} as const;
