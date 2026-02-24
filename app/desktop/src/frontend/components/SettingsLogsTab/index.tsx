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
import { useI18n } from "../../i18n";
import type { SettingsLogsTabProps } from "./types";

export function SettingsLogsTab({
  logsFolder,
  loadingLogsFolder,
  onOpenLogsFolder,
  onCopyLogsFolder,
}: SettingsLogsTabProps) {
  const { t } = useI18n();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6">
        {t("settingsLogsTab.applicationLogsTitle")}
      </Typography>
      <Alert severity="info">{t("settingsLogsTab.info")}</Alert>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <TextField
          label={t("settingsLogsTab.logsFolderLabel")}
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
          {t("settingsLogsTab.openFolderButton")}
        </Button>
        <IconButton
          aria-label={t("settingsLogsTab.copyLogsFolderAriaLabel")}
          onClick={onCopyLogsFolder}
          disabled={!logsFolder || loadingLogsFolder}
        >
          <ContentCopyIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
