import type { SxProps, Theme } from '@mui/material/styles';

export const titleRowSx: SxProps<Theme> = { display: 'flex', alignItems: 'center', gap: 1 };
export const titleTextSx: SxProps<Theme> = { flexGrow: 1 };
export const queryBlockSx: SxProps<Theme> = { mb: 2 };
export const queryInputSx: SxProps<Theme> = { mb: 2 };
export const toggleRowSx: SxProps<Theme> = { display: 'flex', gap: 2, mb: 2 };
export const actionButtonSx: SxProps<Theme> = { mb: 2 };
export const alertSx: SxProps<Theme> = { mb: 2 };
export const resultsHeaderSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: 1,
};
export const resultsPaperSx: SxProps<Theme> = { maxHeight: 400, overflow: 'auto' };
export const fileHeaderItemSx: SxProps<Theme> = {
  bgcolor: 'action.hover',
  borderBottom: 1,
  borderColor: 'divider',
};
export const fileHeaderRowSx: SxProps<Theme> = { display: 'flex', alignItems: 'center', gap: 1 };
export const matchHighlightSx: SxProps<Theme> = {
  bgcolor: 'warning.light',
  color: 'warning.contrastText',
  px: 0.5,
  borderRadius: 0.5,
};
export const replaceInFileButtonSx: SxProps<Theme> = { ml: 'auto', fontSize: '0.75rem' };
export const matchLineSx: SxProps<Theme> = { mr: 1, fontWeight: 500 };
export const matchButtonSx: SxProps<Theme> = { pl: 4 };
export const extraMatchesSx: SxProps<Theme> = { pl: 4 };
export const actionsHintSx: SxProps<Theme> = { flexGrow: 1, ml: 2 };
