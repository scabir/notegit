import enGbShortcutHelper from "../../i18n/en-GB/shortcutHelper.json";

type TranslateFn = (key: string) => string;

export const SHORTCUT_HELPER_KEYS = {
  title: "shortcutHelper.title",
  footer: "shortcutHelper.footer",
} as const;

export const SHORTCUT_HELPER_SECTIONS = [
  {
    titleKey: "shortcutHelper.sections.fileTree",
    shortcuts: [
      { labelKey: "shortcutHelper.labels.addNewFile", keys: "Ctrl/Cmd + A" },
      { labelKey: "shortcutHelper.labels.addNewFolder", keys: "Ctrl/Cmd + D" },
      {
        labelKey: "shortcutHelper.labels.deleteSelection",
        keys: "Delete or Cmd + Delete (mac)",
      },
      { labelKey: "shortcutHelper.labels.importFile", keys: "Ctrl/Cmd + I" },
      {
        labelKey: "shortcutHelper.labels.renameSelection",
        keys: "Ctrl/Cmd + R or F2",
      },
      { labelKey: "shortcutHelper.labels.moveSelection", keys: "Ctrl/Cmd + M" },
      {
        labelKey: "shortcutHelper.labels.duplicateFile",
        keys: "Ctrl/Cmd + Shift + U",
      },
      {
        labelKey: "shortcutHelper.labels.toggleFavorite",
        keys: "Ctrl/Cmd + Shift + S",
      },
      {
        labelKey: "shortcutHelper.labels.collapseAllFolders",
        keys: "Ctrl/Cmd + Shift + E",
      },
    ],
  },
  {
    titleKey: "shortcutHelper.sections.editorFormatting",
    shortcuts: [
      { labelKey: "shortcutHelper.labels.bold", keys: "Ctrl/Cmd + B" },
      { labelKey: "shortcutHelper.labels.italic", keys: "Ctrl/Cmd + T" },
      { labelKey: "shortcutHelper.labels.heading", keys: "Ctrl/Cmd + H" },
      { labelKey: "shortcutHelper.labels.inlineCode", keys: "Ctrl/Cmd + `" },
      {
        labelKey: "shortcutHelper.labels.codeBlock",
        keys: "Ctrl/Cmd + Shift + { or }",
      },
      { labelKey: "shortcutHelper.labels.link", keys: "Ctrl/Cmd + L" },
      { labelKey: "shortcutHelper.labels.table", keys: "Ctrl/Cmd + Shift + T" },
      {
        labelKey: "shortcutHelper.labels.footnote",
        keys: "Ctrl/Cmd + Shift + F",
      },
      {
        labelKey: "shortcutHelper.labels.taskList",
        keys: "Ctrl/Cmd + Shift + L",
      },
      {
        labelKey: "shortcutHelper.labels.highlight",
        keys: "Ctrl/Cmd + Shift + H",
      },
      {
        labelKey: "shortcutHelper.labels.definitionList",
        keys: "Ctrl/Cmd + Shift + D",
      },
      {
        labelKey: "shortcutHelper.labels.mermaidDiagram",
        keys: "Ctrl/Cmd + Shift + M",
      },
    ],
  },
  {
    titleKey: "shortcutHelper.sections.global",
    shortcuts: [
      {
        labelKey: "shortcutHelper.labels.saveCurrentNote",
        keys: "Ctrl/Cmd + S",
      },
      {
        labelKey: "shortcutHelper.labels.navigateBack",
        keys: "Ctrl/Cmd + Left",
      },
      {
        labelKey: "shortcutHelper.labels.navigateForward",
        keys: "Ctrl/Cmd + Right",
      },
      {
        labelKey: "shortcutHelper.labels.quickFileSearch",
        keys: "Ctrl/Cmd + P",
      },
      {
        labelKey: "shortcutHelper.labels.quickSearchAlternative",
        keys: "Ctrl/Cmd + K",
      },
      { labelKey: "shortcutHelper.labels.findInFile", keys: "Ctrl/Cmd + F" },
      {
        labelKey: "shortcutHelper.labels.findInRepo",
        keys: "Ctrl/Cmd + Shift + F",
      },
      { labelKey: "shortcutHelper.labels.openSettings", keys: "Ctrl/Cmd + ," },
      {
        labelKey: "shortcutHelper.labels.quitApplication",
        keys: "Ctrl/Cmd + Q",
      },
      { labelKey: "shortcutHelper.labels.toggleThisHelper", keys: "F1" },
    ],
  },
] as const;

export const buildShortcutHelperText = (t: TranslateFn) => ({
  title: t(SHORTCUT_HELPER_KEYS.title),
  footer: t(SHORTCUT_HELPER_KEYS.footer),
});

export const buildShortcutHelperSections = (t: TranslateFn) =>
  SHORTCUT_HELPER_SECTIONS.map((section) => ({
    title: t(section.titleKey),
    shortcuts: section.shortcuts.map((shortcut) => ({
      label: t(shortcut.labelKey),
      keys: shortcut.keys,
    })),
  }));

export const SHORTCUT_HELPER_TEXT = {
  title: enGbShortcutHelper.title,
  footer: enGbShortcutHelper.footer,
} as const;
