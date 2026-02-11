import React from 'react';
import { Tooltip, IconButton } from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import { STATUS_BAR_HISTORY_ACTION } from './constants';
import { iconButtonSx } from './styles';
import type { StatusBarHistoryActionProps } from './types';

export function StatusBarHistoryAction({
  show,
  historyPanelOpen,
  onToggleHistory,
  tooltip,
}: StatusBarHistoryActionProps) {
  if (!show) {
    return null;
  }

  return (
    <Tooltip title={tooltip}>
      <IconButton
        size="small"
        onClick={onToggleHistory}
        color={historyPanelOpen ? 'primary' : 'default'}
        sx={iconButtonSx}
        data-testid={STATUS_BAR_HISTORY_ACTION.testId}
      >
        <HistoryIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
