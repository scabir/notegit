import type { SxProps, Theme } from '@mui/material/styles';

export const favoritesSectionSx: SxProps<Theme> = {
  px: 1,
  py: 0.75,
  borderBottom: 1,
  borderColor: 'divider',
  bgcolor: (theme) => (theme.palette.mode === 'light' ? '#e7ebf0' : 'background.paper'),
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
  fontSize: '0.95rem',
  justifyContent: 'flex-start',
  borderRadius: 1,
};
