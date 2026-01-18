export interface HistoryPanelProps {
  filePath: string | null;
  onViewVersion: (commitHash: string, commitMessage: string) => void;
  onClose: () => void;
}
