import React from "react";
import { Box, TextField, Alert, Typography, Button } from "@mui/material";
import {
  ContentCopy as ContentCopyIcon,
  FolderOpen as FolderOpenIcon,
} from "@mui/icons-material";
import { REPO_PROVIDERS } from "../../../shared/types";
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
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        label="Repository Type"
        value={
          repoProvider === REPO_PROVIDERS.git
            ? "Git"
            : repoProvider === REPO_PROVIDERS.s3
              ? "S3"
              : "Local"
        }
        fullWidth
        InputProps={{
          readOnly: true,
        }}
        variant="filled"
      />

      {repoProvider === REPO_PROVIDERS.git ? (
        <>
          <TextField
            label="Remote URL"
            value={gitRepoSettings.remoteUrl || ""}
            onChange={(e) =>
              onRepoSettingsChange({
                ...repoSettings,
                provider: REPO_PROVIDERS.git,
                remoteUrl: e.target.value,
              })
            }
            placeholder="https://github.com/user/repo.git"
            fullWidth
            required
          />

          <TextField
            label="Branch"
            value={gitRepoSettings.branch || ""}
            onChange={(e) =>
              onRepoSettingsChange({
                ...repoSettings,
                provider: REPO_PROVIDERS.git,
                branch: e.target.value,
              })
            }
            placeholder="main"
            fullWidth
            required
          />

          <TextField
            label="Personal Access Token"
            type="password"
            value={gitRepoSettings.pat || ""}
            onChange={(e) =>
              onRepoSettingsChange({
                ...repoSettings,
                provider: REPO_PROVIDERS.git,
                pat: e.target.value,
              })
            }
            placeholder="ghp_..."
            fullWidth
            required
            helperText="Your Personal Access Token is stored encrypted in the app's data directory, not in your operating system's keychain."
          />

          <Alert severity="info">
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              How to create a GitHub Personal Access Token:
            </Typography>
            <Typography variant="body2" component="div" sx={{ mt: 1 }}>
              1. Go to GitHub Settings → Developer settings
              <br />
              2. Click Personal access tokens → Fine Grained Tokens
              <br />
              3. Click Generate new token
              <br />
              4. Give Token Name
              <br />
              5. Set the expirationn
              <br />
              6. Select "Only select repositories" option
              <br />
              7. Selec the repository you wat to Use
              <br />
              8. CLick on "Add Permission"
              <br />
              9. Select "Ccontent" amd make sure you gave "Reand and Write"
              permissions
              <br />
              10. Hit Generate Token
              <br />
              11. Copy and paste the token above
            </Typography>
          </Alert>
        </>
      ) : repoProvider === REPO_PROVIDERS.s3 ? (
        <>
          <TextField
            label="Bucket"
            value={s3RepoSettings.bucket || ""}
            onChange={(e) =>
              onRepoSettingsChange({
                ...repoSettings,
                provider: REPO_PROVIDERS.s3,
                bucket: e.target.value,
              })
            }
            placeholder="my-notes-bucket"
            fullWidth
            required
          />

          <TextField
            label="Region"
            value={s3RepoSettings.region || ""}
            onChange={(e) =>
              onRepoSettingsChange({
                ...repoSettings,
                provider: REPO_PROVIDERS.s3,
                region: e.target.value,
              })
            }
            placeholder="us-east-1"
            fullWidth
            required
          />

          <TextField
            label="Prefix (optional)"
            value={s3RepoSettings.prefix || ""}
            onChange={(e) =>
              onRepoSettingsChange({
                ...repoSettings,
                provider: REPO_PROVIDERS.s3,
                prefix: e.target.value,
              })
            }
            placeholder="notes/"
            fullWidth
          />

          <TextField
            label="Access Key ID"
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
            label="Secret Access Key"
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
            helperText="Stored encrypted in the app's data directory."
          />

          <TextField
            label="Session Token (optional)"
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
              The S3 bucket must have versioning enabled to support history.
            </Typography>
          </Alert>
        </>
      ) : (
        <Alert severity="info">
          <Typography variant="body2">
            Local repositories are stored on this device only and do not sync.
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
          Save Repository Settings
        </Button>
      )}

      {repoSettings.localPath && (
        <>
          <Typography variant="h6" sx={{ mt: 4 }}>
            Local Repository Path
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            This is where your repository is stored locally on your computer.
          </Alert>
          <TextField
            label="Local Path"
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
              Copy Path
            </Button>
            <Button
              variant="outlined"
              startIcon={<FolderOpenIcon />}
              onClick={onOpenRepoFolder}
            >
              Open Folder
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
