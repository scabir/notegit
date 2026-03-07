export interface DialogCreateItemProps {
  open: boolean;
  title: string;
  label: string;
  helperText?: string;
  placeholder: string;
  creationLocationText: string;
  value: string;
  errorMessage?: string;
  creating: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onCreate: () => void;
  testId: string;
  cancelLabel?: string;
  confirmLabel?: string;
  loadingLabel?: string;
}
