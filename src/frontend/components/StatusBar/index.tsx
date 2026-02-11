import React from 'react';
import { AppBar, Toolbar, Box } from '@mui/material';
import { REPO_PROVIDERS } from '../../../shared/types';
import { WORKSPACE_TEXT } from '../EditorShell/constants';
import { ShortcutHelper } from '../ShortcutHelper';
import { StatusBarBranchLabel } from '../StatusBarBranchLabel';
import { StatusBarHeaderTitle } from '../StatusBarHeaderTitle';
import { StatusBarSyncChip } from '../StatusBarSyncChip';
import { getSyncStatus } from '../StatusBarSyncChip/utils';
import { StatusBarUncommittedChip } from '../StatusBarUncommittedChip';
import { StatusBarSaveStatus } from '../StatusBarSaveStatus';
import { StatusBarSearchAction } from '../StatusBarSearchAction';
import { StatusBarHistoryAction } from '../StatusBarHistoryAction';
import { StatusBarSaveAllAction } from '../StatusBarSaveAllAction';
import { StatusBarCommitPushAction } from '../StatusBarCommitPushAction';
import { StatusBarFetchAction } from '../StatusBarFetchAction';
import { StatusBarPullAction } from '../StatusBarPullAction';
import { StatusBarPushAction } from '../StatusBarPushAction';
import { StatusBarSettingsAction } from '../StatusBarSettingsAction';
import { STATUS_TEXT } from './constants';
import {
  appBarSx,
  toolbarSx,
  sectionSx,
  leftSectionSx,
  middleSectionSx,
  rightSectionSx,
  statusRowSx,
  actionsRowSx,
  actionSeparatorSx,
} from './styles';
import type { StatusBarProps } from './types';

export function StatusBar({
  status,
  onFetch,
  onPull,
  onPush,
  hasUnsavedChanges = false,
  headerTitle = '',
  saveStatus = 'idle',
  saveMessage = '',
  historyPanelOpen = false,
  onOpenSearch,
  onToggleHistory,
  onSaveAll,
  onCommitAndPush,
  onOpenSettings,
  shortcutHelperRef,
}: StatusBarProps) {
  const isS3 = status?.provider === REPO_PROVIDERS.s3;
  const isLocal = status?.provider === REPO_PROVIDERS.local;
  const showRemoteActions = status?.provider === REPO_PROVIDERS.git;
  const hasStatus = Boolean(status);
  const branchName = status?.branch || '-';
  const showHistoryAction = !isLocal;
  const showCommitAction = !isLocal;

  const syncStatus = getSyncStatus({
    status,
    isS3,
    isLocal,
    hasUnsavedChanges,
    uncommittedLabel: STATUS_TEXT.uncommitted,
    unsyncedLabel: STATUS_TEXT.unsynced,
    savedLabel: STATUS_TEXT.saved,
    syncedLabel: STATUS_TEXT.synced,
  });

  return (
    <AppBar position="fixed" color="default" sx={appBarSx}>
      <Toolbar variant="dense" sx={toolbarSx}>
        <Box sx={sectionSx}>
          <Box sx={leftSectionSx}>
            <Box sx={statusRowSx}>
              <StatusBarBranchLabel
                isLocal={isLocal}
                hasStatus={hasStatus}
                isS3={isS3}
                branchName={branchName}
                bucketLabel={STATUS_TEXT.bucketLabel}
                branchLabel={STATUS_TEXT.branchLabel}
              />

              <StatusBarHeaderTitle headerTitle={headerTitle} />

              <StatusBarSyncChip syncStatus={syncStatus} />

              <StatusBarUncommittedChip
                status={status}
                isLocal={isLocal}
                isS3={isS3}
                unsyncedLabel={STATUS_TEXT.unsynced}
                uncommittedLabel={STATUS_TEXT.uncommitted}
                syncStatusLabel={syncStatus?.label}
              />
            </Box>
          </Box>
        </Box>

        <Box sx={sectionSx}>
          <Box sx={middleSectionSx}>
            <StatusBarSaveStatus
              saveStatus={saveStatus}
              saveMessage={saveMessage}
              savingLabel={WORKSPACE_TEXT.savingLabel}
              savedLabel={WORKSPACE_TEXT.savedLabel}
              errorLabel={WORKSPACE_TEXT.errorLabel}
            />
          </Box>
        </Box>

        <Box sx={sectionSx}>
          <Box sx={rightSectionSx}>
            <Box sx={actionsRowSx}>
              <StatusBarSearchAction
                onOpenSearch={onOpenSearch}
                tooltip={WORKSPACE_TEXT.searchTooltip}
              />

              <StatusBarHistoryAction
                show={showHistoryAction}
                historyPanelOpen={historyPanelOpen}
                onToggleHistory={onToggleHistory}
                tooltip={WORKSPACE_TEXT.historyTooltip}
              />

              {showHistoryAction && <Box sx={actionSeparatorSx} />}

              <StatusBarSaveAllAction
                hasUnsavedChanges={hasUnsavedChanges}
                onSaveAll={onSaveAll}
                tooltip={WORKSPACE_TEXT.saveAllTooltip}
              />

              <StatusBarCommitPushAction
                show={showCommitAction}
                isS3={isS3}
                onCommitAndPush={onCommitAndPush}
                commitPushTooltip={WORKSPACE_TEXT.commitPushTooltip}
                syncTooltip={WORKSPACE_TEXT.syncTooltip}
              />

              {showRemoteActions && status && (
                <>
                  <StatusBarFetchAction
                    onFetch={onFetch}
                    tooltip={STATUS_TEXT.fetchTooltip}
                  />

                  <StatusBarPullAction
                    onPull={onPull}
                    disabled={!status.needsPull}
                    tooltip={STATUS_TEXT.pullTooltip}
                  />

                  <StatusBarPushAction
                    onPush={onPush}
                    disabled={status.pendingPushCount === 0}
                    tooltip={STATUS_TEXT.pushTooltip}
                  />
                </>
              )}

              <Box sx={actionSeparatorSx} />

              <StatusBarSettingsAction
                onOpenSettings={onOpenSettings}
                tooltip={WORKSPACE_TEXT.settingsTooltip}
              />

              <ShortcutHelper ref={shortcutHelperRef} />
            </Box>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
