import type { FileTreeNode } from "../../../shared/types";
import { getParentPath } from "../../utils/pathUtils";

export const isDescendant = (
  ancestorPath: string,
  descendantPath: string,
): boolean => {
  if (!descendantPath) return false;
  if (!ancestorPath) return false;
  return (
    descendantPath === ancestorPath ||
    descendantPath.startsWith(ancestorPath + "/")
  );
};

export const collectFolders = (nodes: FileTreeNode[]): FileTreeNode[] => {
  const folders: FileTreeNode[] = [];

  for (const node of nodes) {
    if (node.type === "folder") {
      folders.push(node);
      if (node.children) {
        folders.push(...collectFolders(node.children));
      }
    }
  }

  return folders;
};

export { getParentPath };

export const getCurrentLocationLabel = (
  path: string,
  rootFallback: string,
): string => {
  const parentPath = getParentPath(path);
  return parentPath || rootFallback;
};
