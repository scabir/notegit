import React from "react";
import { Chip } from "@mui/material";
import { STATUS_BAR_SYNC_CHIP } from "./constants";
import { statusChipSx } from "./styles";
import type { StatusBarSyncChipProps } from "./types";

export function StatusBarSyncChip({ syncStatus }: StatusBarSyncChipProps) {
  if (!syncStatus) {
    return null;
  }

  return (
    <Chip
      icon={syncStatus.icon}
      label={syncStatus.label}
      size="small"
      color={syncStatus.color}
      sx={statusChipSx}
      data-testid={STATUS_BAR_SYNC_CHIP.testId}
    />
  );
}
