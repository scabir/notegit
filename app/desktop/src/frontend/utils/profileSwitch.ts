export interface ProfileSwitchConfirmationCopy {
  fallbackName: string;
  promptPrefix: string;
  restartSuffix: string;
}

export const confirmProfileSwitch = (
  profileName: string,
  confirmFn: (message: string) => boolean,
  copy: ProfileSwitchConfirmationCopy,
): boolean => {
  const displayName = profileName?.trim() ? profileName : copy.fallbackName;
  return confirmFn(
    `${copy.promptPrefix} "${displayName}"? ${copy.restartSuffix}`,
  );
};
