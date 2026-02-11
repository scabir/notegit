import type { RepoStatus } from '../../../shared/types';
import type { ShortcutHelperHandle } from '../ShortcutHelper';
import type { Ref } from 'react';

export type SaveStatusType = 'idle' | 'saving' | 'saved' | 'error';

export interface StatusBarProps {
  status: RepoStatus | null;
  onFetch: () => void;
  onPull: () => void;
  onPush: () => void;
  hasUnsavedChanges?: boolean;
  headerTitle?: string;
  saveStatus?: SaveStatusType;
  saveMessage?: string;
  historyPanelOpen?: boolean;
  onOpenSearch?: () => void;
  onToggleHistory?: () => void;
  onSaveAll?: () => void;
  onCommitAndPush?: () => void;
  onOpenSettings?: () => void;
  shortcutHelperRef?: Ref<ShortcutHelperHandle>;
}
