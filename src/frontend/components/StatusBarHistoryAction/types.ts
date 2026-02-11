export interface StatusBarHistoryActionProps {
  show: boolean;
  historyPanelOpen: boolean;
  onToggleHistory?: () => void;
  tooltip: string;
}
