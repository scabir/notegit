import type { SxProps, Theme } from '@mui/material/styles';

export const rootSx: SxProps<Theme> = {
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

export const topAppBarSx: SxProps<Theme> = {
  bgcolor: (theme) => (theme.palette.mode === 'light' ? '#e6e9ee' : 'background.paper'),
  borderBottom: 1,
  borderColor: 'divider',
  overflow: 'hidden',
};

export const toolbarSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 1,
  minWidth: 0,
};

export const titleSx: SxProps<Theme> = {
  minWidth: 0,
  flexShrink: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const saveStatusRowSx: SxProps<Theme> = {
  ml: 2,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  flexShrink: 1,
  minWidth: 0,
};

export const statusChipSx: SxProps<Theme> = { height: 24 };
export const saveMessageSx: SxProps<Theme> = {
  maxWidth: 300,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flexShrink: 1,
  minWidth: 0,
};
export const spacerSx: SxProps<Theme> = { flexGrow: 1, minWidth: 0 };

export const mainContentSx: SxProps<Theme> = {
  display: 'flex',
  flexGrow: 1,
  overflow: 'hidden',
  minWidth: 0,
  pb: '40px',
};

export const sidebarSx = (width: number): SxProps<Theme> => ({
  width,
  minWidth: width,
  maxWidth: width,
  flexShrink: 0,
  borderRight: 1,
  borderColor: 'divider',
  overflow: 'auto',
});

export const resizeHandleSx = (isResizing: boolean): SxProps<Theme> => ({
  width: '4px',
  cursor: 'col-resize',
  bgcolor: isResizing ? 'primary.main' : 'transparent',
  '&:hover': {
    bgcolor: 'primary.light',
  },
  transition: 'background-color 0.2s',
  flexShrink: 0,
});

export const editorPaneSx: SxProps<Theme> = { flexGrow: 1, overflow: 'hidden', minWidth: 0 };
