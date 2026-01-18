import type { FileContent } from '../../../shared/types';

export interface TextEditorProps {
  file: FileContent | null;
  onSave: (content: string) => void;
  onChange: (content: string, hasChanges: boolean) => void;
}
