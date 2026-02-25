import enGbHistoryViewer from "../../i18n/en-GB/historyViewer.json";

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

export const HISTORY_VIEWER_TEXT = {
  readOnly: enGbHistoryViewer.readOnly,
  closeTooltip: enGbHistoryViewer.closeTooltip,
  preview: enGbHistoryViewer.preview,
  source: enGbHistoryViewer.source,
  copyContent: enGbHistoryViewer.copyContent,
  close: enGbHistoryViewer.close,
  loadFailed: enGbHistoryViewer.loadFailed,
  readOnlyNotice: enGbHistoryViewer.readOnlyNotice,
} as const;
