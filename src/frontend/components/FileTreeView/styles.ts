import type { SxProps, Theme } from '@mui/material/styles';

export const rootSx: SxProps<Theme> = { height: '100%', display: 'flex', flexDirection: 'column' };

export const toolbarSx: SxProps<Theme> = { minHeight: '48px', borderBottom: '1px solid #e0e0e0' };

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

export const treeItemActionsSx: SxProps<Theme> = {
  display: 'flex',
  gap: 0.5,
  opacity: 0,
  '.MuiTreeItem-content:hover &': {
    opacity: 1,
  },
};

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
