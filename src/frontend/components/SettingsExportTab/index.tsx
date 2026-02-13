import React from "react";
import { Box, Typography, Button, Alert } from "@mui/material";
import type { SettingsExportTabProps } from "./types";

export function SettingsExportTab({
  currentNoteContent,
  exporting,
  onExportNote,
  onExportRepoAsZip,
}: SettingsExportTabProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h6">Export Current Note</Typography>
      <Typography variant="body2" color="text.secondary">
        Export the currently open note (including unsaved changes) as a
        standalone file.
      </Typography>
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => onExportNote("md")}
          disabled={exporting || !currentNoteContent}
          fullWidth
        >
          Export as Markdown (.md)
        </Button>
        <Button
          variant="outlined"
          onClick={() => onExportNote("txt")}
          disabled={exporting || !currentNoteContent}
          fullWidth
        >
          Export as Text (.txt)
        </Button>
      </Box>
      {!currentNoteContent && (
        <Alert severity="info">Open a note in the editor to export it.</Alert>
      )}

      <Typography variant="h6" sx={{ mt: 3 }}>
        Export Repository
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Export the entire repository as a ZIP archive for backup or sharing.
        This includes all files and folders (excluding .git).
      </Typography>
      <Button
        variant="contained"
        onClick={onExportRepoAsZip}
        disabled={exporting}
        fullWidth
      >
        {exporting ? "Exporting..." : "Export Repository as ZIP"}
      </Button>

      <Alert severity="info">
        <Typography variant="body2">
          Export operations do not modify your repository or trigger any Git
          commands. Your work remains safely in the repository.
        </Typography>
      </Alert>
    </Box>
  );
}
