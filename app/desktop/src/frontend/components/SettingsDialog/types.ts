import type { AppSettings } from "../../../shared/types";

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onThemeChange?: (theme: "light" | "dark" | "system") => void;
  onAppSettingsSaved?: (settings: AppSettings) => void;
  currentNoteContent?: string;
  currentNotePath?: string;
}
