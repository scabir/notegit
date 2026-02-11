import React from 'react';
import { Typography } from '@mui/material';
import { STATUS_BAR_HEADER_TITLE } from './constants';
import { headerTitleSx } from './styles';
import type { StatusBarHeaderTitleProps } from './types';

export function StatusBarHeaderTitle({ headerTitle = '' }: StatusBarHeaderTitleProps) {
  if (!headerTitle) {
    return null;
  }

  return (
    <Typography
      variant="body2"
      color="text.secondary"
      sx={headerTitleSx}
      data-testid={STATUS_BAR_HEADER_TITLE.testId}
    >
      {headerTitle}
    </Typography>
  );
}
