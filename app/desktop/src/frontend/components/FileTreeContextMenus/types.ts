import type { ReactElement } from "react";
import type { FileTreeNode } from "../../../shared/types";

export interface FavoriteMenuState {
  anchorEl: HTMLElement | null;
  path: string | null;
}

export interface TreeContextMenuState {
  node: FileTreeNode | null;
  mode: "node" | "empty";
  position: { top: number; left: number } | null;
}

export type ContextMenuItem = {
  label: string;
  icon: ReactElement;
  action: () => void;
  testId: string;
};

export type FileTreeContextMenusProps = {
  favoriteMenuState: FavoriteMenuState | null;
  onCloseFavoriteMenu: () => void;
  onRemoveFavorite: () => void;
  favoriteMenuLabel: string;
  favoriteMenuIcon: ReactElement;
  treeContextMenuState: TreeContextMenuState | null;
  onCloseTreeContextMenu: () => void;
  emptyContextMenuItems: ContextMenuItem[];
  nodeContextMenuItems: ContextMenuItem[];
};
