import enGbCommitDialog from "../../i18n/en-GB/commitDialog.json";

export const COMMIT_DIALOG_KEYS = {
  title: "commitDialog.title",
  messageLabel: "commitDialog.messageLabel",
  messagePlaceholder: "commitDialog.messagePlaceholder",
  helperText: "commitDialog.helperText",
  cancel: "commitDialog.cancel",
  confirm: "commitDialog.confirm",
  loading: "commitDialog.loading",
  emptyMessageError: "commitDialog.emptyMessageError",
  commitFailed: "commitDialog.commitFailed",
} as const;

export const COMMIT_DIALOG_TEXT = {
  title: enGbCommitDialog.title,
  messageLabel: enGbCommitDialog.messageLabel,
  messagePlaceholder: enGbCommitDialog.messagePlaceholder,
  helperText: enGbCommitDialog.helperText,
  cancel: enGbCommitDialog.cancel,
  confirm: enGbCommitDialog.confirm,
  loading: enGbCommitDialog.loading,
  emptyMessageError: enGbCommitDialog.emptyMessageError,
  commitFailed: enGbCommitDialog.commitFailed,
} as const;
