import type { SxProps, Theme } from '@mui/material/styles';

export const shortcutMenuSx: SxProps<Theme> = {
  p: 2,
  minWidth: 280,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

export const shortcutSectionSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

export const shortcutRowSx: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 1,
};

export const shortcutKeySx: SxProps<Theme> = {
  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
  fontSize: '0.75rem',
  color: 'text.secondary',
};
