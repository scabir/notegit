import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Chip, Box, Tooltip } from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon,
} from '@mui/icons-material';
import type { RepoStatus } from '../../shared/types';

interface StatusBarProps {
  status: RepoStatus | null;
  onPull: () => void;
  onPush: () => void;
}

export function StatusBar({ status, onPull, onPush }: StatusBarProps) {
  if (!status) {
    return null;
  }

  const getSyncStatus = () => {
    if (status.pendingPushCount > 0) {
      return {
        icon: <CloudOffIcon fontSize="small" />,
        label: `${status.pendingPushCount} commits waiting`,
        color: 'warning' as const,
      };
    }
    
    if (status.ahead > 0) {
      return {
        icon: <CloudUploadIcon fontSize="small" />,
        label: `${status.ahead} ahead`,
        color: 'info' as const,
      };
    }
    
    if (status.behind > 0) {
      return {
        icon: <CloudDownloadIcon fontSize="small" />,
        label: `${status.behind} behind`,
        color: 'warning' as const,
      };
    }
    
    if (status.hasUncommitted) {
      return {
        icon: <CloudOffIcon fontSize="small" />,
        label: 'Uncommitted changes',
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
            Branch: <strong>{status.branch}</strong>
          </Typography>

          <Chip
            icon={syncStatus.icon}
            label={syncStatus.label}
            size="small"
            color={syncStatus.color}
          />

          {status.hasUncommitted && (
            <Chip
              label="Uncommitted changes"
              size="small"
              color="default"
              variant="outlined"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Pull from remote">
            <IconButton size="small" onClick={onPull} disabled={status.behind === 0}>
              <CloudDownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Push to remote">
            <IconButton size="small" onClick={onPush} disabled={status.ahead === 0}>
              <CloudUploadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

