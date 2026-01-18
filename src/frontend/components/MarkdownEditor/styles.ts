import type { SxProps, Theme } from '@mui/material/styles';
import type { ViewMode } from './types';

export const emptyStateSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: 'text.secondary',
};

export const rootSx: SxProps<Theme> = { height: '100%', display: 'flex', flexDirection: 'column' };

export const headerToolbarSx: SxProps<Theme> = {
  borderBottom: 1,
  borderColor: 'divider',
  gap: 1,
  minHeight: '48px',
};

export const headerRowSx: SxProps<Theme> = { flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 };

export const splitIconRowSx: SxProps<Theme> = { display: 'flex', gap: 0.5 };

export const formatToolbarSx: SxProps<Theme> = {
  borderBottom: 1,
  borderColor: 'divider',
  minHeight: '40px',
  gap: 0.5,
};

export const editorContainerSx: SxProps<Theme> = {
  display: 'flex',
  flexGrow: 1,
  overflow: 'hidden',
  position: 'relative',
};

export const editorPaneSx = (
  isDark: boolean,
  viewMode: ViewMode,
  editorWidth: number,
): SxProps<Theme> => ({
  width: viewMode === 'split' ? `${editorWidth}%` : '100%',
  overflow: 'auto',
  bgcolor: isDark ? '#0d1117' : '#fff',
  transition: viewMode === 'split' ? 'none' : 'width 0.3s ease',
});

export const previewPaneSx = (
  isDark: boolean,
  viewMode: ViewMode,
  editorWidth: number,
): SxProps<Theme> => ({
  width: viewMode === 'split' ? `${100 - editorWidth}%` : '100%',
  overflow: 'auto',
  p: 2,
  bgcolor: isDark ? '#0d1117' : 'background.paper',
  color: isDark ? '#c9d1d9' : 'text.primary',
  transition: viewMode === 'split' ? 'none' : 'width 0.3s ease',
});

export const splitterSx = (isDark: boolean): SxProps<Theme> => ({
  width: '4px',
  cursor: 'col-resize',
  bgcolor: isDark ? '#30363d' : '#e0e0e0',
  '&:hover': {
    bgcolor: isDark ? '#58a6ff' : '#1976d2',
  },
  transition: 'background-color 0.2s',
  position: 'relative',
  zIndex: 1,
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
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    marginTop: '24px',
    marginBottom: '16px',
    fontWeight: 600,
    lineHeight: 1.25,
  },
  '& p': {
    marginTop: 0,
    marginBottom: '16px',
  },
  '& ul, & ol': {
    paddingLeft: '2em',
    marginTop: 0,
    marginBottom: '16px',
  },
});
