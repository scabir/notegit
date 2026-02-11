import React from 'react';
import { Box } from '@mui/material';
import { TreeView } from '@mui/x-tree-view';
import { renderTreeItems } from '../FileTreeRenderer';
import { FILE_TREE_MAIN } from './constants';
import { treeContainerSx, treeItemLabelSx } from './styles';
import type { FileTreeMainProps } from './types';

export function FileTreeMain({
  tree,
  expanded,
  selectedNodeId,
  treeContainerRef,
  onContainerClick,
  onTreeContextMenu,
  onNodeSelect,
  onNodeToggle,
}: FileTreeMainProps) {
  return (
    <Box
      className={FILE_TREE_MAIN.containerClassName}
      sx={treeContainerSx}
      onClick={onContainerClick}
      onContextMenu={onTreeContextMenu}
      ref={treeContainerRef}
      tabIndex={0}
    >
      <TreeView
        defaultCollapseIcon={<span />}
        defaultExpandIcon={<span />}
        expanded={expanded}
        onNodeToggle={onNodeToggle}
        selected={selectedNodeId}
        onNodeSelect={onNodeSelect}
      >
        {renderTreeItems(tree, {
          expanded,
          treeItemLabelSx,
          handleTreeContextMenu: onTreeContextMenu,
          selectedNodeId,
        })}
      </TreeView>
    </Box>
  );
}
