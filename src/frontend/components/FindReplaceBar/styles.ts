import type { SxProps, Theme } from '@mui/material/styles';

export const containerSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  p: 1,
  borderBottom: 1,
  borderColor: 'divider',
  bgcolor: 'background.paper',
};

export const findInputSx: SxProps<Theme> = { width: 200 };
export const replaceInputSx: SxProps<Theme> = { width: 200 };

export const matchCountSx: SxProps<Theme> = { mr: 1 };
export const noMatchesSx: SxProps<Theme> = { ml: 1 };

export const buttonRowSx: SxProps<Theme> = { display: 'flex', gap: 0.5 };
export const dividerSx: SxProps<Theme> = { mx: 1 };
export const flexSpacerSx: SxProps<Theme> = { flexGrow: 1 };
