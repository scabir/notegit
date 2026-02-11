import type { ReactElement } from 'react';

export type ToolbarAction = {
  tooltip: string;
  icon: ReactElement;
  onClick: () => void;
  disabled?: boolean;
};

export type FileTreeToolbarProps = {
  onBack: () => void;
  onForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onNewFile: () => void;
  onNewFolder: () => void;
  onImport: () => void;
  onCollapseAll: () => void;
};
