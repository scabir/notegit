import React from 'react';
import { Menu, MenuItem, ListItemIcon } from '@mui/material';
import { contextMenuSx } from './styles';
import { FILE_TREE_CONTEXT_MENUS_IDS } from './constants';
import type { FileTreeContextMenusProps } from './types';

export function FileTreeContextMenus({
  favoriteMenuState,
  onCloseFavoriteMenu,
  onRemoveFavorite,
  favoriteMenuLabel,
  favoriteMenuIcon,
  treeContextMenuState,
  onCloseTreeContextMenu,
  emptyContextMenuItems,
  nodeContextMenuItems,
}: FileTreeContextMenusProps) {
  const showEmptyMenu = treeContextMenuState?.mode === 'empty';
  const showNodeMenu = treeContextMenuState?.mode === 'node';
  const anchorPosition = treeContextMenuState?.position || undefined;

  return (
    <>
      <Menu
        id={FILE_TREE_CONTEXT_MENUS_IDS.favoriteMenu}
        anchorEl={favoriteMenuState?.anchorEl || null}
        open={Boolean(favoriteMenuState?.anchorEl)}
        onClose={onCloseFavoriteMenu}
        MenuListProps={{ 'aria-label': 'Favorite actions' }}
        sx={contextMenuSx}
      >
        <MenuItem
          data-testid={FILE_TREE_CONTEXT_MENUS_IDS.favoriteRemove}
          onClick={onRemoveFavorite}
        >
          <ListItemIcon>{favoriteMenuIcon}</ListItemIcon>
          {favoriteMenuLabel}
        </MenuItem>
      </Menu>

      <Menu
        id={FILE_TREE_CONTEXT_MENUS_IDS.treeEmptyMenu}
        data-testid={FILE_TREE_CONTEXT_MENUS_IDS.treeEmptyMenu}
        anchorReference="anchorPosition"
        anchorPosition={anchorPosition}
        open={showEmptyMenu}
        onClose={onCloseTreeContextMenu}
        MenuListProps={{ 'aria-label': 'Tree background actions' }}
        sx={contextMenuSx}
      >
        {emptyContextMenuItems.map((item) => (
          <MenuItem key={item.testId} data-testid={item.testId} onClick={item.action}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            {item.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        id={FILE_TREE_CONTEXT_MENUS_IDS.treeNodeMenu}
        data-testid={FILE_TREE_CONTEXT_MENUS_IDS.treeNodeMenu}
        anchorReference="anchorPosition"
        anchorPosition={anchorPosition}
        open={showNodeMenu}
        onClose={onCloseTreeContextMenu}
        MenuListProps={{ 'aria-label': 'Tree item actions' }}
        sx={contextMenuSx}
      >
        {nodeContextMenuItems.map((item) => (
          <MenuItem key={item.testId} data-testid={item.testId} onClick={item.action}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
