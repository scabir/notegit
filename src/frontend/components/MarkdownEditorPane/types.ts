import type React from 'react';
import type { AppSettings } from '../../../shared/types';
import type { ViewMode } from '../MarkdownEditor/types';

export interface MarkdownEditorPaneProps {
  isDark: boolean;
  viewMode: ViewMode;
  editorWidth: number;
  content: string;
  onChange: (value: string) => void;
  editorRef: React.RefObject<any>;
  editorKeymap: any;
  appSettings: AppSettings | null;
}
