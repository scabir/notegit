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
import { DIALOG_RENAME_TEST_ID } from "./constants";
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
  cancelLabel = "Cancel",
  confirmLabel = "Rename",
  loadingLabel = "Renaming...",
}: DialogRenameProps) {
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
        <Button onClick={onClose}>{cancelLabel}</Button>
        <Button
          onClick={onSubmit}
          disabled={creating || !value.trim()}
          variant="contained"
        >
          {creating ? loadingLabel : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
