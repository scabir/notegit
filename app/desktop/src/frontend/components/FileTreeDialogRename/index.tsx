import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Box,
} from "@mui/material";
import { dialogErrorSx } from "./styles";
import { useI18n } from "../../i18n";
import { DIALOG_RENAME_KEYS, DIALOG_RENAME_TEST_ID } from "./constants";
import type { DialogRenameProps } from "./types";

export function DialogRename({
  open,
  onClose,
  title,
  label,
  value,
  onChange,
  onSubmit,
  errorMessage,
  creating,
  placeholder,
  testId = DIALOG_RENAME_TEST_ID,
  cancelLabel,
  confirmLabel,
  loadingLabel,
}: DialogRenameProps) {
  const { t } = useI18n();
  const resolvedCancelLabel = cancelLabel ?? t(DIALOG_RENAME_KEYS.cancel);
  const resolvedConfirmLabel = confirmLabel ?? t(DIALOG_RENAME_KEYS.rename);
  const resolvedLoadingLabel = loadingLabel ?? t(DIALOG_RENAME_KEYS.renaming);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid={testId}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={label}
          fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !creating) {
              onSubmit();
            }
          }}
          placeholder={placeholder}
          error={Boolean(errorMessage)}
        />
        {errorMessage && <Box sx={dialogErrorSx}>{errorMessage}</Box>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{resolvedCancelLabel}</Button>
        <Button
          onClick={onSubmit}
          disabled={creating || !value.trim()}
          variant="contained"
        >
          {creating ? resolvedLoadingLabel : resolvedConfirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
