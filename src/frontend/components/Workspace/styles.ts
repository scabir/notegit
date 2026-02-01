import type { SxProps, Theme } from '@mui/material/styles';

export const rootSx: SxProps<Theme> = { height: '100vh', display: 'flex', flexDirection: 'column' };

export const topAppBarSx: SxProps<Theme> = {
  bgcolor: (theme) => (theme.palette.mode === 'light' ? '#e6e9ee' : 'background.paper'),
  borderBottom: 1,
  borderColor: 'divider',
};

export const saveStatusRowSx: SxProps<Theme> = {
  ml: 2,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

export const statusChipSx: SxProps<Theme> = { height: 24 };
export const saveMessageSx: SxProps<Theme> = { maxWidth: 300 };
export const spacerSx: SxProps<Theme> = { flexGrow: 1 };

export const mainContentSx: SxProps<Theme> = {
  display: 'flex',
  flexGrow: 1,
  overflow: 'hidden',
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
