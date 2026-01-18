import type { FileTreeNode } from '../../../shared/types';

export interface MoveToFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (destinationPath: string) => void;
  itemToMove: FileTreeNode | null;
  tree: FileTreeNode[];
}
