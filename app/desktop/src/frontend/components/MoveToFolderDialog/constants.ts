import enGbMoveToFolderDialog from "../../i18n/en-GB/moveToFolderDialog.json";

type TranslateFn = (key: string) => string;

const template = (
  source: string,
  params: Record<string, string | number>,
): string => {
  return source.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? "" : String(value);
  });
};

export const MOVE_DIALOG_KEYS = {
  title: "moveToFolderDialog.title",
  movingLabel: "moveToFolderDialog.movingLabel",
  currentLocationLabel: "moveToFolderDialog.currentLocationLabel",
  selectDestination: "moveToFolderDialog.selectDestination",
  rootLabel: "moveToFolderDialog.rootLabel",
  noFolders: "moveToFolderDialog.noFolders",
  cancel: "moveToFolderDialog.cancel",
  confirm: "moveToFolderDialog.confirm",
  rootFallback: "moveToFolderDialog.rootFallback",
  errorSelectDestination: "moveToFolderDialog.errors.selectDestination",
  errorSameLocation: "moveToFolderDialog.errors.sameLocation",
  errorDuplicateItemTemplate: "moveToFolderDialog.errors.duplicateItemTemplate",
} as const;

export const buildMoveDialogText = (t: TranslateFn) => ({
  title: t(MOVE_DIALOG_KEYS.title),
  movingLabel: t(MOVE_DIALOG_KEYS.movingLabel),
  currentLocationLabel: t(MOVE_DIALOG_KEYS.currentLocationLabel),
  selectDestination: t(MOVE_DIALOG_KEYS.selectDestination),
  rootLabel: t(MOVE_DIALOG_KEYS.rootLabel),
  noFolders: t(MOVE_DIALOG_KEYS.noFolders),
  cancel: t(MOVE_DIALOG_KEYS.cancel),
  confirm: t(MOVE_DIALOG_KEYS.confirm),
  rootFallback: t(MOVE_DIALOG_KEYS.rootFallback),
});

export const buildMoveDialogErrors = (t: TranslateFn) => {
  const duplicateItemTemplate = t(MOVE_DIALOG_KEYS.errorDuplicateItemTemplate);
  return {
    selectDestination: t(MOVE_DIALOG_KEYS.errorSelectDestination),
    sameLocation: t(MOVE_DIALOG_KEYS.errorSameLocation),
    duplicateItem: (name: string) =>
      template(duplicateItemTemplate, {
        name,
      }),
  };
};

export const MOVE_DIALOG_TEXT = {
  title: enGbMoveToFolderDialog.title,
  movingLabel: enGbMoveToFolderDialog.movingLabel,
  currentLocationLabel: enGbMoveToFolderDialog.currentLocationLabel,
  selectDestination: enGbMoveToFolderDialog.selectDestination,
  rootLabel: enGbMoveToFolderDialog.rootLabel,
  noFolders: enGbMoveToFolderDialog.noFolders,
  cancel: enGbMoveToFolderDialog.cancel,
  confirm: enGbMoveToFolderDialog.confirm,
  rootFallback: enGbMoveToFolderDialog.rootFallback,
} as const;

export const MOVE_DIALOG_ERRORS = {
  selectDestination: enGbMoveToFolderDialog.errors.selectDestination,
  sameLocation: enGbMoveToFolderDialog.errors.sameLocation,
  duplicateItem: (name: string) =>
    template(enGbMoveToFolderDialog.errors.duplicateItemTemplate, {
      name,
    }),
} as const;
