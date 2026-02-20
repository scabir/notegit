export interface HistoryViewerProps {
  open: boolean;
  filePath: string | null;
  commitHash: string | null;
  commitMessage: string;
  repoPath: string | null;
  onClose: () => void;
}
