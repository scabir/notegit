import type { FileTreeNode } from '../../../../shared/types';
import type { MouseEvent } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';

export interface RenderTreeParams {
  expanded: string[];
  treeItemLabelSx: SxProps<Theme>;
  handleTreeContextMenu: (event: MouseEvent<HTMLElement>, node?: FileTreeNode) => void;
  selectedNodeId?: string;
}
