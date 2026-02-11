import React from 'react';
import { Chip } from '@mui/material';
import { STATUS_BAR_UNCOMMITTED_CHIP } from './constants';
import { statusChipSx } from './styles';
import type { StatusBarUncommittedChipProps } from './types';

export function StatusBarUncommittedChip({
  status,
  isLocal,
  isS3,
  unsyncedLabel,
  uncommittedLabel,
  syncStatusLabel,
}: StatusBarUncommittedChipProps) {
  if (!status || isLocal || !status.hasUncommitted) {
    return null;
  }

  const label = isS3 ? unsyncedLabel : uncommittedLabel;
  if (syncStatusLabel === label) {
    return null;
  }

  return (
    <Chip
      label={label}
      size="small"
      color="default"
      variant="outlined"
      sx={statusChipSx}
      data-testid={STATUS_BAR_UNCOMMITTED_CHIP.testId}
    />
  );
}
