import type { SxProps, Theme } from '@mui/material/styles';

export const appBarSx: SxProps<Theme> = {
  top: 'auto',
  bottom: 0,
  borderTop: 1,
  borderColor: 'divider',
};

export const toolbarSx: SxProps<Theme> = { minHeight: 40 };

export const statusRowSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  flexGrow: 1,
};

export const branchLabelSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
};

export const actionsRowSx: SxProps<Theme> = { display: 'flex', gap: 1 };
