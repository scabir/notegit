import type { SxProps, Theme } from "@mui/material/styles";
import type { ViewMode } from "../MarkdownEditor/types";

export const editorPaneSx = (
  isDark: boolean,
  viewMode: ViewMode,
  editorWidth: number,
): SxProps<Theme> => ({
  width: viewMode === "split" ? `${editorWidth}%` : "100%",
  overflow: "auto",
  bgcolor: isDark ? "#0d1117" : "#f1f3f6",
  transition: viewMode === "split" ? "none" : "width 0.3s ease",
});
