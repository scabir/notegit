import React from "react";
import { Tooltip, IconButton } from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";
import { STATUS_BAR_SETTINGS_ACTION } from "./constants";
import { iconButtonSx } from "./styles";
import type { StatusBarSettingsActionProps } from "./types";

export function StatusBarSettingsAction({
  onOpenSettings,
  tooltip,
}: StatusBarSettingsActionProps) {
  return (
    <Tooltip title={tooltip}>
      <IconButton
        size="small"
        onClick={onOpenSettings}
        sx={iconButtonSx}
        data-testid={STATUS_BAR_SETTINGS_ACTION.testId}
      >
        <SettingsIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
