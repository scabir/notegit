import type { FileContent } from '../../../shared/types';

export type ViewMode = 'split' | 'editor' | 'preview';

export interface MarkdownEditorProps {
  file: FileContent | null;
  repoPath: string | null;
  onSave: (content: string) => void;
  onChange: (content: string, hasChanges: boolean) => void;
}
