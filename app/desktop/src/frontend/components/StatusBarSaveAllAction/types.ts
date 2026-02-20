export interface StatusBarSaveAllActionProps {
  hasUnsavedChanges: boolean;
  onSaveAll?: () => void;
  tooltip: string;
}
