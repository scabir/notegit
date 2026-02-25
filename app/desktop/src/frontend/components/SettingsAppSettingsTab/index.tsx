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
import { DEFAULT_APP_LANGUAGE, REPO_PROVIDERS } from "../../../shared/types";
import { useI18n } from "../../i18n";
import type { SettingsAppSettingsTabProps } from "./types";

export function SettingsAppSettingsTab({
  appSettings,
  repoProvider,
  supportedLocales = [DEFAULT_APP_LANGUAGE],
  loading,
  onAppSettingsChange,
  onSaveAppSettings,
}: SettingsAppSettingsTabProps) {
  const { t } = useI18n();

  if (!appSettings) {
    return null;
  }

  const selectedLanguage = appSettings.language || DEFAULT_APP_LANGUAGE;

  const getLocaleLabel = (locale: string): string => {
    if (locale === "en-GB") {
      return t("settingsDialog.appSettings.languageOptionEnGb");
    }

    if (locale === "tr-TR") {
      return t("settingsDialog.appSettings.languageOptionTrTr");
    }

    if (locale === "es-ES") {
      return t("settingsDialog.appSettings.languageOptionEsEs");
    }

    return locale;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <FormControl fullWidth>
        <InputLabel>{t("settingsDialog.appSettings.languageLabel")}</InputLabel>
        <Select
          data-testid="settings-language-select"
          value={selectedLanguage}
          label={t("settingsDialog.appSettings.languageLabel")}
          onChange={(e) =>
            onAppSettingsChange({
              ...appSettings,
              language: e.target.value as string,
            })
          }
        >
          {supportedLocales.map((locale) => (
            <MenuItem key={locale} value={locale}>
              {getLocaleLabel(locale)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>{t("settingsDialog.appSettings.themeLabel")}</InputLabel>
        <Select
          value={appSettings.theme}
          label={t("settingsDialog.appSettings.themeLabel")}
          onChange={(e) =>
            onAppSettingsChange({
              ...appSettings,
              theme: e.target.value as "light" | "dark" | "system",
            })
          }
        >
          <MenuItem value="light">
            {t("settingsDialog.appSettings.themeLight")}
          </MenuItem>
          <MenuItem value="dark">
            {t("settingsDialog.appSettings.themeDark")}
          </MenuItem>
          <MenuItem value="system">
            {t("settingsDialog.appSettings.themeSystem")}
          </MenuItem>
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
        label={t("settingsDialog.appSettings.autoSaveEnabledLabel")}
      />

      {appSettings.autoSaveEnabled && (
        <TextField
          label={t("settingsDialog.appSettings.autoSaveIntervalLabel")}
          type="number"
          value={appSettings.autoSaveIntervalSec}
          onChange={(e) =>
            onAppSettingsChange({
              ...appSettings,
              autoSaveIntervalSec: parseInt(e.target.value, 10),
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
            label={t("settingsDialog.appSettings.s3AutoSyncEnabledLabel")}
          />

          {appSettings.s3AutoSyncEnabled && (
            <TextField
              label={t("settingsDialog.appSettings.s3AutoSyncIntervalLabel")}
              type="number"
              value={appSettings.s3AutoSyncIntervalSec}
              onChange={(e) =>
                onAppSettingsChange({
                  ...appSettings,
                  s3AutoSyncIntervalSec: parseInt(e.target.value, 10),
                })
              }
              InputProps={{ inputProps: { min: 5, max: 3600 } }}
            />
          )}
        </>
      )}

      <Typography variant="h6" sx={{ mt: 2 }}>
        {t("settingsDialog.appSettings.editorPreferencesTitle")}
      </Typography>

      <TextField
        label={t("settingsDialog.appSettings.fontSizeLabel")}
        type="number"
        value={appSettings.editorPrefs.fontSize}
        onChange={(e) =>
          onAppSettingsChange({
            ...appSettings,
            editorPrefs: {
              ...appSettings.editorPrefs,
              fontSize: parseInt(e.target.value, 10),
            },
          })
        }
        InputProps={{ inputProps: { min: 10, max: 24 } }}
      />

      <TextField
        label={t("settingsDialog.appSettings.tabSizeLabel")}
        type="number"
        value={appSettings.editorPrefs.tabSize}
        onChange={(e) =>
          onAppSettingsChange({
            ...appSettings,
            editorPrefs: {
              ...appSettings.editorPrefs,
              tabSize: parseInt(e.target.value, 10),
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
        label={t("settingsDialog.appSettings.showLineNumbersLabel")}
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
        label={t("settingsDialog.appSettings.showMarkdownPreviewLabel")}
      />

      <Button
        data-testid="settings-save-app-button"
        variant="contained"
        onClick={onSaveAppSettings}
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {t("settingsDialog.appSettings.saveButton")}
      </Button>
    </Box>
  );
}
