import React from "react";
import {
  Box,
  Toolbar,
  IconButton,
  Chip,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Save as SaveIcon,
  FiberManualRecord as UnsavedIcon,
  Visibility as PreviewIcon,
  VisibilityOff as PreviewOffIcon,
  FileDownload as ExportIcon,
} from "@mui/icons-material";
import { useI18n } from "../../i18n";
import { buildMarkdownEditorText } from "../MarkdownEditor/constants";
import type { ViewMode } from "../MarkdownEditor/types";
import {
  headerRowSx,
  headerToolbarSx,
  splitIconRowSx,
  treeControlsRowSx,
} from "./styles";
import type { MarkdownEditorHeaderProps } from "./types";

export function MarkdownEditorHeader({
  filePath,
  hasUnsavedChanges,
  viewMode,
  onViewModeChange,
  onSave,
  onExport,
  treePanelControls,
}: MarkdownEditorHeaderProps) {
  const { t } = useI18n();
  const text = React.useMemo(() => buildMarkdownEditorText(t), [t]);

  return (
    <Toolbar variant="dense" disableGutters sx={headerToolbarSx}>
      <Box sx={headerRowSx}>
        {treePanelControls && (
          <Box sx={treeControlsRowSx}>
            <Tooltip title={text.showTreeTooltip}>
              <IconButton size="small" onClick={treePanelControls.onToggleTree}>
                <MenuIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={text.backTooltip}>
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
            <Tooltip title={text.forwardTooltip}>
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
            label={text.unsaved}
            size="small"
            color="warning"
          />
        )}
      </Box>

      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={(_, newMode: ViewMode | null) =>
          newMode && onViewModeChange(newMode)
        }
        size="small"
      >
        <ToggleButton value="editor" aria-label={text.viewModeAriaEditorOnly}>
          <Tooltip title={text.editorOnlyTooltip}>
            <PreviewOffIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="split" aria-label={text.viewModeAriaSplitView}>
          <Tooltip title={text.splitViewTooltip}>
            <Box sx={splitIconRowSx}>
              <PreviewOffIcon fontSize="small" />
              <PreviewIcon fontSize="small" />
            </Box>
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="preview" aria-label={text.viewModeAriaPreviewOnly}>
          <Tooltip title={text.previewOnlyTooltip}>
            <PreviewIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      <Tooltip title={text.saveTooltip}>
        <IconButton
          size="small"
          onClick={onSave}
          disabled={!hasUnsavedChanges}
          color="primary"
        >
          <SaveIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title={text.exportTooltip}>
        <IconButton size="small" onClick={onExport} color="default">
          <ExportIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Toolbar>
  );
}
