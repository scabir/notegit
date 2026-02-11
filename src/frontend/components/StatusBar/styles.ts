import type { SxProps, Theme } from '@mui/material/styles';

export const appBarSx: SxProps<Theme> = {
  top: 'auto',
  bottom: 0,
  borderTop: 1,
  borderColor: 'divider',
  bgcolor: (theme) => (theme.palette.mode === 'light' ? '#e6e9ee' : 'background.paper'),
};

export const toolbarSx: SxProps<Theme> = {
  minHeight: '40px !important',
  maxHeight: '40px !important',
  height: '40px',
  px: 1,
  gap: 1,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
};

export const sectionSx: SxProps<Theme> = {
  flex: '1 1 0',
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
  maxWidth: '33.3333%',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
};

export const leftSectionSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
};

export const middleSectionSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 0,
  overflow: 'hidden',
};

export const rightSectionSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  minWidth: 0,
  width: '100%',
  overflow: 'hidden',
};

export const statusRowSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
};

export const branchLabelSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.25,
  flexShrink: 0,
};

export const headerTitleSx: SxProps<Theme> = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const saveStatusRowSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
};

export const statusChipSx: SxProps<Theme> = {
  height: 24,
  flexShrink: 0,
};

export const saveMessageSx: SxProps<Theme> = {
  minWidth: 0,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const actionsRowSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
};

export const actionSeparatorSx: SxProps<Theme> = {
  width: '1px',
  height: 20,
  bgcolor: 'divider',
  mx: 0.5,
  flexShrink: 0,
};
