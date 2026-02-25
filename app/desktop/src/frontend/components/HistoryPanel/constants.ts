import enGbHistoryPanel from "../../i18n/en-GB/historyPanel.json";

export const HISTORY_PANEL_KEYS = {
  title: "historyPanel.title",
  closeTooltip: "historyPanel.closeTooltip",
  selectFile: "historyPanel.selectFile",
  noCommits: "historyPanel.noCommits",
  loadFailed: "historyPanel.loadFailed",
  commitFoundSingularTemplate: "historyPanel.commitFoundSingularTemplate",
  commitFoundPluralTemplate: "historyPanel.commitFoundPluralTemplate",
  relativeTimeJustNow: "historyPanel.relativeTime.justNow",
  relativeTimeMinutesAgoTemplate:
    "historyPanel.relativeTime.minutesAgoTemplate",
  relativeTimeHoursAgoTemplate: "historyPanel.relativeTime.hoursAgoTemplate",
  relativeTimeYesterday: "historyPanel.relativeTime.yesterday",
  relativeTimeDaysAgoTemplate: "historyPanel.relativeTime.daysAgoTemplate",
} as const;

export const HISTORY_PANEL_TEXT = {
  title: enGbHistoryPanel.title,
  closeTooltip: enGbHistoryPanel.closeTooltip,
  selectFile: enGbHistoryPanel.selectFile,
  noCommits: enGbHistoryPanel.noCommits,
  loadFailed: enGbHistoryPanel.loadFailed,
  commitFoundSingularTemplate: enGbHistoryPanel.commitFoundSingularTemplate,
  commitFoundPluralTemplate: enGbHistoryPanel.commitFoundPluralTemplate,
  relativeTime: {
    justNow: enGbHistoryPanel.relativeTime.justNow,
    minutesAgoTemplate: enGbHistoryPanel.relativeTime.minutesAgoTemplate,
    hoursAgoTemplate: enGbHistoryPanel.relativeTime.hoursAgoTemplate,
    yesterday: enGbHistoryPanel.relativeTime.yesterday,
    daysAgoTemplate: enGbHistoryPanel.relativeTime.daysAgoTemplate,
  },
} as const;
