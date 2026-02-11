import React from 'react';
import { Tooltip, IconButton } from '@mui/material';
import { SaveAlt as SaveAllIcon } from '@mui/icons-material';
import { STATUS_BAR_SAVE_ALL_ACTION } from './constants';
import { iconButtonSx } from './styles';
import type { StatusBarSaveAllActionProps } from './types';

export function StatusBarSaveAllAction({
  hasUnsavedChanges,
  onSaveAll,
  tooltip,
}: StatusBarSaveAllActionProps) {
  return (
    <Tooltip title={tooltip}>
      <span>
        <IconButton
          size="small"
          onClick={onSaveAll}
          disabled={!hasUnsavedChanges}
          color={hasUnsavedChanges ? 'primary' : 'default'}
          sx={iconButtonSx}
          data-testid={STATUS_BAR_SAVE_ALL_ACTION.testId}
        >
          <SaveAllIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  );
}
