import type { SxProps, Theme } from '@mui/material/styles';

export const rootSx: SxProps<Theme> = { height: '100%', display: 'flex', flexDirection: 'column' };

export const treeContainerSx: SxProps<Theme> = {
  flex: 1,
  overflow: 'auto',
  p: 1,
  position: 'relative',
};

export const treeItemLabelSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  pr: 1,
  userSelect: 'none',
};
