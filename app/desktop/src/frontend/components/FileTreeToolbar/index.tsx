import React from "react";
import {
  Toolbar as MuiToolbar,
  Tooltip,
  IconButton,
  Box,
  Divider,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  NoteAdd as NoteAddIcon,
  CreateNewFolder as CreateFolderIcon,
  FileUpload as ImportIcon,
  UnfoldLess as CollapseAllIcon,
} from "@mui/icons-material";
import { TOOLBAR_TEXT } from "./constants";
import { toolbarSx } from "./styles";
import type { ToolbarAction, FileTreeToolbarProps } from "./types";

const ToolbarButton = ({
  tooltip,
  icon,
  onClick,
  disabled = false,
}: ToolbarAction) => (
  <Tooltip title={tooltip}>
    <span>
      <IconButton size="small" onClick={onClick} disabled={disabled}>
        {icon}
      </IconButton>
    </span>
  </Tooltip>
);

export function FileTreeToolbar({
  isCollapsed,
  canToggleCollapse,
  onToggleCollapse,
  onBack,
  onForward,
  canGoBack,
  canGoForward,
  onNewFile,
  onNewFolder,
  onImport,
  onCollapseAll,
  text = TOOLBAR_TEXT,
}: FileTreeToolbarProps) {
  const collapseAction: ToolbarAction = {
    tooltip: isCollapsed ? text.expandTree : text.collapseTree,
    icon: <MenuIcon fontSize="small" />,
    onClick: onToggleCollapse,
    disabled: !canToggleCollapse,
  };

  const actions: ToolbarAction[] = isCollapsed
    ? [collapseAction]
    : [
        collapseAction,
        {
          tooltip: text.newFile,
          icon: <NoteAddIcon fontSize="small" />,
          onClick: onNewFile,
        },
        {
          tooltip: text.newFolder,
          icon: <CreateFolderIcon fontSize="small" />,
          onClick: onNewFolder,
        },
        {
          tooltip: text.importFile,
          icon: <ImportIcon fontSize="small" />,
          onClick: onImport,
        },
        {
          tooltip: text.collapseAll,
          icon: <CollapseAllIcon fontSize="small" />,
          onClick: onCollapseAll,
        },
      ];

  const navigationActions: ToolbarAction[] = [
    {
      tooltip: text.back,
      icon: <BackIcon fontSize="small" />,
      onClick: onBack,
      disabled: !canGoBack,
    },
    {
      tooltip: text.forward,
      icon: <ForwardIcon fontSize="small" />,
      onClick: onForward,
      disabled: !canGoForward,
    },
  ];

  return (
    <MuiToolbar variant="dense" disableGutters sx={toolbarSx}>
      {actions.map((action) => (
        <ToolbarButton
          key={action.tooltip}
          tooltip={action.tooltip}
          icon={action.icon}
          onClick={action.onClick}
          disabled={action.disabled}
        />
      ))}
      {!isCollapsed && (
        <>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
        </>
      )}
    </MuiToolbar>
  );
}
