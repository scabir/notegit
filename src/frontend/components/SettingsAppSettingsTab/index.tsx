import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
  Button,
} from "@mui/material";
import { REPO_PROVIDERS } from "../../../shared/types";
import type { SettingsAppSettingsTabProps } from "./types";

export function SettingsAppSettingsTab({
  appSettings,
  repoProvider,
  loading,
  onAppSettingsChange,
  onSaveAppSettings,
}: SettingsAppSettingsTabProps) {
  if (!appSettings) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <FormControl fullWidth>
        <InputLabel>Theme</InputLabel>
        <Select
          value={appSettings.theme}
          label="Theme"
          onChange={(e) =>
            onAppSettingsChange({
              ...appSettings,
              theme: e.target.value as "light" | "dark" | "system",
            })
          }
        >
          <MenuItem value="light">Light</MenuItem>
          <MenuItem value="dark">Dark</MenuItem>
          <MenuItem value="system">System</MenuItem>
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Switch
            checked={appSettings.autoSaveEnabled}
            onChange={(e) =>
              onAppSettingsChange({
                ...appSettings,
                autoSaveEnabled: e.target.checked,
              })
            }
          />
        }
        label="Enable Auto-save"
      />

      {appSettings.autoSaveEnabled && (
        <TextField
          label="Auto-save Interval (seconds)"
          type="number"
          value={appSettings.autoSaveIntervalSec}
          onChange={(e) =>
            onAppSettingsChange({
              ...appSettings,
              autoSaveIntervalSec: parseInt(e.target.value),
            })
          }
          InputProps={{ inputProps: { min: 10, max: 300 } }}
        />
      )}

      {repoProvider === REPO_PROVIDERS.s3 && (
        <>
          <FormControlLabel
            control={
              <Switch
                checked={appSettings.s3AutoSyncEnabled}
                onChange={(e) =>
                  onAppSettingsChange({
                    ...appSettings,
                    s3AutoSyncEnabled: e.target.checked,
                  })
                }
              />
            }
            label="Enable S3 Auto Sync"
          />

          {appSettings.s3AutoSyncEnabled && (
            <TextField
              label="S3 Auto Sync (in seconds)"
              type="number"
              value={appSettings.s3AutoSyncIntervalSec}
              onChange={(e) =>
                onAppSettingsChange({
                  ...appSettings,
                  s3AutoSyncIntervalSec: parseInt(e.target.value),
                })
              }
              InputProps={{ inputProps: { min: 5, max: 3600 } }}
            />
          )}
        </>
      )}

      <Typography variant="h6" sx={{ mt: 2 }}>
        Editor Preferences
      </Typography>

      <TextField
        label="Font Size"
        type="number"
        value={appSettings.editorPrefs.fontSize}
        onChange={(e) =>
          onAppSettingsChange({
            ...appSettings,
            editorPrefs: {
              ...appSettings.editorPrefs,
              fontSize: parseInt(e.target.value),
            },
          })
        }
        InputProps={{ inputProps: { min: 10, max: 24 } }}
      />

      <TextField
        label="Tab Size"
        type="number"
        value={appSettings.editorPrefs.tabSize}
        onChange={(e) =>
          onAppSettingsChange({
            ...appSettings,
            editorPrefs: {
              ...appSettings.editorPrefs,
              tabSize: parseInt(e.target.value),
            },
          })
        }
        InputProps={{ inputProps: { min: 2, max: 8 } }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={appSettings.editorPrefs.lineNumbers}
            onChange={(e) =>
              onAppSettingsChange({
                ...appSettings,
                editorPrefs: {
                  ...appSettings.editorPrefs,
                  lineNumbers: e.target.checked,
                },
              })
            }
          />
        }
        label="Show Line Numbers"
      />

      <FormControlLabel
        control={
          <Switch
            checked={appSettings.editorPrefs.showPreview}
            onChange={(e) =>
              onAppSettingsChange({
                ...appSettings,
                editorPrefs: {
                  ...appSettings.editorPrefs,
                  showPreview: e.target.checked,
                },
              })
            }
          />
        }
        label="Show Markdown Preview"
      />

      <Button
        variant="contained"
        onClick={onSaveAppSettings}
        disabled={loading}
        sx={{ mt: 2 }}
      >
        Save App Settings
      </Button>
    </Box>
  );
}
