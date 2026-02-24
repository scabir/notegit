import React from "react";
import { AppBar, Toolbar, Box } from "@mui/material";
import { REPO_PROVIDERS } from "../../../shared/types";
import { useI18n } from "../../i18n";
import { ShortcutHelper } from "../ShortcutHelper";
import { StatusBarBranchLabel } from "../StatusBarBranchLabel";
import { StatusBarHeaderTitle } from "../StatusBarHeaderTitle";
import { StatusBarSyncChip } from "../StatusBarSyncChip";
import { getSyncStatus } from "../StatusBarSyncChip/utils";
import { StatusBarUncommittedChip } from "../StatusBarUncommittedChip";
import { StatusBarSaveStatus } from "../StatusBarSaveStatus";
import { StatusBarSearchAction } from "../StatusBarSearchAction";
import { StatusBarHistoryAction } from "../StatusBarHistoryAction";
import { StatusBarSaveAllAction } from "../StatusBarSaveAllAction";
import { StatusBarCommitPushAction } from "../StatusBarCommitPushAction";
import { StatusBarFetchAction } from "../StatusBarFetchAction";
import { StatusBarPullAction } from "../StatusBarPullAction";
import { StatusBarPushAction } from "../StatusBarPushAction";
import { StatusBarSettingsAction } from "../StatusBarSettingsAction";
import { STATUS_KEYS } from "./constants";
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
} from "./styles";
import type { StatusBarProps } from "./types";

export function StatusBar({
  status,
  onFetch,
  onPull,
  onPush,
  hasUnsavedChanges = false,
  headerTitle = "",
  saveStatus = "idle",
  saveMessage = "",
  historyPanelOpen = false,
  onOpenSearch,
  onToggleHistory,
  onSaveAll,
  onCommitAndPush,
  onOpenSettings,
  shortcutHelperRef,
}: StatusBarProps) {
  const { t } = useI18n();
  const isS3 = status?.provider === REPO_PROVIDERS.s3;
  const isLocal = status?.provider === REPO_PROVIDERS.local;
  const showRemoteActions = status?.provider === REPO_PROVIDERS.git;
  const hasStatus = Boolean(status);
  const branchName = status?.branch || "-";
  const showHistoryAction = !isLocal;
  const showCommitAction = !isLocal;

  const syncStatus = getSyncStatus({
    status,
    isS3,
    isLocal,
    hasUnsavedChanges,
    uncommittedLabel: t(STATUS_KEYS.uncommitted),
    unsyncedLabel: t(STATUS_KEYS.unsynced),
    savedLabel: t(STATUS_KEYS.saved),
    syncedLabel: t(STATUS_KEYS.synced),
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
                bucketLabel={t(STATUS_KEYS.bucketLabel)}
                branchLabel={t(STATUS_KEYS.branchLabel)}
              />

              <StatusBarHeaderTitle headerTitle={headerTitle} />

              <StatusBarSyncChip syncStatus={syncStatus} />

              <StatusBarUncommittedChip
                status={status}
                isLocal={isLocal}
                isS3={isS3}
                unsyncedLabel={t(STATUS_KEYS.unsynced)}
                uncommittedLabel={t(STATUS_KEYS.uncommitted)}
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
              savingLabel={t("editorShell.labels.saving")}
              savedLabel={t("editorShell.labels.saved")}
              errorLabel={t("editorShell.labels.error")}
            />
          </Box>
        </Box>

        <Box sx={sectionSx}>
          <Box sx={rightSectionSx}>
            <Box sx={actionsRowSx}>
              <StatusBarSearchAction
                onOpenSearch={onOpenSearch}
                tooltip={t("editorShell.tooltips.search")}
              />

              <StatusBarHistoryAction
                show={showHistoryAction}
                historyPanelOpen={historyPanelOpen}
                onToggleHistory={onToggleHistory}
                tooltip={t("editorShell.tooltips.history")}
              />

              {showHistoryAction && <Box sx={actionSeparatorSx} />}

              <StatusBarSaveAllAction
                hasUnsavedChanges={hasUnsavedChanges}
                onSaveAll={onSaveAll}
                tooltip={t("editorShell.tooltips.saveAll")}
              />

              <StatusBarCommitPushAction
                show={showCommitAction}
                isS3={isS3}
                onCommitAndPush={onCommitAndPush}
                commitPushTooltip={t("editorShell.tooltips.commitPush")}
                syncTooltip={t("editorShell.tooltips.sync")}
              />

              {showRemoteActions && status && (
                <>
                  <StatusBarFetchAction
                    onFetch={onFetch}
                    tooltip={t(STATUS_KEYS.fetchTooltip)}
                  />

                  <StatusBarPullAction
                    onPull={onPull}
                    disabled={!status.needsPull}
                    tooltip={t(STATUS_KEYS.pullTooltip)}
                  />

                  <StatusBarPushAction
                    onPush={onPush}
                    disabled={status.pendingPushCount === 0}
                    tooltip={t(STATUS_KEYS.pushTooltip)}
                  />
                </>
              )}

              <Box sx={actionSeparatorSx} />

              <StatusBarSettingsAction
                onOpenSettings={onOpenSettings}
                tooltip={t("editorShell.tooltips.settings")}
              />

              <ShortcutHelper ref={shortcutHelperRef} />
            </Box>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
