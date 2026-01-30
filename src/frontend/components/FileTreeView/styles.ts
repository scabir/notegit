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

export const favoritesSectionSx: SxProps<Theme> = {
  px: 1,
  py: 0.75,
  borderBottom: '1px solid #e0e0e0',
};

export const favoriteListSx: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 0.5,
  mt: 0.5,
};

export const favoriteItemSx: SxProps<Theme> = {
  textTransform: 'none',
  minWidth: 0,
  px: 1.5,
  py: 0.4,
  fontSize: '0.90rem',
  justifyContent: 'flex-start',
  borderRadius: 1,
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
