import type { FileContent } from '../../../shared/types';

export type ViewMode = 'split' | 'editor' | 'preview';

export interface TreePanelControls {
  onToggleTree: () => void;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
}

export interface MarkdownEditorProps {
  file: FileContent | null;
  repoPath: string | null;
  onSave: (content: string) => void;
  onChange: (content: string, hasChanges: boolean) => void;
  treePanelControls?: TreePanelControls;
}
