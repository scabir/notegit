import type { SxProps, Theme } from '@mui/material/styles';

export const dialogInfoSx: SxProps<Theme> = {
  mb: 2,
  p: 1,
  bgcolor: 'action.hover',
  borderRadius: 1,
};

export const dialogErrorSx: SxProps<Theme> = {
  mt: 1,
  color: 'error.main',
  fontSize: '0.875rem',
};
