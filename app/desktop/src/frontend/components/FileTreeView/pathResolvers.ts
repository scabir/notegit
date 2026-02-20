import type { FileTreeNode } from "../../../shared/types";
import { findNodeByPath, getParentPath, normalizeName } from "./utils";

export const resolveParentDestination = (
  targetNode: FileTreeNode | null,
  tree: FileTreeNode[],
): { parentPath: string; parentNodeId: string | null } => {
  if (!targetNode) {
    return { parentPath: "", parentNodeId: null };
  }

  if (targetNode.type === "folder") {
    return { parentPath: targetNode.path, parentNodeId: targetNode.id };
  }

  const parentPath = getParentPath(targetNode.path);
  if (!parentPath) {
    return { parentPath: "", parentNodeId: null };
  }

  const parentNode = findNodeByPath(tree, parentPath);
  return { parentPath, parentNodeId: parentNode?.id || null };
};

export const resolveImportTargetPath = (
  sourcePath: string,
  targetNode: FileTreeNode | null,
  isS3Repo: boolean,
  fallbackFileName: string,
) => {
  const rawFileName = sourcePath.split(/[\\/]/).pop() || fallbackFileName;
  const fileName = normalizeName(rawFileName, isS3Repo);

  if (!targetNode) {
    return fileName;
  }

  if (targetNode.type === "folder") {
    return `${targetNode.path}/${fileName}`;
  }

  const parentPath = getParentPath(targetNode.path);
  return parentPath ? `${parentPath}/${fileName}` : fileName;
};

export const resolveCreationLocationText = (
  targetNode: FileTreeNode | null,
  locationRootText: string,
  locationPrefixText: string,
) => {
  if (!targetNode) {
    return locationRootText;
  }

  if (targetNode.type === "folder") {
    return `${locationPrefixText}${targetNode.path || "root"}`;
  }

  const parentPath = getParentPath(targetNode.path);
  return parentPath ? `${locationPrefixText}${parentPath}` : locationRootText;
};
