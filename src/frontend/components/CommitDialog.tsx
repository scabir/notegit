import React, { useState, useEffect } from 'react';
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
} from '@mui/material';

interface CommitDialogProps {
  open: boolean;
  filePath: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CommitDialog({ open, filePath, onClose, onSuccess }: CommitDialogProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && filePath) {
      const filename = filePath.split('/').pop() || filePath;
      setMessage(`Update ${filename}`);
    }
  }, [open, filePath]);

  const handleCommit = async () => {
    if (!filePath || !message.trim()) {
      setError('Please enter a commit message');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await window.notegitApi.files.commit(filePath, message);

      if (response.ok) {
        // Try to push after successful commit
        await window.notegitApi.repo.push();
        onSuccess();
        onClose();
      } else {
        setError(response.error?.message || 'Failed to commit');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to commit');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleCommit();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Commit Changes</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="File"
            value={filePath || ''}
            disabled
            fullWidth
            size="small"
          />

          <TextField
            label="Commit Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            multiline
            rows={3}
            fullWidth
            autoFocus
            placeholder="Describe your changes..."
            onKeyDown={handleKeyDown}
            helperText="Cmd/Ctrl+Enter to commit"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCommit}
          disabled={loading || !message.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Committing...' : 'Commit & Push'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

