export interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectFile: (filePath: string) => void;
}
