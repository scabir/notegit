import { getDefaultTranslation } from "../../i18n/defaultTranslations";

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

const defaultText = (key: string): string => getDefaultTranslation(key);

export const HISTORY_PANEL_TEXT = {
  title: defaultText(HISTORY_PANEL_KEYS.title),
  closeTooltip: defaultText(HISTORY_PANEL_KEYS.closeTooltip),
  selectFile: defaultText(HISTORY_PANEL_KEYS.selectFile),
  noCommits: defaultText(HISTORY_PANEL_KEYS.noCommits),
  loadFailed: defaultText(HISTORY_PANEL_KEYS.loadFailed),
  commitFoundSingularTemplate: defaultText(
    HISTORY_PANEL_KEYS.commitFoundSingularTemplate,
  ),
  commitFoundPluralTemplate: defaultText(
    HISTORY_PANEL_KEYS.commitFoundPluralTemplate,
  ),
  relativeTime: {
    justNow: defaultText(HISTORY_PANEL_KEYS.relativeTimeJustNow),
    minutesAgoTemplate: defaultText(
      HISTORY_PANEL_KEYS.relativeTimeMinutesAgoTemplate,
    ),
    hoursAgoTemplate: defaultText(
      HISTORY_PANEL_KEYS.relativeTimeHoursAgoTemplate,
    ),
    yesterday: defaultText(HISTORY_PANEL_KEYS.relativeTimeYesterday),
    daysAgoTemplate: defaultText(
      HISTORY_PANEL_KEYS.relativeTimeDaysAgoTemplate,
    ),
  },
} as const;
