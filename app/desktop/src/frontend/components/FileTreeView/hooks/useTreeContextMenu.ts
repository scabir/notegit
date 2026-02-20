import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import type { RefObject } from "react";
import type { FileTreeNode } from "../../../../shared/types";
import type { TreeContextMenuState } from "../types";

export type TreeContextMenuAction =
  | "rename"
  | "move"
  | "favorite"
  | "delete"
  | "duplicate";

type UseTreeContextMenuParams = {
  treeContainerRef: RefObject<HTMLDivElement>;
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
  const [treeContextMenuState, setTreeContextMenuState] =
    useState<TreeContextMenuState | null>(null);
  const selectedNodeRef = useRef<FileTreeNode | null>(selectedNode);

  useEffect(() => {
    selectedNodeRef.current = selectedNode;
  }, [selectedNode]);

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
          mode: "node",
          position,
        });
        return;
      }

      if (selectedNode) {
        setSelectedNode(null);
      }

      treeContainerRef.current?.focus();
      setTreeContextMenuState({
        node: null,
        mode: "empty",
        position,
      });
    },
    [onContextMenuOpen, selectedNode, setSelectedNode, treeContainerRef],
  );

  const handleCloseTreeContextMenu = useCallback(() => {
    setTreeContextMenuState(null);
  }, []);

  const handleTreeContextMenuAction = useCallback(
    (action: TreeContextMenuAction, node: FileTreeNode | null) => {
      handleCloseTreeContextMenu();
      const targetNode = node ?? selectedNodeRef.current;
      if (!targetNode) return;

      switch (action) {
        case "rename":
          onRename(targetNode);
          break;
        case "move":
          onMove(targetNode);
          break;
        case "favorite":
          onToggleFavorite(targetNode);
          break;
        case "delete":
          onDelete(targetNode);
          break;
        case "duplicate":
          onDuplicate?.(targetNode);
          break;
      }
    },
    [
      handleCloseTreeContextMenu,
      onDelete,
      onDuplicate,
      onMove,
      onRename,
      onToggleFavorite,
    ],
  );

  return {
    treeContextMenuState,
    handleTreeContextMenu,
    handleCloseTreeContextMenu,
    handleTreeContextMenuAction,
  };
}
