import type { SxProps, Theme } from "@mui/material/styles";

export const contentStackSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  mt: 1,
};

export const repoTypeRowSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: 2,
};

export const patTitleSx: SxProps<Theme> = { fontWeight: "bold" };
export const patListSx: SxProps<Theme> = { mt: 1 };
