import type { SxProps, Theme } from '@mui/material/styles';

export const emptyStateSx: SxProps<Theme> = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'text.secondary',
};

export const rootSx: SxProps<Theme> = { height: '100%', display: 'flex', flexDirection: 'column' };

export const toolbarSx: SxProps<Theme> = {
  minHeight: '48px',
  borderBottom: 1,
  borderColor: 'divider',
  gap: 1,
};

export const filePathSx: SxProps<Theme> = { flexGrow: 1 };
export const modifiedChipSx: SxProps<Theme> = { height: 24 };

export const editorContainerSx = (isDark: boolean): SxProps<Theme> => ({
  flexGrow: 1,
  overflow: 'auto',
  bgcolor: isDark ? '#0d1117' : '#f1f3f6',
});
