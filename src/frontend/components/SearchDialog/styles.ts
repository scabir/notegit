import type { SxProps, Theme } from "@mui/material/styles";

export const dialogPaperSx: SxProps<Theme> = {
  height: "70vh",
  maxHeight: "600px",
};

export const dialogTitleSx: SxProps<Theme> = { pb: 1 };
export const titleRowSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: 1,
};

export const contentRootSx: SxProps<Theme> = {
  p: 0,
  display: "flex",
  flexDirection: "column",
};
export const searchBoxSx: SxProps<Theme> = { px: 3, pt: 1, pb: 2 };
export const resultsContainerSx: SxProps<Theme> = {
  flexGrow: 1,
  overflow: "auto",
  px: 1,
};
export const centerStateSx: SxProps<Theme> = { p: 3, textAlign: "center" };

export const resultItemSx = (
  selected: boolean,
  isDark: boolean,
): SxProps<Theme> => ({
  borderLeft: selected ? 3 : 0,
  borderColor: "primary.main",
  bgcolor: selected
    ? isDark
      ? "rgba(144, 202, 249, 0.16)"
      : "rgba(25, 118, 210, 0.08)"
    : "transparent",
});

export const resultButtonSx: SxProps<Theme> = { py: 1.5 };
export const resultRowSx: SxProps<Theme> = {
  display: "flex",
  gap: 2,
  width: "100%",
  alignItems: "flex-start",
};
export const iconWrapSx: SxProps<Theme> = { mt: 0.5 };
export const fileInfoSx: SxProps<Theme> = { flexGrow: 1, minWidth: 0 };
export const fileNameSx: SxProps<Theme> = { fontWeight: 600, mb: 0.5 };
export const filePathSx: SxProps<Theme> = { display: "block", mb: 1 };

export const matchSnippetSx = (isDark: boolean): SxProps<Theme> => ({
  mb: 0.5,
  p: 1,
  bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
  borderRadius: 1,
  fontSize: "0.75rem",
});

export const matchTextSx: SxProps<Theme> = {
  fontFamily: "monospace",
  display: "block",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const lineNumberSx: SxProps<Theme> = { fontSize: "0.65rem" };
export const moreChipSx: SxProps<Theme> = {
  mt: 0.5,
  height: 20,
  fontSize: "0.7rem",
};

export const highlightSx = (isDark: boolean): SxProps<Theme> => ({
  bgcolor: isDark ? "rgba(255, 217, 0, 0.3)" : "rgba(255, 235, 59, 0.5)",
  fontWeight: 600,
});
