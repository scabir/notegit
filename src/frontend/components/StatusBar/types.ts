import type { RepoStatus } from '../../../shared/types';

export interface StatusBarProps {
  status: RepoStatus | null;
  onFetch: () => void;
  onPull: () => void;
  onPush: () => void;
  hasUnsavedChanges?: boolean;
}
