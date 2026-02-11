import React from 'react';
import {
  CreateNewFolder as CreateFolderIcon,
  Delete as DeleteIcon,
  FileUpload as ImportIcon,
  DriveFileRenameOutline as RenameIcon,
  DriveFileMove as MoveIcon,
  StarBorder as FavoriteBorderIcon,
  Star as FavoriteIcon,
  NoteAdd as NoteAddIcon,
  ContentCopy as DuplicateIcon,
} from '@mui/icons-material';
import type { FileTreeNode } from '../../../shared/types';
import type { ContextMenuItem } from '../FileTreeContextMenus/types';
import type { TreeContextMenuAction } from './hooks/useTreeContextMenu';

type BuildEmptyContextMenuItemsParams = {
  newFileLabel: string;
  newFolderLabel: string;
  importFileLabel: string;
  onCloseTreeContextMenu: () => void;
  onOpenFileDialog: () => void;
  onOpenFolderDialog: () => void;
  onImportFile: () => void;
};

type BuildNodeContextMenuItemsParams = {
  node: FileTreeNode | null;
  isFavorite: boolean;
  labels: {
    newFile: string;
    newFolder: string;
    rename: string;
    move: string;
    addToFavorites: string;
    removeFromFavorites: string;
    duplicate: string;
    delete: string;
  };
  onCloseTreeContextMenu: () => void;
  onOpenFileDialog: () => void;
  onOpenFolderDialog: () => void;
  onAction: (action: TreeContextMenuAction, node: FileTreeNode | null) => void;
};

export const buildEmptyContextMenuItems = ({
  newFileLabel,
  newFolderLabel,
  importFileLabel,
  onCloseTreeContextMenu,
  onOpenFileDialog,
  onOpenFolderDialog,
  onImportFile,
}: BuildEmptyContextMenuItemsParams): ContextMenuItem[] => [
  {
    label: newFileLabel,
    icon: <NoteAddIcon fontSize="small" />,
    action: () => {
      onCloseTreeContextMenu();
      onOpenFileDialog();
    },
    testId: 'tree-context-new-file',
  },
  {
    label: newFolderLabel,
    icon: <CreateFolderIcon fontSize="small" />,
    action: () => {
      onCloseTreeContextMenu();
      onOpenFolderDialog();
    },
    testId: 'tree-context-new-folder',
  },
  {
    label: importFileLabel,
    icon: <ImportIcon fontSize="small" />,
    action: () => {
      onCloseTreeContextMenu();
      onImportFile();
    },
    testId: 'tree-context-import',
  },
];

export const buildNodeContextMenuItems = ({
  node,
  isFavorite,
  labels,
  onCloseTreeContextMenu,
  onOpenFileDialog,
  onOpenFolderDialog,
  onAction,
}: BuildNodeContextMenuItemsParams): ContextMenuItem[] =>
  [
    node?.type === 'folder'
      ? {
          label: labels.newFile,
          icon: <NoteAddIcon fontSize="small" />,
          action: () => {
            onCloseTreeContextMenu();
            onOpenFileDialog();
          },
          testId: 'tree-context-node-new-file',
        }
      : null,
    node?.type === 'folder'
      ? {
          label: labels.newFolder,
          icon: <CreateFolderIcon fontSize="small" />,
          action: () => {
            onCloseTreeContextMenu();
            onOpenFolderDialog();
          },
          testId: 'tree-context-node-new-folder',
        }
      : null,
    {
      label: labels.rename,
      icon: <RenameIcon fontSize="small" />,
      action: () => onAction('rename', node),
      testId: 'tree-context-rename',
    },
    {
      label: labels.move,
      icon: <MoveIcon fontSize="small" />,
      action: () => onAction('move', node),
      testId: 'tree-context-move',
    },
    {
      label: isFavorite ? labels.removeFromFavorites : labels.addToFavorites,
      icon: isFavorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />,
      action: () => onAction('favorite', node),
      testId: 'tree-context-favorite',
    },
    node?.type === 'file'
      ? {
          label: labels.duplicate,
          icon: <DuplicateIcon fontSize="small" />,
          action: () => onAction('duplicate', node),
          testId: 'tree-context-duplicate',
        }
      : null,
    {
      label: labels.delete,
      icon: <DeleteIcon fontSize="small" />,
      action: () => onAction('delete', node),
      testId: 'tree-context-delete',
    },
  ].filter(Boolean) as ContextMenuItem[];
