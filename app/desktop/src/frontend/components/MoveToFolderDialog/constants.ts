import { getDefaultTranslation } from "../../i18n/defaultTranslations";

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

const defaultText = (key: string): string => getDefaultTranslation(key);

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
  title: defaultText(MOVE_DIALOG_KEYS.title),
  movingLabel: defaultText(MOVE_DIALOG_KEYS.movingLabel),
  currentLocationLabel: defaultText(MOVE_DIALOG_KEYS.currentLocationLabel),
  selectDestination: defaultText(MOVE_DIALOG_KEYS.selectDestination),
  rootLabel: defaultText(MOVE_DIALOG_KEYS.rootLabel),
  noFolders: defaultText(MOVE_DIALOG_KEYS.noFolders),
  cancel: defaultText(MOVE_DIALOG_KEYS.cancel),
  confirm: defaultText(MOVE_DIALOG_KEYS.confirm),
  rootFallback: defaultText(MOVE_DIALOG_KEYS.rootFallback),
} as const;

export const MOVE_DIALOG_ERRORS = {
  selectDestination: defaultText(MOVE_DIALOG_KEYS.errorSelectDestination),
  sameLocation: defaultText(MOVE_DIALOG_KEYS.errorSameLocation),
  duplicateItem: (name: string) =>
    template(defaultText(MOVE_DIALOG_KEYS.errorDuplicateItemTemplate), {
      name,
    }),
} as const;
