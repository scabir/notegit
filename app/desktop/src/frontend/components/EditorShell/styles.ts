import type { SxProps, Theme } from "@mui/material/styles";

export const rootSx: SxProps<Theme> = {
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

export const mainContentSx: SxProps<Theme> = {
  display: "flex",
  flexGrow: 1,
  overflow: "hidden",
  minWidth: 0,
  pb: "40px",
};

export const sidebarSx = (
  width: number,
  isCollapsed: boolean,
): SxProps<Theme> => ({
  width,
  minWidth: width,
  maxWidth: width,
  flexShrink: 0,
  borderRight: isCollapsed ? 0 : 1,
  borderColor: "divider",
  overflowY: isCollapsed ? "hidden" : "auto",
  overflowX: isCollapsed ? "hidden" : "auto",
});

export const resizeHandleSx = (isResizing: boolean): SxProps<Theme> => ({
  width: "4px",
  cursor: "col-resize",
  bgcolor: isResizing ? "primary.main" : "transparent",
  "&:hover": {
    bgcolor: "primary.light",
  },
  transition: "background-color 0.2s",
  flexShrink: 0,
});

export const editorPaneSx: SxProps<Theme> = {
  flexGrow: 1,
  overflow: "hidden",
  minWidth: 0,
};
