import type { SxProps, Theme } from '@mui/material/styles';

export const headerToolbarSx: SxProps<Theme> = {
  borderBottom: 1,
  borderColor: 'divider',
  gap: 1,
  minHeight: '48px',
  px: 0.5,
};

export const headerRowSx: SxProps<Theme> = {
  flexGrow: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

export const treeControlsRowSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.25,
};

export const splitIconRowSx: SxProps<Theme> = { display: 'flex', gap: 0.5 };
