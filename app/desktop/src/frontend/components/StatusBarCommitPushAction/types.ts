export interface StatusBarCommitPushActionProps {
  show: boolean;
  isS3: boolean;
  onCommitAndPush?: () => void;
  commitPushTooltip: string;
  syncTooltip: string;
}
