import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { STATUS_BAR_SAVE_STATUS } from './constants';
import {
  saveStatusRowSx,
  statusChipSx,
  saveMessageSx,
  hiddenStatusTextSx,
} from './styles';
import type { StatusBarSaveStatusProps } from './types';

export function StatusBarSaveStatus({
  saveStatus,
  saveMessage = '',
  savingLabel,
  savedLabel,
  errorLabel,
}: StatusBarSaveStatusProps) {
  if (saveStatus === 'idle') {
    return null;
  }

  const currentStatusLabel =
    saveStatus === 'error' ? errorLabel : saveStatus === 'saved' ? savedLabel : savingLabel;

  return (
    <Box sx={saveStatusRowSx} data-testid={STATUS_BAR_SAVE_STATUS.testId}>
      {saveStatus === 'saving' && (
        <Chip
          label={savingLabel}
          size="small"
          color="info"
          sx={statusChipSx}
          data-testid={STATUS_BAR_SAVE_STATUS.savingTestId}
        />
      )}
      {saveStatus === 'saved' && (
        <Chip
          label={savedLabel}
          size="small"
          color="success"
          sx={statusChipSx}
          data-testid={STATUS_BAR_SAVE_STATUS.savedTestId}
        />
      )}
      {saveStatus === 'error' && (
        <Chip
          label={errorLabel}
          size="small"
          color="error"
          sx={statusChipSx}
          data-testid={STATUS_BAR_SAVE_STATUS.errorTestId}
        />
      )}
      {saveMessage && (
        <Typography variant="caption" color="text.secondary" sx={saveMessageSx}>
          {saveMessage}
        </Typography>
      )}
      <Typography variant="caption" sx={hiddenStatusTextSx}>
        {`${currentStatusLabel} ${saveMessage || ''}`}
      </Typography>
    </Box>
  );
}
