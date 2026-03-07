import type { SxProps, Theme } from "@mui/material/styles";

export const saveStatusRowSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  minWidth: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
};

export const statusChipSx: SxProps<Theme> = {
  height: 24,
  flexShrink: 0,
};

export const saveMessageSx: SxProps<Theme> = {
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const hiddenStatusTextSx: SxProps<Theme> = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(1px, 1px, 1px, 1px)",
};
