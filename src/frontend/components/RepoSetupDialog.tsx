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
import type { RepoSettings, AuthMethod, RepoProviderType } from '../../shared/types';

interface RepoSetupDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RepoSetupDialog({ open, onClose, onSuccess }: RepoSetupDialogProps) {
  const [provider, setProvider] = useState<RepoProviderType>('git');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [pat, setPat] = useState('');
  const [bucket, setBucket] = useState('');
  const [region, setRegion] = useState('');
  const [prefix, setPrefix] = useState('');
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      let settings: RepoSettings;

      if (provider === 'git') {
        if (!remoteUrl || !branch || !pat) {
          setError('Please fill in all Git fields');
          setLoading(false);
          return;
        }

        settings = {
          provider: 'git',
          remoteUrl,
          branch,
          pat,
          localPath: '',
          authMethod: 'pat' as AuthMethod,
        };
      } else {
        if (!bucket || !region || !accessKeyId || !secretAccessKey) {
          setError('Please fill in all required S3 fields');
          setLoading(false);
          return;
        }

        settings = {
          provider: 's3',
          bucket,
          region,
          prefix,
          localPath: '',
          accessKeyId,
          secretAccessKey,
          sessionToken,
        };
      }

      const response = await window.notegitApi.repo.openOrClone(settings);

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(response.error?.message || 'Failed to connect to repository');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to repository');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Connect to Repository</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Connect to your repository to start taking notes
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Repository type
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={provider}
              onChange={(_, value) => value && setProvider(value)}
              size="small"
            >
              <ToggleButton value="git">Git</ToggleButton>
              <ToggleButton value="s3">S3</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {provider === 'git' ? (
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
                helperText="Your PAT is stored encrypted locally"
              />

              <Alert severity="info">
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
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
                  9. Select "Ccontent" amd make sure you gave "Read and and Write" permissions
                  <br />
                  10. Hit Generate Token
                  <br />
                  11. Copy and paste the token above
                </Typography>
              </Alert>
            </>
          ) : (
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
                helperText="Stored encrypted locally"
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
                  The S3 bucket must have versioning enabled to support history.
                </Typography>
              </Alert>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConnect}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Connecting...' : 'Connect'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
