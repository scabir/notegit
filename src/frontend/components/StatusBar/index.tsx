import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Chip, Box, Tooltip } from '@mui/material';
import {
  Search as SearchIcon,
  History as HistoryIcon,
  SaveAlt as SaveAllIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon,
  CloudSync as CloudSyncIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { STATUS_TEXT } from './constants';
import { REPO_PROVIDERS } from '../../../shared/types';
import { WORKSPACE_TEXT } from '../EditorShell/constants';
import { ShortcutHelper } from '../ShortcutHelper';
import {
  appBarSx,
  toolbarSx,
  sectionSx,
  leftSectionSx,
  middleSectionSx,
  rightSectionSx,
  statusRowSx,
  branchLabelSx,
  headerTitleSx,
  saveStatusRowSx,
  statusChipSx,
  saveMessageSx,
  actionsRowSx,
  actionSeparatorSx,
} from './styles';
import type { StatusBarProps } from './types';

const hiddenStatusTextSx = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(1px, 1px, 1px, 1px)',
} as const;

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

  const getSyncStatus = () => {
    if (!status) {
      return null;
    }

    if (isLocal) {
      return hasUnsavedChanges
        ? {
          icon: <CloudOffIcon fontSize="small" />,
          label: STATUS_TEXT.uncommitted,
          color: 'warning' as const,
        }
        : {
          icon: <CloudDoneIcon fontSize="small" />,
          label: STATUS_TEXT.saved,
          color: 'success' as const,
        };
    }

    if (status.pendingPushCount > 0) {
      return {
        icon: <CloudOffIcon fontSize="small" />,
        label: isS3
          ? `${status.pendingPushCount} changes waiting`
          : `${status.pendingPushCount} commits waiting`,
        color: 'warning' as const,
      };
    }

    if (status.ahead > 0) {
      return {
        icon: <CloudUploadIcon fontSize="small" />,
        label: isS3 ? `${status.ahead} local changes` : `${status.ahead} ahead`,
        color: 'info' as const,
      };
    }

    if (status.behind > 0) {
      return {
        icon: <CloudDownloadIcon fontSize="small" />,
        label: isS3 ? `${status.behind} remote changes` : `${status.behind} behind`,
        color: 'warning' as const,
      };
    }

    if (status.hasUncommitted) {
      return {
        icon: <CloudOffIcon fontSize="small" />,
        label: isS3 ? STATUS_TEXT.unsynced : STATUS_TEXT.uncommitted,
        color: 'default' as const,
      };
    }

    return {
      icon: <CloudDoneIcon fontSize="small" />,
      label: STATUS_TEXT.synced,
      color: 'success' as const,
    };
  };

  const syncStatus = getSyncStatus();
  const branchName = status?.branch || '-';
  const hasStatus = Boolean(status);
  const showHistoryAction = !isLocal;
  const showCommitAction = !isLocal;

  return (
    <AppBar position="fixed" color="default" sx={appBarSx}>
      <Toolbar variant="dense" sx={toolbarSx}>
        <Box sx={sectionSx}>
          <Box sx={leftSectionSx}>
            <Box sx={statusRowSx}>
              {!isLocal && hasStatus && (
                <Typography variant="body2" sx={branchLabelSx}>
                  {isS3 ? STATUS_TEXT.bucketLabel : STATUS_TEXT.branchLabel}: <strong>{branchName}</strong>
                </Typography>
              )}

              {headerTitle && (
                <Typography variant="body2" color="text.secondary" sx={headerTitleSx}>
                  {headerTitle}
                </Typography>
              )}

              {syncStatus && (
                <Chip
                  icon={syncStatus.icon}
                  label={syncStatus.label}
                  size="small"
                  color={syncStatus.color}
                  sx={statusChipSx}
                />
              )}

              {status &&
                !isLocal &&
                status.hasUncommitted &&
                syncStatus?.label !== (isS3 ? STATUS_TEXT.unsynced : STATUS_TEXT.uncommitted) && (
                <Chip
                  label={isS3 ? STATUS_TEXT.unsynced : STATUS_TEXT.uncommitted}
                  size="small"
                  color="default"
                  variant="outlined"
                  sx={statusChipSx}
                />
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={sectionSx}>
          <Box sx={middleSectionSx}>
            {saveStatus !== 'idle' && (
              <Box sx={saveStatusRowSx}>
                {saveStatus === 'saving' && (
                  <Chip
                    label={WORKSPACE_TEXT.savingLabel}
                    size="small"
                    color="info"
                    sx={statusChipSx}
                  />
                )}
                {saveStatus === 'saved' && (
                  <Chip
                    label={WORKSPACE_TEXT.savedLabel}
                    size="small"
                    color="success"
                    sx={statusChipSx}
                  />
                )}
                {saveStatus === 'error' && (
                  <Chip
                    label={WORKSPACE_TEXT.errorLabel}
                    size="small"
                    color="error"
                    sx={statusChipSx}
                  />
                )}
                {saveMessage && (
                  <Typography variant="caption" color="text.secondary" sx={saveMessageSx}>
                    {saveMessage}
                  </Typography>
                )}
                <Typography variant="caption" sx={hiddenStatusTextSx}>
                  {`${saveStatus === 'error'
                    ? WORKSPACE_TEXT.errorLabel
                    : saveStatus === 'saved'
                    ? WORKSPACE_TEXT.savedLabel
                    : WORKSPACE_TEXT.savingLabel} ${saveMessage || ''}`}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={sectionSx}>
          <Box sx={rightSectionSx}>
            <Box sx={actionsRowSx}>
              <Tooltip title={WORKSPACE_TEXT.searchTooltip}>
                <IconButton size="small" onClick={onOpenSearch} color="default">
                  <SearchIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {showHistoryAction && (
                <Tooltip title={WORKSPACE_TEXT.historyTooltip}>
                  <IconButton
                    size="small"
                    onClick={onToggleHistory}
                    color={historyPanelOpen ? 'primary' : 'default'}
                  >
                    <HistoryIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {showHistoryAction && <Box sx={actionSeparatorSx} />}

              <Tooltip title={WORKSPACE_TEXT.saveAllTooltip}>
                <span>
                  <IconButton
                    size="small"
                    onClick={onSaveAll}
                    disabled={!hasUnsavedChanges}
                    color={hasUnsavedChanges ? 'primary' : 'default'}
                  >
                    <SaveAllIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              {showCommitAction && (
                <Tooltip title={isS3 ? WORKSPACE_TEXT.syncTooltip : WORKSPACE_TEXT.commitPushTooltip}>
                  <IconButton size="small" onClick={onCommitAndPush} color="primary">
                    {isS3 ? <CloudSyncIcon fontSize="small" /> : <CloudUploadIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              )}

              {showRemoteActions && status && (
                <>
                  <Tooltip title={STATUS_TEXT.fetchTooltip}>
                    <IconButton size="small" onClick={onFetch}>
                      <CloudSyncIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={STATUS_TEXT.pullTooltip}>
                    <IconButton size="small" onClick={onPull} disabled={!status.needsPull}>
                      <CloudDownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={STATUS_TEXT.pushTooltip}>
                    <IconButton size="small" onClick={onPush} disabled={status.pendingPushCount === 0}>
                      <CloudUploadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}

              <Box sx={actionSeparatorSx} />

              <Tooltip title={WORKSPACE_TEXT.settingsTooltip}>
                <IconButton size="small" onClick={onOpenSettings}>
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <ShortcutHelper ref={shortcutHelperRef} />
            </Box>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
