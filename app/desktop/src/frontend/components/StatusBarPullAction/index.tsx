import React from "react";
import { Tooltip, IconButton } from "@mui/material";
import { CloudDownload as CloudDownloadIcon } from "@mui/icons-material";
import { STATUS_BAR_PULL_ACTION } from "./constants";
import { iconButtonSx } from "./styles";
import type { StatusBarPullActionProps } from "./types";

export function StatusBarPullAction({
  onPull,
  tooltip,
  disabled,
}: StatusBarPullActionProps) {
  return (
    <Tooltip title={tooltip}>
      <IconButton
        size="small"
        onClick={onPull}
        disabled={disabled}
        sx={iconButtonSx}
        data-testid={STATUS_BAR_PULL_ACTION.testId}
      >
        <CloudDownloadIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
