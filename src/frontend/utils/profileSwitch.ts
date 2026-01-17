export const confirmProfileSwitch = (
  profileName: string,
  confirmFn: (message: string) => boolean
): boolean => {
  const displayName = profileName?.trim() ? profileName : 'this profile';
  return confirmFn(`Switch to "${displayName}"? The app will restart.`);
};
