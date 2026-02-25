import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { dialogInfoSx, dialogErrorSx } from "./styles";
import { useI18n } from "../../i18n";
import {
  DIALOG_CREATE_ITEM_KEYS,
  DIALOG_CREATE_ITEM_TEXT,
  DIALOG_CREATE_ITEM_TEST_ID,
} from "./constants";
import type { DialogCreateItemProps } from "./types";

export function DialogCreateItem({
  open,
  title,
  label,
  helperText,
  placeholder,
  creationLocationText,
  value,
  errorMessage,
  creating,
  onChange,
  onClose,
  onCreate,
  testId = DIALOG_CREATE_ITEM_TEST_ID,
  cancelLabel,
  confirmLabel,
  loadingLabel,
}: DialogCreateItemProps) {
  const { t } = useI18n();
  const resolvedCancelLabel = cancelLabel ?? t(DIALOG_CREATE_ITEM_KEYS.cancel);
  const resolvedConfirmLabel =
    confirmLabel ?? t(DIALOG_CREATE_ITEM_KEYS.create);
  const resolvedLoadingLabel =
    loadingLabel ?? t(DIALOG_CREATE_ITEM_KEYS.creating);

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
        <Box sx={dialogInfoSx}>
          <Typography variant="caption" color="text.secondary">
            {creationLocationText}
          </Typography>
        </Box>
        <TextField
          autoFocus
          margin="dense"
          label={label}
          fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !creating) {
              onCreate();
            }
          }}
          placeholder={placeholder}
          helperText={helperText ?? DIALOG_CREATE_ITEM_TEXT.helperSpacer}
          error={Boolean(errorMessage)}
        />
        {errorMessage && <Box sx={dialogErrorSx}>{errorMessage}</Box>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{resolvedCancelLabel}</Button>
        <Button
          onClick={onCreate}
          disabled={creating || !value.trim()}
          variant="contained"
        >
          {creating ? resolvedLoadingLabel : resolvedConfirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
