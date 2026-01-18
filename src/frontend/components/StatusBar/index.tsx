import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Chip, Box, Tooltip } from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon,
  CloudSync as CloudSyncIcon,
} from '@mui/icons-material';
import type { RepoStatus } from '../../../shared/types';

interface StatusBarProps {
  status: RepoStatus | null;
  onFetch: () => void;
  onPull: () => void;
  onPush: () => void;
}

export function StatusBar({ status, onFetch, onPull, onPush }: StatusBarProps) {
  if (!status) {
    return null;
  }

  const isS3 = status.provider === 's3';

  const getSyncStatus = () => {
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
        label: isS3 ? 'Unsynced changes' : 'Uncommitted changes',
        color: 'default' as const,
      };
    }

    return {
      icon: <CloudDoneIcon fontSize="small" />,
      label: 'Synced',
      color: 'success' as const,
    };
  };

  const syncStatus = getSyncStatus();

  return (
    <AppBar
      position="fixed"
      color="default"
      sx={{
        top: 'auto',
        bottom: 0,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar variant="dense" sx={{ minHeight: 40 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isS3 ? 'Bucket' : 'Branch'}: <strong>{status.branch}</strong>
          </Typography>

          <Chip
            icon={syncStatus.icon}
            label={syncStatus.label}
            size="small"
            color={syncStatus.color}
          />

          {status.hasUncommitted && (
            <Chip
              label={isS3 ? 'Unsynced changes' : 'Uncommitted changes'}
              size="small"
              color="default"
              variant="outlined"
            />
          )}
        </Box>

        {!isS3 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Fetch from remote">
              <IconButton size="small" onClick={onFetch}>
                <CloudSyncIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Pull from remote">
              <IconButton size="small" onClick={onPull} disabled={!status.needsPull}>
                <CloudDownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Push to remote">
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
