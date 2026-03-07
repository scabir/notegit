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

export const editorContainerSx: SxProps<Theme> = {
  display: "flex",
  flexGrow: 1,
  overflow: "hidden",
  position: "relative",
};

export const splitterSx = (isDark: boolean): SxProps<Theme> => ({
  width: "4px",
  cursor: "col-resize",
  bgcolor: isDark ? "#30363d" : "#e0e0e0",
  "&:hover": {
    bgcolor: isDark ? "#58a6ff" : "#1976d2",
  },
  transition: "background-color 0.2s",
  position: "relative",
  zIndex: 1,
});
