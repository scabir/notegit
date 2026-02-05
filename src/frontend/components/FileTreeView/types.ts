import { type ReactElement } from 'react';
import type { FileTreeNode } from '../../../shared/types';

export interface FileTreeViewProps {
  tree: FileTreeNode[];
  selectedFile: string | null;
  onSelectFile: (path: string, type: 'file' | 'folder') => void;
  onCreateFile: (parentPath: string, fileName: string) => Promise<void>;
  onCreateFolder: (parentPath: string, folderName: string) => Promise<void>;
  onDelete: (path: string) => Promise<void>;
  onRename: (oldPath: string, newPath: string) => Promise<void>;
  onDuplicate?: (path: string) => Promise<string | void>;
  onImport: (sourcePath: string, targetPath: string) => Promise<void>;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  canNavigateBack?: boolean;
  canNavigateForward?: boolean;
  isS3Repo: boolean;
}

export interface FavoriteMenuState {
  anchorEl: HTMLElement | null;
  path: string | null;
}

export interface TreeContextMenuState {
  node: FileTreeNode | null;
  mode: 'node' | 'empty';
  position: { top: number; left: number } | null;
}

export type ContextMenuItem = {
  label: string;
  icon: ReactElement;
  action: () => void;
  testId: string;
};
