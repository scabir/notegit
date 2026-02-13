export interface SettingsLogsTabProps {
  logsFolder: string;
  loadingLogsFolder: boolean;
  onOpenLogsFolder: () => void;
  onCopyLogsFolder: () => void;
}
