export interface CommitDialogProps {
  open: boolean;
  filePath: string | null;
  onClose: () => void;
  onSuccess: () => void;
}
