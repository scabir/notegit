import React from 'react';
import { Tooltip, IconButton } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { STATUS_BAR_SEARCH_ACTION } from './constants';
import { iconButtonSx } from './styles';
import type { StatusBarSearchActionProps } from './types';

export function StatusBarSearchAction({ onOpenSearch, tooltip }: StatusBarSearchActionProps) {
  return (
    <Tooltip title={tooltip}>
      <IconButton
        size="small"
        onClick={onOpenSearch}
        color="default"
        sx={iconButtonSx}
        data-testid={STATUS_BAR_SEARCH_ACTION.testId}
      >
        <SearchIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
