import React from "react";
import { Box, IconButton, Toolbar, Tooltip, Typography } from "@mui/material";
import {
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useI18n } from "../../i18n";
import { buildImageViewerText } from "./constants";
import {
  emptyStateSx,
  filePathSx,
  imageContainerSx,
  imageSx,
  rootSx,
  toolbarSx,
  treeControlsRowSx,
} from "./styles";
import type { ImageViewerProps } from "./types";

const toFileUrl = (
  repoPath: string | null,
  filePath: string | undefined,
): string => {
  if (!repoPath || !filePath) {
    return "";
  }
  const normalizedRepoPath = repoPath.replace(/\\/g, "/").replace(/\/+$/, "");
  const normalizedFilePath = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const hasLeadingSlash = normalizedRepoPath.startsWith("/");
  const rootPath = hasLeadingSlash
    ? normalizedRepoPath
    : `/${normalizedRepoPath}`;
  const rootUrl = new URL(`file://${rootPath}/`);
  return new URL(normalizedFilePath, rootUrl).toString();
};

export function ImageViewer({
  file,
  repoPath,
  treePanelControls,
}: ImageViewerProps) {
  const { t } = useI18n();
  const text = React.useMemo(() => buildImageViewerText(t), [t]);
  if (!file) {
    return <Box sx={emptyStateSx}>{text.emptyState}</Box>;
  }

  const src = toFileUrl(repoPath, file.path);

  return (
    <Box sx={rootSx}>
      <Toolbar variant="dense" disableGutters sx={toolbarSx}>
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

        <Typography variant="subtitle2" sx={filePathSx}>
          {file.path}
        </Typography>
      </Toolbar>

      <Box sx={imageContainerSx}>
        <Box
          component="img"
          src={src}
          alt={file.path || text.imagePreviewAlt}
          sx={imageSx}
        />
      </Box>
    </Box>
  );
}
