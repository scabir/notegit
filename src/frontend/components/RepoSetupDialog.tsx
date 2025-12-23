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
} from '@mui/material';
import type { RepoSettings, AuthMethod } from '../../shared/types';

interface RepoSetupDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RepoSetupDialog({ open, onClose, onSuccess }: RepoSetupDialogProps) {
  const [remoteUrl, setRemoteUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [pat, setPat] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!remoteUrl || !branch || !pat) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      const settings: RepoSettings = {
        remoteUrl,
        branch,
        pat,
        localPath: '', // Will be set by backend
        authMethod: 'pat' as AuthMethod,
      };

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
            Connect to your Git repository to start taking notes
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

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

