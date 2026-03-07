import React from "react";
import { Tooltip, IconButton } from "@mui/material";
import { CloudSync as CloudSyncIcon } from "@mui/icons-material";
import { STATUS_BAR_FETCH_ACTION } from "./constants";
import { iconButtonSx } from "./styles";
import type { StatusBarFetchActionProps } from "./types";

export function StatusBarFetchAction({
  onFetch,
  tooltip,
}: StatusBarFetchActionProps) {
  return (
    <Tooltip title={tooltip}>
      <IconButton
        size="small"
        onClick={onFetch}
        sx={iconButtonSx}
        data-testid={STATUS_BAR_FETCH_ACTION.testId}
      >
        <CloudSyncIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
