import type { SxProps, Theme } from '@mui/material/styles';

export const dialogPaperSx: SxProps<Theme> = {
  height: '80vh',
  maxHeight: '800px',
};

export const dialogTitleSx: SxProps<Theme> = { pb: 1 };
export const titleRowSx: SxProps<Theme> = { display: 'flex', alignItems: 'center', gap: 1 };
export const titleInfoSx: SxProps<Theme> = { flexGrow: 1 };
export const titleTextSx: SxProps<Theme> = { mb: 0.5 };
export const readOnlyChipSx: SxProps<Theme> = { fontWeight: 600 };

export const contentRootSx: SxProps<Theme> = { p: 0, display: 'flex', flexDirection: 'column' };

export const viewToggleBarSx: SxProps<Theme> = {
  px: 2,
  py: 1,
  borderBottom: 1,
  borderColor: 'divider',
  display: 'flex',
  gap: 1,
};

export const contentScrollSx: SxProps<Theme> = { flexGrow: 1, overflow: 'auto' };
export const loadingStateSx: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
};
export const errorStateSx: SxProps<Theme> = { p: 3, textAlign: 'center' };

export const previewContainerSx = (isDark: boolean): SxProps<Theme> => ({
  p: 3,
  bgcolor: isDark ? '#0d1117' : 'background.paper',
  color: isDark ? '#c9d1d9' : 'text.primary',
  height: '100%',
  overflow: 'auto',
});

export const previewPaperSx = (isDark: boolean): SxProps<Theme> => ({
  p: 3,
  bgcolor: 'transparent',
  color: 'inherit',
  '& code': {
    bgcolor: isDark ? 'rgba(110, 118, 129, 0.4)' : 'rgba(175, 184, 193, 0.2)',
    padding: '0.2em 0.4em',
    borderRadius: '6px',
    fontSize: '85%',
  },
  '& pre': {
    bgcolor: isDark ? 'rgba(110, 118, 129, 0.2)' : '#f6f8fa',
    padding: '16px',
    borderRadius: '6px',
    overflow: 'auto',
  },
  '& pre code': {
    bgcolor: 'transparent',
    padding: 0,
  },
  '& a': {
    color: isDark ? '#58a6ff' : '#0969da',
  },
  '& blockquote': {
    borderLeft: `4px solid ${isDark ? '#3b434b' : '#d0d7de'}`,
    paddingLeft: '16px',
    color: isDark ? '#8b949e' : '#57606a',
  },
  '& mark': {
    backgroundColor: isDark ? 'rgba(255, 212, 0, 0.2)' : 'rgba(255, 230, 128, 0.6)',
    color: 'inherit',
    padding: '0 2px',
    borderRadius: '2px',
  },
});

export const codeMirrorContainerSx = (isDark: boolean): SxProps<Theme> => ({
  height: '100%',
  bgcolor: isDark ? '#0d1117' : '#fff',
});

export const dialogActionsSx: SxProps<Theme> = { px: 3, py: 2 };
export const dialogActionsNoteSx: SxProps<Theme> = { flexGrow: 1 };
