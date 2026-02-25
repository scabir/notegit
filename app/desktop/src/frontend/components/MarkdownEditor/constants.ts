import enGbMarkdownEditor from "../../i18n/en-GB/markdownEditor.json";

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

export const MARKDOWN_EDITOR_KEYS = {
  emptyState: "markdownEditor.emptyState",
  unsaved: "markdownEditor.unsaved",
  showTreeTooltip: "markdownEditor.showTreeTooltip",
  backTooltip: "markdownEditor.backTooltip",
  forwardTooltip: "markdownEditor.forwardTooltip",
  saveTooltip: "markdownEditor.saveTooltip",
  exportTooltip: "markdownEditor.exportTooltip",
  editorOnlyTooltip: "markdownEditor.editorOnlyTooltip",
  splitViewTooltip: "markdownEditor.splitViewTooltip",
  previewOnlyTooltip: "markdownEditor.previewOnlyTooltip",
  viewModeAriaEditorOnly: "markdownEditor.viewModeAriaEditorOnly",
  viewModeAriaSplitView: "markdownEditor.viewModeAriaSplitView",
  viewModeAriaPreviewOnly: "markdownEditor.viewModeAriaPreviewOnly",
  boldTooltip: "markdownEditor.boldTooltip",
  italicTooltip: "markdownEditor.italicTooltip",
  headingTooltip: "markdownEditor.headingTooltip",
  bulletTooltip: "markdownEditor.bulletTooltip",
  numberedTooltip: "markdownEditor.numberedTooltip",
  quoteTooltip: "markdownEditor.quoteTooltip",
  inlineCodeTooltip: "markdownEditor.inlineCodeTooltip",
  codeBlockTooltip: "markdownEditor.codeBlockTooltip",
  linkTooltip: "markdownEditor.linkTooltip",
  tableTooltip: "markdownEditor.tableTooltip",
  extrasTooltip: "markdownEditor.extrasTooltip",
  cheatsheetTooltip: "markdownEditor.cheatsheetTooltip",
  shortcutsTooltip: "markdownEditor.shortcutsTooltip",
  mermaidLabel: "markdownEditor.mermaidLabel",
  rawMarkdownLabel: "markdownEditor.rawMarkdownLabel",
  markdownCheatsheetLabel: "markdownEditor.markdownCheatsheetLabel",
  mermaidCheatsheetLabel: "markdownEditor.mermaidCheatsheetLabel",
  closeCheatsheetLabel: "markdownEditor.closeCheatsheetLabel",
  footnoteLabel: "markdownEditor.footnoteLabel",
  taskListLabel: "markdownEditor.taskListLabel",
  highlightLabel: "markdownEditor.highlightLabel",
  definitionListLabel: "markdownEditor.definitionListLabel",
  failedExportNote: "markdownEditor.messages.failedExportNote",
  failedExportTemplate: "markdownEditor.messages.failedExportTemplate",
  unknownError: "markdownEditor.messages.unknownError",
  failedRenderMermaid: "markdownEditor.messages.failedRenderMermaid",
  mermaidRenderErrorPrefix: "markdownEditor.messages.mermaidRenderErrorPrefix",
} as const;

export const buildMarkdownEditorText = (t: TranslateFn) => ({
  emptyState: t(MARKDOWN_EDITOR_KEYS.emptyState),
  unsaved: t(MARKDOWN_EDITOR_KEYS.unsaved),
  showTreeTooltip: t(MARKDOWN_EDITOR_KEYS.showTreeTooltip),
  backTooltip: t(MARKDOWN_EDITOR_KEYS.backTooltip),
  forwardTooltip: t(MARKDOWN_EDITOR_KEYS.forwardTooltip),
  saveTooltip: t(MARKDOWN_EDITOR_KEYS.saveTooltip),
  exportTooltip: t(MARKDOWN_EDITOR_KEYS.exportTooltip),
  editorOnlyTooltip: t(MARKDOWN_EDITOR_KEYS.editorOnlyTooltip),
  splitViewTooltip: t(MARKDOWN_EDITOR_KEYS.splitViewTooltip),
  previewOnlyTooltip: t(MARKDOWN_EDITOR_KEYS.previewOnlyTooltip),
  viewModeAriaEditorOnly: t(MARKDOWN_EDITOR_KEYS.viewModeAriaEditorOnly),
  viewModeAriaSplitView: t(MARKDOWN_EDITOR_KEYS.viewModeAriaSplitView),
  viewModeAriaPreviewOnly: t(MARKDOWN_EDITOR_KEYS.viewModeAriaPreviewOnly),
  boldTooltip: t(MARKDOWN_EDITOR_KEYS.boldTooltip),
  italicTooltip: t(MARKDOWN_EDITOR_KEYS.italicTooltip),
  headingTooltip: t(MARKDOWN_EDITOR_KEYS.headingTooltip),
  bulletTooltip: t(MARKDOWN_EDITOR_KEYS.bulletTooltip),
  numberedTooltip: t(MARKDOWN_EDITOR_KEYS.numberedTooltip),
  quoteTooltip: t(MARKDOWN_EDITOR_KEYS.quoteTooltip),
  inlineCodeTooltip: t(MARKDOWN_EDITOR_KEYS.inlineCodeTooltip),
  codeBlockTooltip: t(MARKDOWN_EDITOR_KEYS.codeBlockTooltip),
  linkTooltip: t(MARKDOWN_EDITOR_KEYS.linkTooltip),
  tableTooltip: t(MARKDOWN_EDITOR_KEYS.tableTooltip),
  extrasTooltip: t(MARKDOWN_EDITOR_KEYS.extrasTooltip),
  cheatsheetTooltip: t(MARKDOWN_EDITOR_KEYS.cheatsheetTooltip),
  shortcutsTooltip: t(MARKDOWN_EDITOR_KEYS.shortcutsTooltip),
  mermaidLabel: t(MARKDOWN_EDITOR_KEYS.mermaidLabel),
  rawMarkdownLabel: t(MARKDOWN_EDITOR_KEYS.rawMarkdownLabel),
  markdownCheatsheetLabel: t(MARKDOWN_EDITOR_KEYS.markdownCheatsheetLabel),
  mermaidCheatsheetLabel: t(MARKDOWN_EDITOR_KEYS.mermaidCheatsheetLabel),
  closeCheatsheetLabel: t(MARKDOWN_EDITOR_KEYS.closeCheatsheetLabel),
  footnoteLabel: t(MARKDOWN_EDITOR_KEYS.footnoteLabel),
  taskListLabel: t(MARKDOWN_EDITOR_KEYS.taskListLabel),
  highlightLabel: t(MARKDOWN_EDITOR_KEYS.highlightLabel),
  definitionListLabel: t(MARKDOWN_EDITOR_KEYS.definitionListLabel),
});

export const buildMarkdownEditorMessages = (t: TranslateFn) => {
  const failedExportTemplate = t(MARKDOWN_EDITOR_KEYS.failedExportTemplate);
  return {
    failedExportNote: t(MARKDOWN_EDITOR_KEYS.failedExportNote),
    failedExport: (message: string) =>
      template(failedExportTemplate, {
        message,
      }),
    unknownError: t(MARKDOWN_EDITOR_KEYS.unknownError),
    failedRenderMermaid: t(MARKDOWN_EDITOR_KEYS.failedRenderMermaid),
    mermaidRenderErrorPrefix: t(MARKDOWN_EDITOR_KEYS.mermaidRenderErrorPrefix),
  };
};

export const MARKDOWN_EDITOR_TEXT = {
  emptyState: enGbMarkdownEditor.emptyState,
  unsaved: enGbMarkdownEditor.unsaved,
  showTreeTooltip: enGbMarkdownEditor.showTreeTooltip,
  backTooltip: enGbMarkdownEditor.backTooltip,
  forwardTooltip: enGbMarkdownEditor.forwardTooltip,
  saveTooltip: enGbMarkdownEditor.saveTooltip,
  exportTooltip: enGbMarkdownEditor.exportTooltip,
  editorOnlyTooltip: enGbMarkdownEditor.editorOnlyTooltip,
  splitViewTooltip: enGbMarkdownEditor.splitViewTooltip,
  previewOnlyTooltip: enGbMarkdownEditor.previewOnlyTooltip,
  viewModeAriaEditorOnly: enGbMarkdownEditor.viewModeAriaEditorOnly,
  viewModeAriaSplitView: enGbMarkdownEditor.viewModeAriaSplitView,
  viewModeAriaPreviewOnly: enGbMarkdownEditor.viewModeAriaPreviewOnly,
  boldTooltip: enGbMarkdownEditor.boldTooltip,
  italicTooltip: enGbMarkdownEditor.italicTooltip,
  headingTooltip: enGbMarkdownEditor.headingTooltip,
  bulletTooltip: enGbMarkdownEditor.bulletTooltip,
  numberedTooltip: enGbMarkdownEditor.numberedTooltip,
  quoteTooltip: enGbMarkdownEditor.quoteTooltip,
  inlineCodeTooltip: enGbMarkdownEditor.inlineCodeTooltip,
  codeBlockTooltip: enGbMarkdownEditor.codeBlockTooltip,
  linkTooltip: enGbMarkdownEditor.linkTooltip,
  tableTooltip: enGbMarkdownEditor.tableTooltip,
  extrasTooltip: enGbMarkdownEditor.extrasTooltip,
  cheatsheetTooltip: enGbMarkdownEditor.cheatsheetTooltip,
  shortcutsTooltip: enGbMarkdownEditor.shortcutsTooltip,
  mermaidLabel: enGbMarkdownEditor.mermaidLabel,
  rawMarkdownLabel: enGbMarkdownEditor.rawMarkdownLabel,
  markdownCheatsheetLabel: enGbMarkdownEditor.markdownCheatsheetLabel,
  mermaidCheatsheetLabel: enGbMarkdownEditor.mermaidCheatsheetLabel,
  closeCheatsheetLabel: enGbMarkdownEditor.closeCheatsheetLabel,
  footnoteLabel: enGbMarkdownEditor.footnoteLabel,
  taskListLabel: enGbMarkdownEditor.taskListLabel,
  highlightLabel: enGbMarkdownEditor.highlightLabel,
  definitionListLabel: enGbMarkdownEditor.definitionListLabel,
} as const;

export const MARKDOWN_EDITOR_MESSAGES = {
  failedExportNote: enGbMarkdownEditor.messages.failedExportNote,
  failedExport: (message: string) =>
    template(enGbMarkdownEditor.messages.failedExportTemplate, {
      message,
    }),
  unknownError: enGbMarkdownEditor.messages.unknownError,
  failedRenderMermaid: enGbMarkdownEditor.messages.failedRenderMermaid,
  mermaidRenderErrorPrefix:
    enGbMarkdownEditor.messages.mermaidRenderErrorPrefix,
} as const;

export const MARKDOWN_INSERT_DEFAULTS = {
  bold: enGbMarkdownEditor.insertDefaults.bold,
  italic: enGbMarkdownEditor.insertDefaults.italic,
  code: enGbMarkdownEditor.insertDefaults.code,
  codeBlock: enGbMarkdownEditor.insertDefaults.codeBlock,
  heading: enGbMarkdownEditor.insertDefaults.heading,
  quote: enGbMarkdownEditor.insertDefaults.quote,
  listItem: enGbMarkdownEditor.insertDefaults.listItem,
  linkText: enGbMarkdownEditor.insertDefaults.linkText,
  table: enGbMarkdownEditor.insertDefaults.table,
  rawMarkdown: enGbMarkdownEditor.insertDefaults.rawMarkdown,
  footnote: enGbMarkdownEditor.insertDefaults.footnote,
  taskList: enGbMarkdownEditor.insertDefaults.taskList,
  highlight: enGbMarkdownEditor.insertDefaults.highlight,
  definitionList: enGbMarkdownEditor.insertDefaults.definitionList,
  mermaid: `erDiagram
          CUSTOMER }|..|{ DELIVERY-ADDRESS : has
          CUSTOMER ||--o{ ORDER : places
          CUSTOMER ||--o{ INVOICE : "liable for"
          DELIVERY-ADDRESS ||--o{ ORDER : receives
          INVOICE ||--|{ ORDER : covers
          ORDER ||--|{ ORDER-ITEM : includes
          PRODUCT-CATEGORY ||--|{ PRODUCT : contains
          PRODUCT ||--o{ ORDER-ITEM : "ordered in"`,
} as const;

export const MARKDOWN_INSERT_TOKENS = {
  bold: ["**", "**"],
  italic: ["*", "*"],
  code: ["`", "`"],
  codeBlock: ["\n```\n", "\n```\n"],
  heading: ["## ", ""],
  quote: ["> ", ""],
  bullet: ["- ", ""],
  numbered: ["1. ", ""],
  link: ["[", "](url)"],
  table: [
    "\n|  | **Col1** | **Col2** |\n| --- | --- | --- |\n| **Row1** | ",
    " |  |\n| **Row2** |  |  |\n",
  ],
  rawMarkdown: ["\n```markdown\n", "\n```\n"],
  taskList: ["\n- [ ] ", `\n- [x] ${MARKDOWN_INSERT_DEFAULTS.taskList}`],
  highlight: ["==", "=="],
  definitionList: [`\n${MARKDOWN_INSERT_DEFAULTS.definitionList}\n: `, "\n"],
  mermaid: ["\n```mermaid\n", "\n```\n"],
} as const;
