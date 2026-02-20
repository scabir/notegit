export interface RepoSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectMatch: (filePath: string, lineNumber: number) => void;
}
