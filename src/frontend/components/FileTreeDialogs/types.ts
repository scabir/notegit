import type { FileTreeNode } from '../../../shared/types';

export interface FileTreeDialogsText {
  createFileTitle: string;
  createFolderTitle: string;
  fileNameLabel: string;
  folderNameLabel: string;
  filePlaceholder: string;
  folderPlaceholder: string;
  cancel: string;
  create: string;
  creating: string;
  renameFolderTitle: string;
  renameFileTitle: string;
  newNameLabel: string;
  renameAction: string;
  renaming: string;
}

export interface FileTreeDialogsProps {
  text: FileTreeDialogsText;
  tree: FileTreeNode[];
  selectedNode: FileTreeNode | null;
  createFileDialogOpen: boolean;
  createFolderDialogOpen: boolean;
  renameDialogOpen: boolean;
  moveDialogOpen: boolean;
  newItemName: string;
  creating: boolean;
  errorMessage: string;
  creationLocationText: string;
  fileHelperText: string;
  onSetName: (value: string) => void;
  onClearError: () => void;
  onCloseCreateFileDialog: () => void;
  onCloseCreateFolderDialog: () => void;
  onCloseRenameDialog: () => void;
  onCloseMoveDialog: () => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onRename: () => void;
  onMoveToFolder: (destinationPath: string) => Promise<void>;
}
