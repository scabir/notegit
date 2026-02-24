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
import { useI18n } from "../../i18n";
import { COMMIT_DIALOG_KEYS } from "./constants";
import { contentStackSx } from "./styles";
import type { CommitDialogProps } from "./types";

export function CommitDialog({
  open,
  filePath: _filePath,
  onClose,
  onSuccess,
}: CommitDialogProps) {
  const { t } = useI18n();
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
      setError(t(COMMIT_DIALOG_KEYS.emptyMessageError));
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
        setError(response.error?.message || t(COMMIT_DIALOG_KEYS.commitFailed));
      }
    } catch (err: any) {
      setError(err.message || t(COMMIT_DIALOG_KEYS.commitFailed));
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
      <DialogTitle>{t(COMMIT_DIALOG_KEYS.title)}</DialogTitle>
      <DialogContent>
        <Box sx={contentStackSx}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label={t(COMMIT_DIALOG_KEYS.messageLabel)}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            multiline
            rows={3}
            fullWidth
            autoFocus
            placeholder={t(COMMIT_DIALOG_KEYS.messagePlaceholder)}
            onKeyDown={handleKeyDown}
            helperText={t(COMMIT_DIALOG_KEYS.helperText)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t(COMMIT_DIALOG_KEYS.cancel)}
        </Button>
        <Button
          variant="contained"
          onClick={handleCommit}
          disabled={loading || !message.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading
            ? t(COMMIT_DIALOG_KEYS.loading)
            : t(COMMIT_DIALOG_KEYS.confirm)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
