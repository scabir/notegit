import type { SxProps, Theme } from "@mui/material/styles";

export const treeContainerSx: SxProps<Theme> = {
  flex: 1,
  overflow: "auto",
  p: 1,
  position: "relative",
  bgcolor: (theme) =>
    theme.palette.mode === "light" ? "#eef0f3" : "background.paper",
};

export const treeItemLabelSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  pr: 1,
  userSelect: "none",
};
