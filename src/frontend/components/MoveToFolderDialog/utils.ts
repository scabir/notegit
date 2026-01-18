import type { FileTreeNode } from '../../../shared/types';
import { MOVE_DIALOG_TEXT } from './constants';

export const isDescendant = (ancestorPath: string, descendantPath: string): boolean => {
  if (!descendantPath) return false;
  if (!ancestorPath) return false;
  return descendantPath === ancestorPath || descendantPath.startsWith(ancestorPath + '/');
};

export const collectFolders = (nodes: FileTreeNode[]): FileTreeNode[] => {
  const folders: FileTreeNode[] = [];

  for (const node of nodes) {
    if (node.type === 'folder') {
      folders.push(node);
      if (node.children) {
        folders.push(...collectFolders(node.children));
      }
    }
  }

  return folders;
};

export const getParentPath = (path: string): string => {
  const lastSlash = path.lastIndexOf('/');
  return lastSlash > 0 ? path.substring(0, lastSlash) : '';
};

export const getCurrentLocationLabel = (path: string): string => {
  const parentPath = getParentPath(path);
  return parentPath || MOVE_DIALOG_TEXT.rootFallback;
};
