import React, { type ReactElement } from 'react';
import { Toolbar as MuiToolbar, Tooltip, IconButton, Box, Divider } from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  NoteAdd as NoteAddIcon,
  CreateNewFolder as CreateFolderIcon,
  FileUpload as ImportIcon,
  UnfoldLess as CollapseAllIcon,
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
  onBack: () => void;
  onForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onNewFile: () => void;
  onNewFolder: () => void;
  onImport: () => void;
  onCollapseAll: () => void;
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
  onBack,
  onForward,
  canGoBack,
  canGoForward,
  onNewFile,
  onNewFolder,
  onImport,
  onCollapseAll,
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
      tooltip: TOOLBAR_TEXT.collapseAll,
      icon: <CollapseAllIcon fontSize="small" />,
      onClick: onCollapseAll,
    },
  ];

  const navigationActions: ToolbarAction[] = [
    {
      tooltip: TOOLBAR_TEXT.back,
      icon: <BackIcon fontSize="small" />,
      onClick: onBack,
      disabled: !canGoBack,
    },
    {
      tooltip: TOOLBAR_TEXT.forward,
      icon: <ForwardIcon fontSize="small" />,
      onClick: onForward,
      disabled: !canGoForward,
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
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        {navigationActions.map((action) => (
          <ToolbarButton
            key={action.tooltip}
            tooltip={action.tooltip}
            icon={action.icon}
            onClick={action.onClick}
            disabled={action.disabled}
          />
        ))}
      </Box>
    </MuiToolbar>
  );
}
