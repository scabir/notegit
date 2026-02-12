import type { FileContent } from '../../../shared/types';

export type ViewMode = 'split' | 'editor' | 'preview';

export interface TreePanelControls {
  onToggleTree: () => void;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
}

export interface MarkdownFormatters {
  formatBold: () => void;
  formatItalic: () => void;
  formatHeading: () => void;
  formatQuote: () => void;
  formatBulletList: () => void;
  formatNumberedList: () => void;
  formatCode: () => void;
  formatCodeBlock: () => void;
  formatLink: () => void;
  formatTable: () => void;
  formatFootnote: () => void;
  formatTaskList: () => void;
  formatHighlight: () => void;
  formatDefinitionList: () => void;
  formatMermaid: () => void;
  formatRawMarkdown: () => void;
}

export interface MarkdownEditorProps {
  file: FileContent | null;
  repoPath: string | null;
  onSave: (content: string) => void;
  onChange: (content: string, hasChanges: boolean) => void;
  treePanelControls?: TreePanelControls;
  onOpenLinkedFile?: (filePath: string) => void | Promise<void>;
}
