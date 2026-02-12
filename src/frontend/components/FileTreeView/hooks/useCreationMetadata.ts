import { useMemo } from "react";
import type { FileTreeNode } from "../../../../shared/types";
import { resolveCreationLocationText } from "../pathResolvers";

type UseCreationMetadataParams = {
  treeContextMenuNode: FileTreeNode | null;
  favoriteNodes: FileTreeNode[];
  selectedNodeForActions: FileTreeNode | null;
  selectedFile: string | null;
  newItemName: string;
  createLocationRoot: string;
  createLocationPrefix: string;
  fileExtensionHint: string;
};

export function useCreationMetadata({
  treeContextMenuNode,
  favoriteNodes,
  selectedNodeForActions,
  selectedFile,
  newItemName,
  createLocationRoot,
  createLocationPrefix,
  fileExtensionHint,
}: UseCreationMetadataParams) {
  const contextNodeIsFavorite = useMemo(
    () =>
      Boolean(
        treeContextMenuNode &&
        favoriteNodes.some((node) => node.path === treeContextMenuNode.path),
      ),
    [favoriteNodes, treeContextMenuNode],
  );

  const creationLocationText = useMemo(
    () =>
      resolveCreationLocationText(
        selectedNodeForActions,
        createLocationRoot,
        createLocationPrefix,
      ),
    [createLocationPrefix, createLocationRoot, selectedNodeForActions],
  );

  const fileHelperText = useMemo(
    () => (!newItemName.includes(".") ? fileExtensionHint : " "),
    [fileExtensionHint, newItemName],
  );

  const selectedNodeId = useMemo(
    () => selectedNodeForActions?.id ?? selectedFile ?? undefined,
    [selectedFile, selectedNodeForActions],
  );

  return {
    contextNodeIsFavorite,
    creationLocationText,
    fileHelperText,
    selectedNodeId,
  };
}
