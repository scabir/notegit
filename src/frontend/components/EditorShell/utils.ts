import { PROFILE_NAME_LIMIT } from './constants';

export const truncateProfileName = (name: string, limit: number = PROFILE_NAME_LIMIT): string => {
  if (name.length <= limit) {
    return name;
  }
  return name.substring(0, limit) + '...';
};

export const buildHeaderTitle = (
  activeProfileName: string,
): string => {
  if (activeProfileName) {
    return truncateProfileName(activeProfileName);
  }
  return '';
};
