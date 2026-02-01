import type { SxProps, Theme } from '@mui/material/styles';

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
  fontSize: '0.95rem',
  justifyContent: 'flex-start',
  borderRadius: 1,
};
