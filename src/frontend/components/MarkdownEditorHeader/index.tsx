import React from 'react';
import {
  Box,
  Toolbar,
  IconButton,
  Chip,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Save as SaveIcon,
  FiberManualRecord as UnsavedIcon,
  Visibility as PreviewIcon,
  VisibilityOff as PreviewOffIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { MARKDOWN_EDITOR_TEXT } from '../MarkdownEditor/constants';
import type { ViewMode } from '../MarkdownEditor/types';
import { headerRowSx, headerToolbarSx, splitIconRowSx, treeControlsRowSx } from './styles';
import type { MarkdownEditorHeaderProps } from './types';

export function MarkdownEditorHeader({
  filePath,
  hasUnsavedChanges,
  viewMode,
  onViewModeChange,
  onSave,
  onExport,
  treePanelControls,
}: MarkdownEditorHeaderProps) {
  return (
    <Toolbar variant="dense" disableGutters sx={headerToolbarSx}>
      <Box sx={headerRowSx}>
        {treePanelControls && (
          <Box sx={treeControlsRowSx}>
            <Tooltip title={MARKDOWN_EDITOR_TEXT.showTreeTooltip}>
              <IconButton size="small" onClick={treePanelControls.onToggleTree}>
                <MenuIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={MARKDOWN_EDITOR_TEXT.backTooltip}>
              <span>
                <IconButton
                  size="small"
                  onClick={treePanelControls.onNavigateBack}
                  disabled={!treePanelControls.canNavigateBack}
                >
                  <BackIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={MARKDOWN_EDITOR_TEXT.forwardTooltip}>
              <span>
                <IconButton
                  size="small"
                  onClick={treePanelControls.onNavigateForward}
                  disabled={!treePanelControls.canNavigateForward}
                >
                  <ForwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}
        <span>{filePath}</span>
        {hasUnsavedChanges && (
          <Chip
            icon={<UnsavedIcon fontSize="small" />}
            label={MARKDOWN_EDITOR_TEXT.unsaved}
            size="small"
            color="warning"
          />
        )}
      </Box>

      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={(_, newMode: ViewMode | null) => newMode && onViewModeChange(newMode)}
        size="small"
      >
        <ToggleButton value="editor" aria-label="editor only">
          <Tooltip title={MARKDOWN_EDITOR_TEXT.editorOnlyTooltip}>
            <PreviewOffIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="split" aria-label="split view">
          <Tooltip title={MARKDOWN_EDITOR_TEXT.splitViewTooltip}>
            <Box sx={splitIconRowSx}>
              <PreviewOffIcon fontSize="small" />
              <PreviewIcon fontSize="small" />
            </Box>
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="preview" aria-label="preview only">
          <Tooltip title={MARKDOWN_EDITOR_TEXT.previewOnlyTooltip}>
            <PreviewIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      <Tooltip title={MARKDOWN_EDITOR_TEXT.saveTooltip}>
        <IconButton size="small" onClick={onSave} disabled={!hasUnsavedChanges} color="primary">
          <SaveIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title={MARKDOWN_EDITOR_TEXT.exportTooltip}>
        <IconButton size="small" onClick={onExport} color="default">
          <ExportIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Toolbar>
  );
}
