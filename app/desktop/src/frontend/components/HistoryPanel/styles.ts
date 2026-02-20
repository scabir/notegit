import type { SxProps, Theme } from "@mui/material/styles";

export const panelSx = (isDark: boolean): SxProps<Theme> => ({
  width: 320,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  borderLeft: 1,
  borderColor: "divider",
  bgcolor: isDark ? "#0d1117" : "background.paper",
});

export const headerSx: SxProps<Theme> = {
  p: 2,
  borderBottom: 1,
  borderColor: "divider",
  display: "flex",
  alignItems: "center",
  gap: 1,
};

export const headerInfoSx: SxProps<Theme> = { flexGrow: 1 };

export const scrollContainerSx: SxProps<Theme> = {
  flexGrow: 1,
  overflow: "auto",
};

export const centerStateSx: SxProps<Theme> = { p: 3, textAlign: "center" };

export const loadingStateSx: SxProps<Theme> = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  py: 4,
};

export const listSx: SxProps<Theme> = { py: 0 };

export const listItemSx = (
  selected: boolean,
  isDark: boolean,
): SxProps<Theme> => ({
  bgcolor: selected
    ? isDark
      ? "rgba(144, 202, 249, 0.16)"
      : "rgba(25, 118, 210, 0.08)"
    : "transparent",
});

export const listItemButtonSx: SxProps<Theme> = { py: 1.5, px: 2 };
export const commitMessageSx: SxProps<Theme> = { mb: 0.5, lineHeight: 1.4 };
export const commitMetaSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  mt: 1,
};
export const hashChipSx: SxProps<Theme> = {
  height: 20,
  fontSize: "0.7rem",
  fontFamily: "monospace",
};
export const commitDateSx: SxProps<Theme> = { mt: 0.5 };

export const footerSx = (isDark: boolean): SxProps<Theme> => ({
  p: 1.5,
  borderTop: 1,
  borderColor: "divider",
  bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
});
