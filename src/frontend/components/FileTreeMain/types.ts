import type { RefObject, MouseEvent, SyntheticEvent } from 'react';
import type { FileTreeNode } from '../../../shared/types';

export interface FileTreeMainProps {
  tree: FileTreeNode[];
  expanded: string[];
  selectedNodeId?: string;
  treeContainerRef: RefObject<HTMLDivElement>;
  onContainerClick: (event: MouseEvent<HTMLElement>) => void;
  onTreeContextMenu: (event: MouseEvent<HTMLElement>, node?: FileTreeNode) => void;
  onNodeSelect: (event: SyntheticEvent, nodeId: string) => void;
  onNodeToggle: (event: SyntheticEvent, nodeIds: string[]) => void;
}
