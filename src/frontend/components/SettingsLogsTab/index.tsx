import React from "react";
import {
  Box,
  Typography,
  Alert,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
import {
  FolderOpen as FolderOpenIcon,
  ContentCopy as ContentCopyIcon,
} from "@mui/icons-material";
import type { SettingsLogsTabProps } from "./types";

export function SettingsLogsTab({
  logsFolder,
  loadingLogsFolder,
  onOpenLogsFolder,
  onCopyLogsFolder,
}: SettingsLogsTabProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6">Application Logs</Typography>
      <Alert severity="info">
        Logs are stored locally by day and include Git/S3 operations, errors,
        and sync events.
      </Alert>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <TextField
          label="Logs Folder"
          value={logsFolder}
          fullWidth
          onClick={onOpenLogsFolder}
          InputProps={{ readOnly: true }}
        />
        <Button
          variant="outlined"
          startIcon={<FolderOpenIcon />}
          onClick={onOpenLogsFolder}
          disabled={!logsFolder || loadingLogsFolder}
        >
          Open Folder
        </Button>
        <IconButton
          aria-label="copy logs folder"
          onClick={onCopyLogsFolder}
          disabled={!logsFolder || loadingLogsFolder}
        >
          <ContentCopyIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
