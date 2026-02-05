export const SHORTCUT_HELPER_TEXT = {
  title: 'Keyboard Shortcuts',
  footer: 'Press F1 again to close this helper',
} as const;

export const SHORTCUT_HELPER_SECTIONS = [
  {
    title: 'File tree',
    shortcuts: [
      { label: 'Add new file', keys: 'Ctrl/Cmd + A' },
      { label: 'Add new folder', keys: 'Ctrl/Cmd + D' },
      { label: 'Delete selection', keys: 'Delete or Cmd + Delete (mac)' },
      { label: 'Import file', keys: 'Ctrl/Cmd + I' },
      { label: 'Rename selection', keys: 'Ctrl/Cmd + R or F2' },
      { label: 'Move selection', keys: 'Ctrl/Cmd + M' },
      { label: 'Duplicate file', keys: 'Ctrl/Cmd + Shift + U' },
      { label: 'Toggle favorite', keys: 'Ctrl/Cmd + Shift + S' },
    ],
  },
  {
    title: 'Editor formatting',
    shortcuts: [
      { label: 'Bold', keys: 'Ctrl/Cmd + B' },
      { label: 'Italic', keys: 'Ctrl/Cmd + T' },
      { label: 'Heading', keys: 'Ctrl/Cmd + H' },
      { label: 'Inline code', keys: 'Ctrl/Cmd + `' },
      { label: 'Code block', keys: 'Ctrl/Cmd + Shift + { or }' },
      { label: 'Link', keys: 'Ctrl/Cmd + L' },
      { label: 'Table', keys: 'Ctrl/Cmd + Shift + T' },
      { label: 'Footnote', keys: 'Ctrl/Cmd + Shift + F' },
      { label: 'Task list', keys: 'Ctrl/Cmd + Shift + L' },
      { label: 'Highlight', keys: 'Ctrl/Cmd + Shift + H' },
      { label: 'Definition list', keys: 'Ctrl/Cmd + Shift + D' },
      { label: 'Mermaid diagram', keys: 'Ctrl/Cmd + Shift + M' },
    ],
  },
  {
    title: 'Global',
    shortcuts: [
      { label: 'Save current note', keys: 'Ctrl/Cmd + S' },
      { label: 'Navigate back', keys: 'Ctrl/Cmd + Left' },
      { label: 'Navigate forward', keys: 'Ctrl/Cmd + Right' },
      { label: 'Quick file search', keys: 'Ctrl/Cmd + P' },
      { label: 'Quick search alternative', keys: 'Ctrl/Cmd + K' },
      { label: 'Find in file', keys: 'Ctrl/Cmd + F' },
      { label: 'Find in repo', keys: 'Ctrl/Cmd + Shift + F' },
      { label: 'Open settings', keys: 'Ctrl/Cmd + ,' },
      { label: 'Quit application', keys: 'Ctrl/Cmd + Q' },
      { label: 'Toggle this helper', keys: 'F1' },
    ],
  },
] as const;
