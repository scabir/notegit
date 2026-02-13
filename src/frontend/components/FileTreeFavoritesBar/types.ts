import type { FileTreeNode } from "../../../shared/types";
import type { MouseEvent } from "react";

export type FileTreeFavoritesBarProps = {
  favorites: FileTreeNode[];
  onSelect: (node: FileTreeNode) => void;
  onContextMenu: (event: MouseEvent<HTMLElement>, path: string) => void;
};
