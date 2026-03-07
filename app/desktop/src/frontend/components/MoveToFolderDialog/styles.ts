import type { SxProps, Theme } from "@mui/material/styles";

export const infoBoxSx: SxProps<Theme> = { mb: 2 };
export const errorAlertSx: SxProps<Theme> = { mb: 2 };
export const sectionLabelSx: SxProps<Theme> = { mb: 1 };

export const folderRowSx = (isInvalid: boolean): SxProps<Theme> => ({
  display: "flex",
  alignItems: "center",
  py: 0.5,
  opacity: isInvalid ? 0.4 : 1,
  cursor: isInvalid ? "not-allowed" : "pointer",
});

export const folderIconSx: SxProps<Theme> = { mr: 1, color: "action.active" };

export const rootOptionSx = (isSelected: boolean): SxProps<Theme> => ({
  p: 1,
  mb: 1,
  borderRadius: 1,
  cursor: "pointer",
  bgcolor: isSelected ? "action.selected" : "transparent",
  "&:hover": {
    bgcolor: "action.hover",
  },
});

export const rootOptionInnerSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
};

export const treeContainerSx: SxProps<Theme> = {
  maxHeight: 300,
  overflow: "auto",
  border: 1,
  borderColor: "divider",
  borderRadius: 1,
  p: 1,
};

export const emptyTreeTextSx: SxProps<Theme> = { p: 2, textAlign: "center" };
