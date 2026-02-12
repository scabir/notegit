import type { ViewMode } from '../MarkdownEditor/types';

export type MarkdownCheatSheetType = 'markdown' | 'mermaid' | null;

export interface MarkdownPreviewPaneProps {
  isDark: boolean;
  viewMode: ViewMode;
  editorWidth: number;
  repoPath: string | null;
  filePath: string | null;
  content: string;
  cheatSheetType: MarkdownCheatSheetType;
  onCloseCheatSheet: () => void;
}
