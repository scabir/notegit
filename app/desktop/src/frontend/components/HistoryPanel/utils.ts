import { HISTORY_PANEL_TEXT } from "./constants";

export type RelativeTimeText = {
  justNow: string;
  minutesAgoTemplate: string;
  hoursAgoTemplate: string;
  yesterday: string;
  daysAgoTemplate: string;
};

const DEFAULT_RELATIVE_TIME_TEXT: RelativeTimeText = {
  justNow: HISTORY_PANEL_TEXT.relativeTime.justNow,
  minutesAgoTemplate: HISTORY_PANEL_TEXT.relativeTime.minutesAgoTemplate,
  hoursAgoTemplate: HISTORY_PANEL_TEXT.relativeTime.hoursAgoTemplate,
  yesterday: HISTORY_PANEL_TEXT.relativeTime.yesterday,
  daysAgoTemplate: HISTORY_PANEL_TEXT.relativeTime.daysAgoTemplate,
};

const template = (
  source: string,
  params: Record<string, string | number>,
): string => {
  return source.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? "" : String(value);
  });
};

export const formatRelativeDate = (
  date: Date | string,
  text: RelativeTimeText = DEFAULT_RELATIVE_TIME_TEXT,
): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes === 0
        ? text.justNow
        : template(text.minutesAgoTemplate, { count: minutes });
    }
    return template(text.hoursAgoTemplate, { count: hours });
  }
  if (days === 1) {
    return text.yesterday;
  }
  if (days < 7) {
    return template(text.daysAgoTemplate, { count: days });
  }
  return d.toLocaleDateString();
};

export const getFileName = (filePath: string | null): string => {
  if (!filePath) return "";
  return filePath.split("/").pop() || filePath;
};
