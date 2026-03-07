import { getDefaultTranslation } from "../../i18n/defaultTranslations";

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

const defaultText = (key: string): string => getDefaultTranslation(key);

export const COMMIT_DIALOG_TEXT = {
  title: defaultText(COMMIT_DIALOG_KEYS.title),
  messageLabel: defaultText(COMMIT_DIALOG_KEYS.messageLabel),
  messagePlaceholder: defaultText(COMMIT_DIALOG_KEYS.messagePlaceholder),
  helperText: defaultText(COMMIT_DIALOG_KEYS.helperText),
  cancel: defaultText(COMMIT_DIALOG_KEYS.cancel),
  confirm: defaultText(COMMIT_DIALOG_KEYS.confirm),
  loading: defaultText(COMMIT_DIALOG_KEYS.loading),
  emptyMessageError: defaultText(COMMIT_DIALOG_KEYS.emptyMessageError),
  commitFailed: defaultText(COMMIT_DIALOG_KEYS.commitFailed),
} as const;
