import React from "react";
import { Tooltip, IconButton } from "@mui/material";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import { STATUS_BAR_PUSH_ACTION } from "./constants";
import { iconButtonSx } from "./styles";
import type { StatusBarPushActionProps } from "./types";

export function StatusBarPushAction({
  onPush,
  tooltip,
  disabled,
}: StatusBarPushActionProps) {
  return (
    <Tooltip title={tooltip}>
      <IconButton
        size="small"
        onClick={onPush}
        disabled={disabled}
        sx={iconButtonSx}
        data-testid={STATUS_BAR_PUSH_ACTION.testId}
      >
        <CloudUploadIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
