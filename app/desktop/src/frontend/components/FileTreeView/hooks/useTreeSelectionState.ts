import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, SyntheticEvent } from "react";
import type { FileTreeNode } from "../../../../shared/types";
import { findNode, findNodeByPath } from "../utils";

type UseTreeSelectionStateParams = {
  tree: FileTreeNode[];
  selectedFile: string | null;
  onSelectFile: (path: string, type: "file" | "folder") => void;
  onCollapseAll?: () => void;
};

export function useTreeSelectionState({
  tree,
  selectedFile,
  onSelectFile,
  onCollapseAll,
}: UseTreeSelectionStateParams) {
  const [selectedNode, setSelectedNode] = useState<FileTreeNode | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const treeContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedNodeForActions = useMemo(() => {
    if (selectedNode) return selectedNode;
    if (!selectedFile) return null;
    return findNodeByPath(tree, selectedFile);
  }, [selectedFile, selectedNode, tree]);

  useEffect(() => {
    if (selectedFile) {
      const pathParts = selectedFile.split("/");
      const foldersToExpand: string[] = [];

      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderPath = pathParts.slice(0, i + 1).join("/");
        foldersToExpand.push(folderPath);
      }

      if (foldersToExpand.length > 0) {
        setExpanded((prev) => {
          const newExpanded = new Set([...prev, ...foldersToExpand]);
          return Array.from(newExpanded);
        });
      }
    }
  }, [selectedFile]);

  useEffect(() => {
    if (!selectedFile) return;
    if (selectedNode?.type === "folder") return;
    if (selectedNode?.path === selectedFile) return;

    const node = findNodeByPath(tree, selectedFile);
    if (node) {
      setSelectedNode(node);
    }
  }, [selectedFile, selectedNode, tree]);

  const handleNodeSelect = useCallback(
    (_event: SyntheticEvent, nodeId: string) => {
      const node = findNode(tree, nodeId);
      if (node) {
        setSelectedNode(node);
        if (node.type === "file") {
          onSelectFile(node.path, node.type);
        }
        treeContainerRef.current?.focus();
      }
    },
    [onSelectFile, tree],
  );

  const handleContainerClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      const target = event.target as HTMLElement;

      if (
        target.classList.contains("tree-container") ||
        (!target.closest(".MuiTreeItem-root") &&
          !target.closest(".MuiTreeView-root"))
      ) {
        setSelectedNode(null);
        treeContainerRef.current?.focus();
      }
    },
    [],
  );

  const handleCollapseAll = useCallback(() => {
    setExpanded([]);
    onCollapseAll?.();
  }, [onCollapseAll]);

  const handleNodeToggle = useCallback(
    (_event: SyntheticEvent, nodeIds: string[]) => {
      setExpanded(nodeIds);
    },
    [],
  );

  const expandPathToNode = useCallback((node: FileTreeNode) => {
    const pathParts = node.path.split("/").filter(Boolean);
    const depth =
      node.type === "folder" ? pathParts.length : pathParts.length - 1;
    if (depth <= 0) return;

    const foldersToExpand = Array.from({ length: depth }, (_, index) =>
      pathParts.slice(0, index + 1).join("/"),
    );

    setExpanded((prev) => {
      const nextExpanded = new Set([...prev, ...foldersToExpand]);
      return Array.from(nextExpanded);
    });
  }, []);

  const handleFavoriteClick = useCallback(
    (node: FileTreeNode) => {
      const targetNode = findNodeByPath(tree, node.path) ?? node;
      expandPathToNode(targetNode);
      handleNodeSelect({} as SyntheticEvent, targetNode.id);
    },
    [expandPathToNode, handleNodeSelect, tree],
  );

  return {
    treeContainerRef,
    selectedNode,
    setSelectedNode,
    selectedNodeForActions,
    expanded,
    setExpanded,
    handleNodeSelect,
    handleContainerClick,
    handleCollapseAll,
    handleNodeToggle,
    handleFavoriteClick,
  };
}
