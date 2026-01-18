import type { SxProps, Theme } from '@mui/material/styles';

export const dialogTitleSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

export const introSectionSx: SxProps<Theme> = { mb: 3 };
export const sectionSx: SxProps<Theme> = { mb: 2 };

export const featureListSx: SxProps<Theme> = { mt: 1, pl: 2 };

export const linksListSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

export const linkRowSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
};

export const techStackListSx: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 1,
  mt: 1,
};

export const techChipSx: SxProps<Theme> = {
  px: 1,
  py: 0.5,
  bgcolor: 'action.hover',
  borderRadius: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
};
