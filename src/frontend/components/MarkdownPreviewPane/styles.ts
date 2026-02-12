import type { SxProps, Theme } from '@mui/material/styles';
import type { ViewMode } from '../MarkdownEditor/types';

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
  '& mark': {
    backgroundColor: isDark ? 'rgba(255, 212, 0, 0.2)' : 'rgba(255, 230, 128, 0.6)',
    color: 'inherit',
    padding: '0 2px',
    borderRadius: '2px',
  },
});

export const cheatSheetHeaderSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  mb: 2,
};

export const cheatSheetContentSx: SxProps<Theme> = {
  '& section': {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
};

