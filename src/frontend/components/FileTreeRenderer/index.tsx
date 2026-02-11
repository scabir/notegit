import { TreeItem } from '@mui/x-tree-view';
import { Box } from '@mui/material';
import {
  Folder as FolderIcon,
  Add as PlusIcon,
  Remove as MinusIcon,
} from '@mui/icons-material';
import type { MouseEvent } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import type { FileTreeNode } from '../../../shared/types';
import { getFileIcon } from './utils';
import type { RenderTreeParams } from './types';

const getFolderIcon = (isExpanded: boolean) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
    {isExpanded ? (
      <MinusIcon fontSize="small" sx={{ color: 'primary.main' }} />
    ) : (
      <PlusIcon fontSize="small" sx={{ color: 'primary.main' }} />
    )}
    <FolderIcon fontSize="small" />
  </Box>
);

const getNodeIcon = (node: FileTreeNode, isExpanded: boolean) => {
  if (node.type === 'folder') {
    return getFolderIcon(isExpanded);
  }
  return getFileIcon(node.fileType);
};

export const renderTreeItems = (nodes: FileTreeNode[], params: RenderTreeParams) =>
  nodes.map((node) => {
    const isExpanded = params.expanded.includes(node.id);
    const isSelected = params.selectedNodeId === node.id;
    const selectedLabelSx: SxProps<Theme> = { bgcolor: 'action.selected', borderRadius: 1 };
    const labelSx: SxProps<Theme> = isSelected
      ? (Array.isArray(params.treeItemLabelSx)
        ? [...params.treeItemLabelSx, selectedLabelSx]
        : [params.treeItemLabelSx, selectedLabelSx])
      : params.treeItemLabelSx;

    return (
      <TreeItem
        key={node.id}
        nodeId={node.id}
        label={
          <Box
            sx={labelSx}
            onContextMenu={(event: MouseEvent<HTMLElement>) =>
              params.handleTreeContextMenu(event, node)
            }
            data-node-id={node.id}
            data-node-path={node.path}
          >
            <span style={{ flex: 1 }}>{node.name}</span>
          </Box>
        }
        icon={getNodeIcon(node, isExpanded)}
      >
        {node.children ? renderTreeItems(node.children, params) : null}
      </TreeItem>
    );
  });
