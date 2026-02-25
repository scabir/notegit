import { getDefaultTranslation } from "../../i18n/defaultTranslations";

export const TOOLBAR_KEYS = {
  collapseTree: "fileTreeView.toolbar.collapseTree",
  expandTree: "fileTreeView.toolbar.expandTree",
  back: "fileTreeView.toolbar.back",
  forward: "fileTreeView.toolbar.forward",
  newFile: "fileTreeView.toolbar.newFile",
  newFolder: "fileTreeView.toolbar.newFolder",
  importFile: "fileTreeView.toolbar.importFile",
  collapseAll: "fileTreeView.toolbar.collapseAll",
} as const;

const defaultText = (key: string): string => getDefaultTranslation(key);

export const TOOLBAR_TEXT = {
  collapseTree: defaultText(TOOLBAR_KEYS.collapseTree),
  expandTree: defaultText(TOOLBAR_KEYS.expandTree),
  back: defaultText(TOOLBAR_KEYS.back),
  forward: defaultText(TOOLBAR_KEYS.forward),
  newFile: defaultText(TOOLBAR_KEYS.newFile),
  newFolder: defaultText(TOOLBAR_KEYS.newFolder),
  importFile: defaultText(TOOLBAR_KEYS.importFile),
  collapseAll: defaultText(TOOLBAR_KEYS.collapseAll),
} as const;
