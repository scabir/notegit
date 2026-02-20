import type { SxProps, Theme } from "@mui/material/styles";

export const formatToolbarSx: SxProps<Theme> = {
  borderBottom: 1,
  borderColor: "divider",
  minHeight: "40px",
  gap: 0.5,
};

export const dividerSx: SxProps<Theme> = { mx: 0.5 };

export const headingIconSx: SxProps<Theme> = {
  fontSize: "0.85rem",
  fontWeight: 700,
};

export const codeBlockIconSx: SxProps<Theme> = {
  fontSize: "0.75rem",
  fontWeight: "bold",
};

export const growSx: SxProps<Theme> = { flexGrow: 1 };
