import React from "react";
import {
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon,
} from "@mui/icons-material";
import type { GetSyncStatusParams, SyncStatusDisplay } from "./types";

export function getSyncStatus({
  status,
  isS3,
  isLocal,
  hasUnsavedChanges,
  uncommittedLabel,
  unsyncedLabel,
  savedLabel,
  syncedLabel,
}: GetSyncStatusParams): SyncStatusDisplay | null {
  if (!status) {
    return null;
  }

  if (isLocal) {
    return hasUnsavedChanges
      ? {
          icon: <CloudOffIcon fontSize="small" />,
          label: uncommittedLabel,
          color: "warning",
        }
      : {
          icon: <CloudDoneIcon fontSize="small" />,
          label: savedLabel,
          color: "success",
        };
  }

  if (status.pendingPushCount > 0) {
    return {
      icon: <CloudOffIcon fontSize="small" />,
      label: isS3
        ? `${status.pendingPushCount} changes waiting`
        : `${status.pendingPushCount} commits waiting`,
      color: "warning",
    };
  }

  if (status.ahead > 0) {
    return {
      icon: <CloudUploadIcon fontSize="small" />,
      label: isS3 ? `${status.ahead} local changes` : `${status.ahead} ahead`,
      color: "info",
    };
  }

  if (status.behind > 0) {
    return {
      icon: <CloudDownloadIcon fontSize="small" />,
      label: isS3
        ? `${status.behind} remote changes`
        : `${status.behind} behind`,
      color: "warning",
    };
  }

  if (status.hasUncommitted) {
    return {
      icon: <CloudOffIcon fontSize="small" />,
      label: isS3 ? unsyncedLabel : uncommittedLabel,
      color: "default",
    };
  }

  return {
    icon: <CloudDoneIcon fontSize="small" />,
    label: syncedLabel,
    color: "success",
  };
}
