import type { MarkdownFormatters } from '../MarkdownEditor/types';

export type CheatSheetType = 'markdown' | 'mermaid';

export interface MarkdownFormatToolbarProps {
  formatters: MarkdownFormatters;
  onSelectCheatSheet: (type: CheatSheetType) => void;
}
