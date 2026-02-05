import React, { useState } from 'react';
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
} from '@mui/material';
import type { RepoSettings, AuthMethod, RepoProviderType } from '../../../shared/types';
import { REPO_PROVIDERS } from '../../../shared/types';
import { REPO_SETUP_TEXT } from './constants';
import { contentStackSx, repoTypeRowSx, patTitleSx, patListSx } from './styles';
import type { RepoSetupDialogProps } from './types';

export function RepoSetupDialog({ open, onClose, onSuccess }: RepoSetupDialogProps) {
  const [provider, setProvider] = useState<RepoProviderType>(REPO_PROVIDERS.git);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [pat, setPat] = useState('');
  const [bucket, setBucket] = useState('');
  const [region, setRegion] = useState('');
  const [prefix, setPrefix] = useState('');
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [localName, setLocalName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      let settings: RepoSettings;

      if (provider === REPO_PROVIDERS.git) {
        if (!remoteUrl || !branch || !pat) {
          setError(REPO_SETUP_TEXT.gitRequired);
          setLoading(false);
          return;
        }

        settings = {
          provider: REPO_PROVIDERS.git,
          remoteUrl,
          branch,
          pat,
          localPath: '',
          authMethod: 'pat' as AuthMethod,
        };
      } else if (provider === REPO_PROVIDERS.s3) {
        if (!bucket || !region || !accessKeyId || !secretAccessKey) {
          setError(REPO_SETUP_TEXT.s3Required);
          setLoading(false);
          return;
        }

        settings = {
          provider: REPO_PROVIDERS.s3,
          bucket,
          region,
          prefix,
          localPath: '',
          accessKeyId,
          secretAccessKey,
          sessionToken,
        };
      } else {
        if (!localName.trim()) {
          setError(REPO_SETUP_TEXT.localRequired);
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
        setError(response.error?.message || REPO_SETUP_TEXT.connectFailed);
      }
    } catch (err: any) {
      setError(err.message || REPO_SETUP_TEXT.connectFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{REPO_SETUP_TEXT.title}</DialogTitle>
      <DialogContent>
        <Box sx={contentStackSx}>
          <Typography variant="body2" color="text.secondary">
            {REPO_SETUP_TEXT.description}
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={repoTypeRowSx}>
            <Typography variant="body2" color="text.secondary">
              {REPO_SETUP_TEXT.repoTypeLabel}
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={provider}
              onChange={(_, value) => value && setProvider(value)}
              size="small"
            >
              <ToggleButton value={REPO_PROVIDERS.git}>{REPO_SETUP_TEXT.gitLabel}</ToggleButton>
              <ToggleButton value={REPO_PROVIDERS.s3}>{REPO_SETUP_TEXT.s3Label}</ToggleButton>
              <ToggleButton value={REPO_PROVIDERS.local}>{REPO_SETUP_TEXT.localLabel}</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {provider === REPO_PROVIDERS.git ? (
            <>
              <TextField
                label="Remote URL"
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
                placeholder="https://github.com/user/repo.git"
                fullWidth
                required
                disabled={loading}
              />

              <TextField
                label="Branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                fullWidth
                required
                disabled={loading}
              />

              <TextField
                label="Personal Access Token"
                type="password"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                placeholder="ghp_..."
                fullWidth
                required
                disabled={loading}
                helperText={REPO_SETUP_TEXT.patHelper}
              />

              <Alert severity="info">
                <Typography variant="body2" sx={patTitleSx}>
                  How to create a GitHub Personal Access Token:
                </Typography>
                <Typography variant="body2" component="div" sx={patListSx}>
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
                  9. Select "Ccontent" amd make sure you gave "Read and and Write" permissions
                  <br />
                  10. Hit Generate Token
                  <br />
                  11. Copy and paste the token above
                </Typography>
              </Alert>
            </>
          ) : provider === REPO_PROVIDERS.s3 ? (
            <>
              <TextField
                label="Bucket"
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
                placeholder="my-notes-bucket"
                fullWidth
                required
                disabled={loading}
              />

              <TextField
                label="Region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="us-east-1"
                fullWidth
                required
                disabled={loading}
              />

              <TextField
                label="Prefix (optional)"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="notes/"
                fullWidth
                disabled={loading}
              />

              <TextField
                label="Access Key ID"
                value={accessKeyId}
                onChange={(e) => setAccessKeyId(e.target.value)}
                fullWidth
                required
                disabled={loading}
              />

              <TextField
                label="Secret Access Key"
                type="password"
                value={secretAccessKey}
                onChange={(e) => setSecretAccessKey(e.target.value)}
                fullWidth
                required
                disabled={loading}
                helperText={REPO_SETUP_TEXT.s3SecretHelper}
              />

              <TextField
                label="Session Token (optional)"
                type="password"
                value={sessionToken}
                onChange={(e) => setSessionToken(e.target.value)}
                fullWidth
                disabled={loading}
              />

              <Alert severity="info">
                <Typography variant="body2">
                  {REPO_SETUP_TEXT.s3Info}
                </Typography>
              </Alert>
            </>
          ) : (
            <>
              <TextField
                label="Local Repository Name"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="My Notes"
                fullWidth
                required
                disabled={loading}
                helperText="A local folder will be created in your app data directory."
              />
              <Alert severity="info">
                <Typography variant="body2">
                  {REPO_SETUP_TEXT.localInfo}
                </Typography>
              </Alert>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{REPO_SETUP_TEXT.cancel}</Button>
        <Button
          variant="contained"
          onClick={handleConnect}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? REPO_SETUP_TEXT.connecting : REPO_SETUP_TEXT.connect}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
