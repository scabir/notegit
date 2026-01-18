import type { FileTreeNode } from '../../../shared/types';

export interface FileTreeViewProps {
  tree: FileTreeNode[];
  selectedFile: string | null;
  onSelectFile: (path: string, type: 'file' | 'folder') => void;
  onCreateFile: (parentPath: string, fileName: string) => Promise<void>;
  onCreateFolder: (parentPath: string, folderName: string) => Promise<void>;
  onDelete: (path: string) => Promise<void>;
  onRename: (oldPath: string, newPath: string) => Promise<void>;
  onImport: (sourcePath: string, targetPath: string) => Promise<void>;
  isS3Repo: boolean;
}
