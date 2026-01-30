import React, { type ReactElement } from 'react';
import { Toolbar as MuiToolbar, Tooltip, IconButton, Box } from '@mui/material';
import {
  NoteAdd as NoteAddIcon,
  CreateNewFolder as CreateFolderIcon,
  FileUpload as ImportIcon,
  DriveFileRenameOutline as RenameIcon,
  Star as FavoriteIcon,
  StarBorder as FavoriteBorderIcon,
  DriveFileMove as MoveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { TOOLBAR_TEXT } from './constants';
import { toolbarSx } from './styles';

type ToolbarAction = {
  tooltip: string;
  icon: ReactElement;
  onClick: () => void;
  disabled?: boolean;
};

type FileTreeToolbarProps = {
  onNewFile: () => void;
  onNewFolder: () => void;
  onImport: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  favoriteSelected: boolean;
  actionEnabled: boolean;
};

const ToolbarButton = ({ tooltip, icon, onClick, disabled = false }: ToolbarAction) => (
  <Tooltip title={tooltip}>
    <span>
      <IconButton size="small" onClick={onClick} disabled={disabled}>
        {icon}
      </IconButton>
    </span>
  </Tooltip>
);

export function FileTreeToolbar({
  onNewFile,
  onNewFolder,
  onImport,
  onRename,
  onMove,
  onDelete,
  onToggleFavorite,
  favoriteSelected,
  actionEnabled,
}: FileTreeToolbarProps) {
  const actions: ToolbarAction[] = [
    {
      tooltip: TOOLBAR_TEXT.newFile,
      icon: <NoteAddIcon fontSize="small" />,
      onClick: onNewFile,
    },
    {
      tooltip: TOOLBAR_TEXT.newFolder,
      icon: <CreateFolderIcon fontSize="small" />,
      onClick: onNewFolder,
    },
    {
      tooltip: TOOLBAR_TEXT.importFile,
      icon: <ImportIcon fontSize="small" />,
      onClick: onImport,
    },
    {
      tooltip: TOOLBAR_TEXT.rename,
      icon: <RenameIcon fontSize="small" />,
      onClick: onRename,
      disabled: !actionEnabled,
    },
    {
      tooltip: TOOLBAR_TEXT.move,
      icon: <MoveIcon fontSize="small" />,
      onClick: onMove,
      disabled: !actionEnabled,
    },
    {
      tooltip: TOOLBAR_TEXT.delete,
      icon: <DeleteIcon fontSize="small" />,
      onClick: onDelete,
      disabled: !actionEnabled,
    },
  ];

  return (
    <MuiToolbar variant="dense" sx={toolbarSx}>
      {actions.map((action) => (
        <ToolbarButton
          key={action.tooltip}
          tooltip={action.tooltip}
          icon={action.icon}
          onClick={action.onClick}
          disabled={action.disabled}
        />
      ))}
    <Tooltip title={favoriteSelected ? TOOLBAR_TEXT.favorites.remove : TOOLBAR_TEXT.favorites.add}>
        <span>
          <IconButton
            size="small"
            onClick={onToggleFavorite}
            disabled={!actionEnabled}
            color={favoriteSelected ? 'primary' : 'default'}
          >
            {favoriteSelected ? (
              <FavoriteIcon fontSize="small" />
            ) : (
              <FavoriteBorderIcon fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>
      <Box sx={{ flexGrow: 1 }} />
    </MuiToolbar>
  );
}
