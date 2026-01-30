import React from 'react';
import { Menu, MenuItem, ListItemIcon } from '@mui/material';
import type { ContextMenuItem, FavoriteMenuState, TreeContextMenuState } from '../types';
import { contextMenuSx } from './styles';

type ContextMenusProps = {
  favoriteMenuState: FavoriteMenuState | null;
  onCloseFavoriteMenu: () => void;
  onRemoveFavorite: () => void;
  favoriteMenuLabel: string;
  favoriteMenuIcon: React.ReactElement;
  treeContextMenuState: TreeContextMenuState | null;
  onCloseTreeContextMenu: () => void;
  emptyContextMenuItems: ContextMenuItem[];
  nodeContextMenuItems: ContextMenuItem[];
};

export function ContextMenus({
  favoriteMenuState,
  onCloseFavoriteMenu,
  onRemoveFavorite,
  favoriteMenuLabel,
  favoriteMenuIcon,
  treeContextMenuState,
  onCloseTreeContextMenu,
  emptyContextMenuItems,
  nodeContextMenuItems,
}: ContextMenusProps) {
  const showEmptyMenu = treeContextMenuState?.mode === 'empty';
  const showNodeMenu = treeContextMenuState?.mode === 'node';
  const anchorPosition = treeContextMenuState?.position || undefined;

  return (
    <>
      <Menu
        id="favorite-context-menu"
        anchorEl={favoriteMenuState?.anchorEl || null}
        open={Boolean(favoriteMenuState?.anchorEl)}
        onClose={onCloseFavoriteMenu}
        MenuListProps={{ 'aria-label': 'Favorite actions' }}
        sx={contextMenuSx}
      >
        <MenuItem data-testid="favorite-context-menu-remove" onClick={onRemoveFavorite}>
          <ListItemIcon>{favoriteMenuIcon}</ListItemIcon>
          {favoriteMenuLabel}
        </MenuItem>
      </Menu>

      <Menu
        id="tree-context-menu-empty"
        data-testid="tree-context-menu-empty"
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
        id="tree-context-menu"
        data-testid="tree-context-menu"
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
