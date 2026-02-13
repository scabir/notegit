export interface SettingsExportTabProps {
  currentNoteContent?: string;
  exporting: boolean;
  onExportNote: (format: "md" | "txt") => void;
  onExportRepoAsZip: () => void;
}
