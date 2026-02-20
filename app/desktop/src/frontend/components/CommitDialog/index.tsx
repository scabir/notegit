import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { COMMIT_DIALOG_TEXT } from "./constants";
import { contentStackSx } from "./styles";
import type { CommitDialogProps } from "./types";

export function CommitDialog({
  open,
  filePath: _filePath,
  onClose,
  onSuccess,
}: CommitDialogProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMessage("");
      setError(null);
    }
  }, [open]);

  const handleCommit = async () => {
    if (!message.trim()) {
      setError(COMMIT_DIALOG_TEXT.emptyMessageError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await window.notegitApi.files.commitAll(message);

      if (response.ok) {
        await window.notegitApi.repo.push();
        onSuccess();
        onClose();
      } else {
        setError(response.error?.message || COMMIT_DIALOG_TEXT.commitFailed);
      }
    } catch (err: any) {
      setError(err.message || COMMIT_DIALOG_TEXT.commitFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleCommit();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{COMMIT_DIALOG_TEXT.title}</DialogTitle>
      <DialogContent>
        <Box sx={contentStackSx}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label={COMMIT_DIALOG_TEXT.messageLabel}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            multiline
            rows={3}
            fullWidth
            autoFocus
            placeholder={COMMIT_DIALOG_TEXT.messagePlaceholder}
            onKeyDown={handleKeyDown}
            helperText={COMMIT_DIALOG_TEXT.helperText}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {COMMIT_DIALOG_TEXT.cancel}
        </Button>
        <Button
          variant="contained"
          onClick={handleCommit}
          disabled={loading || !message.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? COMMIT_DIALOG_TEXT.loading : COMMIT_DIALOG_TEXT.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
