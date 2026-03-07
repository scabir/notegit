import React from "react";
import { Box, TextField, Alert, Typography, Button } from "@mui/material";
import {
  ContentCopy as ContentCopyIcon,
  FolderOpen as FolderOpenIcon,
} from "@mui/icons-material";
import { REPO_PROVIDERS } from "../../../shared/types";
import { useI18n } from "../../i18n";
import type { SettingsRepositoryTabProps } from "./types";

export function SettingsRepositoryTab({
  repoProvider,
  repoSettings,
  gitRepoSettings,
  s3RepoSettings,
  loading,
  onRepoSettingsChange,
  onSaveRepoSettings,
  onCopyRepoPath,
  onOpenRepoFolder,
}: SettingsRepositoryTabProps) {
  const { t } = useI18n();

  const gitPatGuideLines = [
    t("settingsRepositoryTab.git.patGuide.line1"),
    t("settingsRepositoryTab.git.patGuide.line2"),
    t("settingsRepositoryTab.git.patGuide.line3"),
    t("settingsRepositoryTab.git.patGuide.line4"),
    t("settingsRepositoryTab.git.patGuide.line5"),
    t("settingsRepositoryTab.git.patGuide.line6"),
    t("settingsRepositoryTab.git.patGuide.line7"),
    t("settingsRepositoryTab.git.patGuide.line8"),
    t("settingsRepositoryTab.git.patGuide.line9"),
    t("settingsRepositoryTab.git.patGuide.line10"),
    t("settingsRepositoryTab.git.patGuide.line11"),
  ];

  const repoTypeLabel =
    repoProvider === REPO_PROVIDERS.git
      ? t("settingsRepositoryTab.repoType.git")
      : repoProvider === REPO_PROVIDERS.s3
        ? t("settingsRepositoryTab.repoType.s3")
        : t("settingsRepositoryTab.repoType.local");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        label={t("settingsRepositoryTab.repositoryTypeLabel")}
        value={repoTypeLabel}
        fullWidth
        InputProps={{
          readOnly: true,
        }}
        variant="filled"
      />

      {repoProvider === REPO_PROVIDERS.git ? (
        <>
          <TextField
            label={t("settingsRepositoryTab.git.remoteUrlLabel")}
            value={gitRepoSettings.remoteUrl || ""}
            onChange={(e) =>
              onRepoSettingsChange({
                ...repoSettings,
                provider: REPO_PROVIDERS.git,
                remoteUrl: e.target.value,
              })
            }
            placeholder={t("settingsRepositoryTab.git.remoteUrlPlaceholder")}
            fullWidth
            required
          />

          <TextField
            label={t("settingsRepositoryTab.git.branchLabel")}
            value={gitRepoSettings.branch || ""}
            onChange={(e) =>
              onRepoSettingsChange({
                ...repoSettings,
                provider: REPO_PROVIDERS.git,
                branch: e.target.value,
              })
            }
            placeholder={t("settingsRepositoryTab.git.branchPlaceholder")}
            fullWidth
            required
          />

          <TextField
            label={t("settingsRepositoryTab.git.patLabel")}
            type="password"
            value={gitRepoSettings.pat || ""}
            onChange={(e) =>
              onRepoSettingsChange({
                ...repoSettings,
                provider: REPO_PROVIDERS.git,
                pat: e.target.value,
              })
            }
            placeholder={t("settingsRepositoryTab.git.patPlaceholder")}
            fullWidth
            required
            helperText={t("settingsRepositoryTab.git.patHelperText")}
          />

          <Alert severity="info">
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {t("settingsRepositoryTab.git.patGuide.title")}
            </Typography>
            <Typography variant="body2" component="div" sx={{ mt: 1 }}>
              {gitPatGuideLines.map((line, index) => (
                <React.Fragment key={line}>
                  {line}
                  {index < gitPatGuideLines.length - 1 ? <br /> : null}
                </React.Fragment>
              ))}
            </Typography>
          </Alert>
        </>
      ) : repoProvider === REPO_PROVIDERS.s3 ? (
        <>
          <TextField
            label={t("settingsRepositoryTab.s3.bucketLabel")}
            value={s3RepoSettings.bucket || ""}
            onChange={(e) =>
              onRepoSettingsChange({
                ...repoSettings,
                provider: REPO_PROVIDERS.s3,
                bucket: e.target.value,
              })
            }
            placeholder={t("settingsRepositoryTab.s3.bucketPlaceholder")}
            fullWidth
            required
          />

          <TextField
            label={t("settingsRepositoryTab.s3.regionLabel")}
            value={s3RepoSettings.region || ""}
            onChange={(e) =>
              onRepoSettingsChange({
                ...repoSettings,
                provider: REPO_PROVIDERS.s3,
                region: e.target.value,
              })
            }
            placeholder={t("settingsRepositoryTab.s3.regionPlaceholder")}
            fullWidth
            required
          />

          <TextField
            label={t("settingsRepositoryTab.s3.prefixLabel")}
            value={s3RepoSettings.prefix || ""}
            onChange={(e) =>
              onRepoSettingsChange({
                ...repoSettings,
                provider: REPO_PROVIDERS.s3,
                prefix: e.target.value,
              })
            }
            placeholder={t("settingsRepositoryTab.s3.prefixPlaceholder")}
            fullWidth
          />

          <TextField
            label={t("settingsRepositoryTab.s3.accessKeyIdLabel")}
            value={s3RepoSettings.accessKeyId || ""}
            onChange={(e) =>
              onRepoSettingsChange({
                ...repoSettings,
                provider: REPO_PROVIDERS.s3,
                accessKeyId: e.target.value,
              })
            }
            fullWidth
            required
          />

          <TextField
            label={t("settingsRepositoryTab.s3.secretAccessKeyLabel")}
            type="password"
            value={s3RepoSettings.secretAccessKey || ""}
            onChange={(e) =>
              onRepoSettingsChange({
                ...repoSettings,
                provider: REPO_PROVIDERS.s3,
                secretAccessKey: e.target.value,
              })
            }
            fullWidth
            required
            helperText={t("settingsRepositoryTab.s3.secretAccessKeyHelperText")}
          />

          <TextField
            label={t("settingsRepositoryTab.s3.sessionTokenLabel")}
            type="password"
            value={s3RepoSettings.sessionToken || ""}
            onChange={(e) =>
              onRepoSettingsChange({
                ...repoSettings,
                provider: REPO_PROVIDERS.s3,
                sessionToken: e.target.value,
              })
            }
            fullWidth
          />

          <Alert severity="info">
            <Typography variant="body2">
              {t("settingsRepositoryTab.s3.info")}
            </Typography>
          </Alert>
        </>
      ) : (
        <Alert severity="info">
          <Typography variant="body2">
            {t("settingsRepositoryTab.local.info")}
          </Typography>
        </Alert>
      )}

      {repoProvider !== REPO_PROVIDERS.local && (
        <Button
          variant="contained"
          onClick={onSaveRepoSettings}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {t("settingsRepositoryTab.saveButton")}
        </Button>
      )}

      {repoSettings.localPath && (
        <>
          <Typography variant="h6" sx={{ mt: 4 }}>
            {t("settingsRepositoryTab.localPath.title")}
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("settingsRepositoryTab.localPath.description")}
          </Alert>
          <TextField
            label={t("settingsRepositoryTab.localPath.label")}
            value={repoSettings.localPath}
            fullWidth
            onClick={onOpenRepoFolder}
            InputProps={{
              readOnly: true,
            }}
            variant="filled"
          />
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={onCopyRepoPath}
            >
              {t("settingsRepositoryTab.localPath.copyPathButton")}
            </Button>
            <Button
              variant="outlined"
              startIcon={<FolderOpenIcon />}
              onClick={onOpenRepoFolder}
            >
              {t("settingsRepositoryTab.localPath.openFolderButton")}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
