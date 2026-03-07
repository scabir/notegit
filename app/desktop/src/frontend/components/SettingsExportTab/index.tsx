import React from "react";
import { Box, Typography, Button, Alert } from "@mui/material";
import { useI18n } from "../../i18n";
import type { SettingsExportTabProps } from "./types";

export function SettingsExportTab({
  currentNoteContent,
  exporting,
  onExportNote,
  onExportRepoAsZip,
}: SettingsExportTabProps) {
  const { t } = useI18n();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h6">
        {t("settingsExportTab.exportCurrentNoteTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t("settingsExportTab.exportCurrentNoteDescription")}
      </Typography>
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => onExportNote("md")}
          disabled={exporting || !currentNoteContent}
          fullWidth
        >
          {t("settingsExportTab.exportMarkdownButton")}
        </Button>
        <Button
          variant="outlined"
          onClick={() => onExportNote("txt")}
          disabled={exporting || !currentNoteContent}
          fullWidth
        >
          {t("settingsExportTab.exportTextButton")}
        </Button>
      </Box>
      {!currentNoteContent && (
        <Alert severity="info">{t("settingsExportTab.openNoteHint")}</Alert>
      )}

      <Typography variant="h6" sx={{ mt: 3 }}>
        {t("settingsExportTab.exportRepositoryTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t("settingsExportTab.exportRepositoryDescription")}
      </Typography>
      <Button
        variant="contained"
        onClick={onExportRepoAsZip}
        disabled={exporting}
        fullWidth
      >
        {exporting
          ? t("settingsExportTab.exportingButton")
          : t("settingsExportTab.exportRepositoryButton")}
      </Button>

      <Alert severity="info">
        <Typography variant="body2">
          {t("settingsExportTab.safetyInfo")}
        </Typography>
      </Alert>
    </Box>
  );
}
