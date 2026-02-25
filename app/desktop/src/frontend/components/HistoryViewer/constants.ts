import { getDefaultTranslation } from "../../i18n/defaultTranslations";

export const HISTORY_VIEWER_KEYS = {
  readOnly: "historyViewer.readOnly",
  closeTooltip: "historyViewer.closeTooltip",
  preview: "historyViewer.preview",
  source: "historyViewer.source",
  copyContent: "historyViewer.copyContent",
  close: "historyViewer.close",
  loadFailed: "historyViewer.loadFailed",
  readOnlyNotice: "historyViewer.readOnlyNotice",
} as const;

const defaultText = (key: string): string => getDefaultTranslation(key);

export const HISTORY_VIEWER_TEXT = {
  readOnly: defaultText(HISTORY_VIEWER_KEYS.readOnly),
  closeTooltip: defaultText(HISTORY_VIEWER_KEYS.closeTooltip),
  preview: defaultText(HISTORY_VIEWER_KEYS.preview),
  source: defaultText(HISTORY_VIEWER_KEYS.source),
  copyContent: defaultText(HISTORY_VIEWER_KEYS.copyContent),
  close: defaultText(HISTORY_VIEWER_KEYS.close),
  loadFailed: defaultText(HISTORY_VIEWER_KEYS.loadFailed),
  readOnlyNotice: defaultText(HISTORY_VIEWER_KEYS.readOnlyNotice),
} as const;
