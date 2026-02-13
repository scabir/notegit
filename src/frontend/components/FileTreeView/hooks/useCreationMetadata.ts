import { useMemo } from "react";
import type { FileTreeNode } from "../../../../shared/types";
import { resolveCreationLocationText } from "../pathResolvers";

type UseCreationMetadataParams = {
  treeContextMenuNode: FileTreeNode | null;
  favoriteNodes: FileTreeNode[];
  selectedNode: FileTreeNode | null;
  selectedFile: string | null;
  newItemName: string;
  createLocationRoot: string;
  createLocationPrefix: string;
  fileExtensionHint: string;
};

export function useCreationMetadata({
  treeContextMenuNode,
  favoriteNodes,
  selectedNode,
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
        selectedNode,
        createLocationRoot,
        createLocationPrefix,
      ),
    [createLocationPrefix, createLocationRoot, selectedNode],
  );

  const fileHelperText = useMemo(
    () => (!newItemName.includes(".") ? fileExtensionHint : " "),
    [fileExtensionHint, newItemName],
  );

  const selectedNodeId = useMemo(
    () => selectedNode?.id ?? selectedFile ?? undefined,
    [selectedFile, selectedNode],
  );

  return {
    contextNodeIsFavorite,
    creationLocationText,
    fileHelperText,
    selectedNodeId,
  };
}
