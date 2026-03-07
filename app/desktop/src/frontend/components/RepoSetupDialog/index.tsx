import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import type {
  RepoSettings,
  AuthMethod,
  RepoProviderType,
} from "../../../shared/types";
import { REPO_PROVIDERS } from "../../../shared/types";
import { useI18n } from "../../i18n";
import { REPO_SETUP_KEYS } from "./constants";
import { contentStackSx, repoTypeRowSx, patTitleSx, patListSx } from "./styles";
import type { RepoSetupDialogProps } from "./types";

export function RepoSetupDialog({
  open,
  onClose,
  onSuccess,
}: RepoSetupDialogProps) {
  const { t } = useI18n();
  const patGuideLines = React.useMemo(
    () => [
      t(REPO_SETUP_KEYS.patGuideLine1),
      t(REPO_SETUP_KEYS.patGuideLine2),
      t(REPO_SETUP_KEYS.patGuideLine3),
      t(REPO_SETUP_KEYS.patGuideLine4),
      t(REPO_SETUP_KEYS.patGuideLine5),
      t(REPO_SETUP_KEYS.patGuideLine6),
      t(REPO_SETUP_KEYS.patGuideLine7),
      t(REPO_SETUP_KEYS.patGuideLine8),
      t(REPO_SETUP_KEYS.patGuideLine9),
      t(REPO_SETUP_KEYS.patGuideLine10),
      t(REPO_SETUP_KEYS.patGuideLine11),
    ],
    [t],
  );
  const [provider, setProvider] = useState<RepoProviderType>(
    REPO_PROVIDERS.git,
  );
  const [remoteUrl, setRemoteUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [pat, setPat] = useState("");
  const [bucket, setBucket] = useState("");
  const [region, setRegion] = useState("");
  const [prefix, setPrefix] = useState("");
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [localName, setLocalName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      let settings: RepoSettings;

      if (provider === REPO_PROVIDERS.git) {
        if (!remoteUrl || !branch || !pat) {
          setError(t(REPO_SETUP_KEYS.gitRequired));
          setLoading(false);
          return;
        }

        settings = {
          provider: REPO_PROVIDERS.git,
          remoteUrl,
          branch,
          pat,
          localPath: "",
          authMethod: "pat" as AuthMethod,
        };
      } else if (provider === REPO_PROVIDERS.s3) {
        if (!bucket || !region || !accessKeyId || !secretAccessKey) {
          setError(t(REPO_SETUP_KEYS.s3Required));
          setLoading(false);
          return;
        }

        settings = {
          provider: REPO_PROVIDERS.s3,
          bucket,
          region,
          prefix,
          localPath: "",
          accessKeyId,
          secretAccessKey,
          sessionToken,
        };
      } else {
        if (!localName.trim()) {
          setError(t(REPO_SETUP_KEYS.localRequired));
          setLoading(false);
          return;
        }

        settings = {
          provider: REPO_PROVIDERS.local,
          localPath: localName.trim(),
        };
      }

      const response = await window.notegitApi.repo.openOrClone(settings);

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(response.error?.message || t(REPO_SETUP_KEYS.connectFailed));
      }
    } catch (err: any) {
      setError(err.message || t(REPO_SETUP_KEYS.connectFailed));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t(REPO_SETUP_KEYS.title)}</DialogTitle>
      <DialogContent>
        <Box sx={contentStackSx}>
          <Typography variant="body2" color="text.secondary">
            {t(REPO_SETUP_KEYS.description)}
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={repoTypeRowSx}>
            <Typography variant="body2" color="text.secondary">
              {t(REPO_SETUP_KEYS.repoTypeLabel)}
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={provider}
              onChange={(_, value) => value && setProvider(value)}
              size="small"
            >
              <ToggleButton value={REPO_PROVIDERS.git}>
                {t(REPO_SETUP_KEYS.gitLabel)}
              </ToggleButton>
              <ToggleButton value={REPO_PROVIDERS.s3}>
                {t(REPO_SETUP_KEYS.s3Label)}
              </ToggleButton>
              <ToggleButton value={REPO_PROVIDERS.local}>
                {t(REPO_SETUP_KEYS.localLabel)}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {provider === REPO_PROVIDERS.git ? (
            <>
              <TextField
                label={t(REPO_SETUP_KEYS.gitRemoteUrlLabel)}
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
                placeholder={t(REPO_SETUP_KEYS.gitRemoteUrlPlaceholder)}
                fullWidth
                required
                disabled={loading}
              />

              <TextField
                label={t(REPO_SETUP_KEYS.gitBranchLabel)}
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder={t(REPO_SETUP_KEYS.gitBranchPlaceholder)}
                fullWidth
                required
                disabled={loading}
              />

              <TextField
                label={t(REPO_SETUP_KEYS.gitPatLabel)}
                type="password"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                placeholder={t(REPO_SETUP_KEYS.gitPatPlaceholder)}
                fullWidth
                required
                disabled={loading}
                helperText={t(REPO_SETUP_KEYS.patHelper)}
              />

              <Alert severity="info">
                <Typography variant="body2" sx={patTitleSx}>
                  {t(REPO_SETUP_KEYS.patGuideTitle)}
                </Typography>
                <Typography variant="body2" component="div" sx={patListSx}>
                  {patGuideLines.map((line, index) => (
                    <React.Fragment key={line}>
                      {line}
                      {index < patGuideLines.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </Typography>
              </Alert>
            </>
          ) : provider === REPO_PROVIDERS.s3 ? (
            <>
              <TextField
                label={t(REPO_SETUP_KEYS.s3BucketLabel)}
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
                placeholder={t(REPO_SETUP_KEYS.s3BucketPlaceholder)}
                fullWidth
                required
                disabled={loading}
              />

              <TextField
                label={t(REPO_SETUP_KEYS.s3RegionLabel)}
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder={t(REPO_SETUP_KEYS.s3RegionPlaceholder)}
                fullWidth
                required
                disabled={loading}
              />

              <TextField
                label={t(REPO_SETUP_KEYS.s3PrefixLabel)}
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder={t(REPO_SETUP_KEYS.s3PrefixPlaceholder)}
                fullWidth
                disabled={loading}
              />

              <TextField
                label={t(REPO_SETUP_KEYS.s3AccessKeyIdLabel)}
                value={accessKeyId}
                onChange={(e) => setAccessKeyId(e.target.value)}
                fullWidth
                required
                disabled={loading}
              />

              <TextField
                label={t(REPO_SETUP_KEYS.s3SecretAccessKeyLabel)}
                type="password"
                value={secretAccessKey}
                onChange={(e) => setSecretAccessKey(e.target.value)}
                fullWidth
                required
                disabled={loading}
                helperText={t(REPO_SETUP_KEYS.s3SecretHelper)}
              />

              <TextField
                label={t(REPO_SETUP_KEYS.s3SessionTokenLabel)}
                type="password"
                value={sessionToken}
                onChange={(e) => setSessionToken(e.target.value)}
                fullWidth
                disabled={loading}
              />

              <Alert severity="info">
                <Typography variant="body2">
                  {t(REPO_SETUP_KEYS.s3Info)}
                </Typography>
              </Alert>
            </>
          ) : (
            <>
              <TextField
                label={t(REPO_SETUP_KEYS.localRepoNameLabel)}
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder={t(REPO_SETUP_KEYS.localRepoNamePlaceholder)}
                fullWidth
                required
                disabled={loading}
                helperText={t(REPO_SETUP_KEYS.localRepoNameHelper)}
              />
              <Alert severity="info">
                <Typography variant="body2">
                  {t(REPO_SETUP_KEYS.localInfo)}
                </Typography>
              </Alert>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t(REPO_SETUP_KEYS.cancel)}
        </Button>
        <Button
          variant="contained"
          onClick={handleConnect}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? t(REPO_SETUP_KEYS.connecting) : t(REPO_SETUP_KEYS.connect)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
