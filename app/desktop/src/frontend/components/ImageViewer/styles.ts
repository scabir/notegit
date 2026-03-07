import type { SxProps, Theme } from "@mui/material/styles";

export const emptyStateSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: "text.secondary",
};

export const rootSx: SxProps<Theme> = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

export const toolbarSx: SxProps<Theme> = {
  px: 1,
  minHeight: "40px",
  borderBottom: 1,
  borderColor: "divider",
  display: "flex",
  gap: 0.5,
};

export const treeControlsRowSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: 0.5,
};

export const filePathSx: SxProps<Theme> = {
  ml: 1,
  fontFamily: "monospace",
  fontSize: "0.8125rem",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const imageContainerSx: SxProps<Theme> = {
  flexGrow: 1,
  minHeight: 0,
  overflow: "auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: 2,
};

export const imageSx: SxProps<Theme> = {
  maxWidth: "100%",
  maxHeight: "100%",
  width: "auto",
  height: "auto",
  objectFit: "contain",
};
