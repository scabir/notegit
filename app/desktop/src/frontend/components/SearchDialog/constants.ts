import { getDefaultTranslation } from "../../i18n/defaultTranslations";

export const SEARCH_DIALOG_KEYS = {
  title: "searchDialog.title",
  placeholder: "searchDialog.placeholder",
  helperText: "searchDialog.helperText",
  noResults: "searchDialog.noResults",
  startTyping: "searchDialog.startTyping",
  searchFailed: "searchDialog.searchFailed",
  lineLabel: "searchDialog.lineLabel",
  moreSuffix: "searchDialog.moreSuffix",
} as const;

const defaultText = (key: string): string => getDefaultTranslation(key);

export const SEARCH_DIALOG_TEXT = {
  title: defaultText(SEARCH_DIALOG_KEYS.title),
  placeholder: defaultText(SEARCH_DIALOG_KEYS.placeholder),
  helperText: defaultText(SEARCH_DIALOG_KEYS.helperText),
  noResults: defaultText(SEARCH_DIALOG_KEYS.noResults),
  startTyping: defaultText(SEARCH_DIALOG_KEYS.startTyping),
  searchFailed: defaultText(SEARCH_DIALOG_KEYS.searchFailed),
  lineLabel: defaultText(SEARCH_DIALOG_KEYS.lineLabel),
  moreSuffix: defaultText(SEARCH_DIALOG_KEYS.moreSuffix),
} as const;
