import aboutDialogEnGb from "../i18n/en-GB/aboutDialog.json";
import commitDialogEnGb from "../i18n/en-GB/commitDialog.json";
import commonEnGb from "../i18n/en-GB/common.json";
import editorShellEnGb from "../i18n/en-GB/editorShell.json";
import fileTreeContextMenusEnGb from "../i18n/en-GB/fileTreeContextMenus.json";
import fileTreeViewEnGb from "../i18n/en-GB/fileTreeView.json";
import findReplaceBarEnGb from "../i18n/en-GB/findReplaceBar.json";
import historyPanelEnGb from "../i18n/en-GB/historyPanel.json";
import historyViewerEnGb from "../i18n/en-GB/historyViewer.json";
import imageViewerEnGb from "../i18n/en-GB/imageViewer.json";
import markdownEditorEnGb from "../i18n/en-GB/markdownEditor.json";
import moveToFolderDialogEnGb from "../i18n/en-GB/moveToFolderDialog.json";
import repoSearchDialogEnGb from "../i18n/en-GB/repoSearchDialog.json";
import repoSetupDialogEnGb from "../i18n/en-GB/repoSetupDialog.json";
import searchDialogEnGb from "../i18n/en-GB/searchDialog.json";
import shortcutHelperEnGb from "../i18n/en-GB/shortcutHelper.json";
import settingsDialogEnGb from "../i18n/en-GB/settingsDialog.json";
import settingsExportTabEnGb from "../i18n/en-GB/settingsExportTab.json";
import settingsLogsTabEnGb from "../i18n/en-GB/settingsLogsTab.json";
import settingsProfilesTabEnGb from "../i18n/en-GB/settingsProfilesTab.json";
import settingsRepositoryTabEnGb from "../i18n/en-GB/settingsRepositoryTab.json";
import statusBarEnGb from "../i18n/en-GB/statusBar.json";
import textEditorEnGb from "../i18n/en-GB/textEditor.json";

export const defaultTranslations = {
  aboutDialog: aboutDialogEnGb,
  commitDialog: commitDialogEnGb,
  common: commonEnGb,
  editorShell: editorShellEnGb,
  fileTreeContextMenus: fileTreeContextMenusEnGb,
  fileTreeView: fileTreeViewEnGb,
  findReplaceBar: findReplaceBarEnGb,
  historyPanel: historyPanelEnGb,
  historyViewer: historyViewerEnGb,
  imageViewer: imageViewerEnGb,
  markdownEditor: markdownEditorEnGb,
  moveToFolderDialog: moveToFolderDialogEnGb,
  repoSearchDialog: repoSearchDialogEnGb,
  repoSetupDialog: repoSetupDialogEnGb,
  searchDialog: searchDialogEnGb,
  shortcutHelper: shortcutHelperEnGb,
  settingsExportTab: settingsExportTabEnGb,
  settingsDialog: settingsDialogEnGb,
  settingsLogsTab: settingsLogsTabEnGb,
  settingsProfilesTab: settingsProfilesTabEnGb,
  settingsRepositoryTab: settingsRepositoryTabEnGb,
  statusBar: statusBarEnGb,
  textEditor: textEditorEnGb,
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const resolveDefaultTranslation = (key: string): string | undefined => {
  const segments = key
    .split(".")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return undefined;
  }

  let current: unknown = defaultTranslations;
  for (const segment of segments) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }

  return typeof current === "string" ? current : undefined;
};

export const getDefaultTranslation = (key: string): string => {
  const value = resolveDefaultTranslation(key);
  return value === undefined ? key : value;
};
