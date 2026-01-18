export const MARKDOWN_EDITOR_TEXT = {
  emptyState: 'Select a file to edit',
  unsaved: 'Unsaved changes',
  saveTooltip: 'Save (Cmd/Ctrl+S)',
  exportTooltip: 'Export Note',
  editorOnlyTooltip: 'Editor Only',
  splitViewTooltip: 'Split View',
  previewOnlyTooltip: 'Preview Only',
  boldTooltip: 'Bold (Ctrl+B)',
  italicTooltip: 'Italic (Ctrl+I)',
  headingTooltip: 'Heading',
  bulletTooltip: 'Bullet List',
  numberedTooltip: 'Numbered List',
  quoteTooltip: 'Quote',
  inlineCodeTooltip: 'Inline Code',
  codeBlockTooltip: 'Code Block',
  linkTooltip: 'Link',
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
} as const;
