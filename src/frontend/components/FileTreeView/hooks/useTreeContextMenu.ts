import { useCallback, useState } from 'react';
import type { MouseEvent } from 'react';
import type { FileTreeNode } from '../../../../shared/types';
import type { TreeContextMenuState } from '../types';

export type TreeContextMenuAction = 'rename' | 'move' | 'favorite' | 'delete' | 'duplicate';

type UseTreeContextMenuParams = {
  treeContainerRef: React.RefObject<HTMLDivElement>;
  selectedNode: FileTreeNode | null;
  setSelectedNode: (node: FileTreeNode | null) => void;
  onRename: (node: FileTreeNode) => void;
  onMove: (node: FileTreeNode) => void;
  onToggleFavorite: (node: FileTreeNode) => void;
  onDelete: (node: FileTreeNode) => void;
  onDuplicate?: (node: FileTreeNode) => void;
  onContextMenuOpen?: () => void;
};

export function useTreeContextMenu({
  treeContainerRef,
  selectedNode,
  setSelectedNode,
  onRename,
  onMove,
  onToggleFavorite,
  onDelete,
  onDuplicate,
  onContextMenuOpen,
}: UseTreeContextMenuParams) {
  const [treeContextMenuState, setTreeContextMenuState] = useState<TreeContextMenuState | null>(null);

  const handleTreeContextMenu = useCallback(
    (event: MouseEvent<HTMLElement>, node?: FileTreeNode) => {
      event.preventDefault();
      event.stopPropagation();

      onContextMenuOpen?.();

      const position = { top: event.clientY, left: event.clientX };

      if (node) {
        setSelectedNode(node);
        treeContainerRef.current?.focus();
        setTreeContextMenuState({
          node,
          mode: 'node',
          position,
        });
        return;
      }

      if (selectedNode) {
        return;
      }

      treeContainerRef.current?.focus();
      setTreeContextMenuState({
        node: null,
        mode: 'empty',
        position,
      });
    },
    [
      onContextMenuOpen,
      selectedNode,
      setSelectedNode,
      treeContainerRef,
    ]
  );

  const handleCloseTreeContextMenu = useCallback(() => {
    setTreeContextMenuState(null);
  }, []);

  const handleTreeContextMenuAction = useCallback(
    (action: TreeContextMenuAction, node: FileTreeNode | null) => {
      handleCloseTreeContextMenu();
      if (!node) return;

      switch (action) {
        case 'rename':
          onRename(node);
          break;
        case 'move':
          onMove(node);
          break;
        case 'favorite':
          onToggleFavorite(node);
          break;
        case 'delete':
          onDelete(node);
          break;
        case 'duplicate':
          onDuplicate?.(node);
          break;
      }
    },
    [handleCloseTreeContextMenu, onDelete, onDuplicate, onMove, onRename, onToggleFavorite]
  );

  return {
    treeContextMenuState,
    handleTreeContextMenu,
    handleCloseTreeContextMenu,
    handleTreeContextMenuAction,
  };
}
