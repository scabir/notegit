export interface DialogRenameProps {
  open: boolean;
  onClose: () => void;
  title: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  errorMessage?: string;
  creating: boolean;
  placeholder?: string;
  testId: string;
  cancelLabel?: string;
  confirmLabel?: string;
  loadingLabel?: string;
}
