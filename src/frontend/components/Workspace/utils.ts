import { PROFILE_NAME_LIMIT, WORKSPACE_TEXT } from './constants';

export const truncateProfileName = (name: string, limit: number = PROFILE_NAME_LIMIT): string => {
  if (name.length <= limit) {
    return name;
  }
  return name.substring(0, limit) + '...';
};

export const buildHeaderTitle = (
  activeProfileName: string,
  appVersion: string,
): string => {
  let title = WORKSPACE_TEXT.appName;
  if (activeProfileName) {
    title += ` - ${truncateProfileName(activeProfileName)}`;
  }
  if (appVersion) {
    title += ` - ${appVersion}`;
  }
  return title;
};
