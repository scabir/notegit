export const MARKDOWN_EDITOR_TEXT = {
  emptyState: 'Select a file to edit',
  unsaved: 'Unsaved changes',
  saveTooltip: 'Save (Cmd/Ctrl+S)',
  exportTooltip: 'Export Note',
  editorOnlyTooltip: 'Editor Only',
  splitViewTooltip: 'Split View',
  previewOnlyTooltip: 'Preview Only',
  boldTooltip: 'Bold (Ctrl+B)',
  italicTooltip: 'Italic (Ctrl+T)',
  headingTooltip: 'Heading (Ctrl+H)',
  bulletTooltip: 'Bullet List',
  numberedTooltip: 'Numbered List',
  quoteTooltip: 'Quote',
  inlineCodeTooltip: 'Inline Code (Ctrl+`)',
  codeBlockTooltip: 'Code Block (Ctrl+Shift+{ or })',
  linkTooltip: 'Link',
  tableTooltip: 'Table',
  extrasTooltip: 'Extras',
  cheatsheetTooltip: 'Cheat Sheets',
  shortcutsTooltip: 'Keyboard Shortcuts',
  mermaidLabel: 'Mermaid Diagram',
  rawMarkdownLabel: 'Raw Markdown',
  markdownCheatsheetLabel: 'Markdown format cheatsheet',
  mermaidCheatsheetLabel: 'Mermaid diagrams cheatsheet',
  closeCheatsheetLabel: 'Close cheat sheet',
  footnoteLabel: 'Footnote',
  taskListLabel: 'Task List',
  highlightLabel: 'Highlight',
  definitionListLabel: 'Definition List',
} as const;

export const MARKDOWN_INSERT_DEFAULTS = {
  bold: 'bold text',
  italic: 'italic text',
  code: 'code',
  codeBlock: 'code block',
  heading: 'Heading',
  quote: 'quote',
  listItem: 'list item',
  linkText: 'link text',
  table: '',
  rawMarkdown: 'raw markdown',
  footnote: 'Footnote text',
  taskList: 'Task',
  highlight: 'very important words',
  definitionList: 'definition',
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
  bold: ['**', '**'],
  italic: ['*', '*'],
  code: ['`', '`'],
  codeBlock: ['\n```\n', '\n```\n'],
  heading: ['## ', ''],
  quote: ['> ', ''],
  bullet: ['- ', ''],
  numbered: ['1. ', ''],
  link: ['[', '](url)'],
  table: ['\n|  | **Col1** | **Col2** |\n| --- | --- | --- |\n| **Row1** | ', ' |  |\n| **Row2** |  |  |\n'],
  rawMarkdown: ['\n```markdown\n', '\n```\n'],
  taskList: ['\n- [ ] ', '\n- [x] Done'],
  highlight: ['==', '=='],
  definitionList: ['\nterm\n: ', '\n'],
  mermaid: ['\n```mermaid\n', '\n```\n'],
} as const;
