export const MOVE_DIALOG_TEXT = {
  title: "Move Item",
  movingLabel: "Moving",
  currentLocationLabel: "Current location",
  selectDestination: "Select destination folder:",
  rootLabel: "Root Directory",
  noFolders: "No folders in repository",
  cancel: "Cancel",
  confirm: "Move Here",
  rootFallback: "root",
} as const;

export const MOVE_DIALOG_ERRORS = {
  selectDestination: "Please select a destination folder",
  sameLocation: "Item is already in this location",
  duplicateItem: (name: string) =>
    `An item named "${name}" already exists in the destination folder`,
} as const;
