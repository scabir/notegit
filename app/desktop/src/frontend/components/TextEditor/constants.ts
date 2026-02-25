import enGbTextEditor from "../../i18n/en-GB/textEditor.json";

type TranslateFn = (key: string) => string;

const template = (
  source: string,
  params: Record<string, string | number>,
): string => {
  return source.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? "" : String(value);
  });
};

export const TEXT_EDITOR_KEYS = {
  emptyState: "textEditor.emptyState",
  modified: "textEditor.modified",
  showTreeTooltip: "textEditor.showTreeTooltip",
  backTooltip: "textEditor.backTooltip",
  forwardTooltip: "textEditor.forwardTooltip",
  saveTooltip: "textEditor.saveTooltip",
  exportTooltip: "textEditor.exportTooltip",
  failedExportNote: "textEditor.messages.failedExportNote",
  failedExportTemplate: "textEditor.messages.failedExportTemplate",
  unknownError: "textEditor.messages.unknownError",
} as const;

export const buildTextEditorText = (t: TranslateFn) => ({
  emptyState: t(TEXT_EDITOR_KEYS.emptyState),
  modified: t(TEXT_EDITOR_KEYS.modified),
  showTreeTooltip: t(TEXT_EDITOR_KEYS.showTreeTooltip),
  backTooltip: t(TEXT_EDITOR_KEYS.backTooltip),
  forwardTooltip: t(TEXT_EDITOR_KEYS.forwardTooltip),
  saveTooltip: t(TEXT_EDITOR_KEYS.saveTooltip),
  exportTooltip: t(TEXT_EDITOR_KEYS.exportTooltip),
});

export const buildTextEditorMessages = (t: TranslateFn) => {
  const failedExportTemplate = t(TEXT_EDITOR_KEYS.failedExportTemplate);
  return {
    failedExportNote: t(TEXT_EDITOR_KEYS.failedExportNote),
    failedExport: (message: string) =>
      template(failedExportTemplate, {
        message,
      }),
    unknownError: t(TEXT_EDITOR_KEYS.unknownError),
  };
};

export const TEXT_EDITOR_TEXT = {
  emptyState: enGbTextEditor.emptyState,
  modified: enGbTextEditor.modified,
  showTreeTooltip: enGbTextEditor.showTreeTooltip,
  backTooltip: enGbTextEditor.backTooltip,
  forwardTooltip: enGbTextEditor.forwardTooltip,
  saveTooltip: enGbTextEditor.saveTooltip,
  exportTooltip: enGbTextEditor.exportTooltip,
} as const;

export const TEXT_EDITOR_MESSAGES = {
  failedExportNote: enGbTextEditor.messages.failedExportNote,
  failedExport: (message: string) =>
    template(enGbTextEditor.messages.failedExportTemplate, {
      message,
    }),
  unknownError: enGbTextEditor.messages.unknownError,
} as const;
