import React from 'react';
import { Tooltip, IconButton } from '@mui/material';
import { CloudUpload as CloudUploadIcon, CloudSync as CloudSyncIcon } from '@mui/icons-material';
import { STATUS_BAR_COMMIT_PUSH_ACTION } from './constants';
import { iconButtonSx } from './styles';
import type { StatusBarCommitPushActionProps } from './types';

export function StatusBarCommitPushAction({
  show,
  isS3,
  onCommitAndPush,
  commitPushTooltip,
  syncTooltip,
}: StatusBarCommitPushActionProps) {
  if (!show) {
    return null;
  }

  return (
    <Tooltip title={isS3 ? syncTooltip : commitPushTooltip}>
      <IconButton
        size="small"
        onClick={onCommitAndPush}
        color="primary"
        sx={iconButtonSx}
        data-testid={STATUS_BAR_COMMIT_PUSH_ACTION.testId}
      >
        {isS3 ? <CloudSyncIcon fontSize="small" /> : <CloudUploadIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}
