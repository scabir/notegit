import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Chip, Box, Tooltip } from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon,
  CloudSync as CloudSyncIcon,
} from '@mui/icons-material';
import { STATUS_TEXT } from './constants';
import { REPO_PROVIDERS } from '../../../shared/types';
import { appBarSx, toolbarSx, statusRowSx, branchLabelSx, actionsRowSx } from './styles';
import type { StatusBarProps } from './types';

export function StatusBar({ status, onFetch, onPull, onPush, hasUnsavedChanges = false }: StatusBarProps) {
  if (!status) {
    return null;
  }

  const isS3 = status.provider === REPO_PROVIDERS.s3;
  const isLocal = status.provider === REPO_PROVIDERS.local;
  const showRemoteActions = status.provider === REPO_PROVIDERS.git;

  const getSyncStatus = () => {
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

  return (
    <AppBar position="fixed" color="default" sx={appBarSx}>
      <Toolbar variant="dense" sx={toolbarSx}>
        <Box sx={statusRowSx}>
          {!isLocal && (
            <Typography variant="body2" sx={branchLabelSx}>
              {isS3 ? STATUS_TEXT.bucketLabel : STATUS_TEXT.branchLabel}:{' '}
              <strong>{status.branch}</strong>
            </Typography>
          )}

          <Chip
            icon={syncStatus.icon}
            label={syncStatus.label}
            size="small"
            color={syncStatus.color}
          />

          {!isLocal &&
            status.hasUncommitted &&
            syncStatus.label !== (isS3 ? STATUS_TEXT.unsynced : STATUS_TEXT.uncommitted) && (
            <Chip
              label={isS3 ? STATUS_TEXT.unsynced : STATUS_TEXT.uncommitted}
              size="small"
              color="default"
              variant="outlined"
            />
          )}
        </Box>

        {showRemoteActions && (
          <Box sx={actionsRowSx}>
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
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
