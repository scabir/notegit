import enGbFileTreeView from "../../i18n/en-GB/fileTreeView.json";

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

export const FILE_TREE_KEYS = {
  text: {
    newFile: "fileTreeView.text.newFile",
    newFolder: "fileTreeView.text.newFolder",
    importFile: "fileTreeView.text.importFile",
    collapseAll: "fileTreeView.text.collapseAll",
    rename: "fileTreeView.text.rename",
    delete: "fileTreeView.text.delete",
    duplicate: "fileTreeView.text.duplicate",
    moveToFolder: "fileTreeView.text.moveToFolder",
    createFileTitle: "fileTreeView.text.createFileTitle",
    createFolderTitle: "fileTreeView.text.createFolderTitle",
    renameFileTitle: "fileTreeView.text.renameFileTitle",
    renameFolderTitle: "fileTreeView.text.renameFolderTitle",
    fileNameLabel: "fileTreeView.text.fileNameLabel",
    folderNameLabel: "fileTreeView.text.folderNameLabel",
    newNameLabel: "fileTreeView.text.newNameLabel",
    filePlaceholder: "fileTreeView.text.filePlaceholder",
    folderPlaceholder: "fileTreeView.text.folderPlaceholder",
    fileExtensionHint: "fileTreeView.text.fileExtensionHint",
    createLocationRoot: "fileTreeView.text.createLocationRoot",
    createLocationPrefix: "fileTreeView.text.createLocationPrefix",
    cancel: "fileTreeView.text.cancel",
    create: "fileTreeView.text.create",
    creating: "fileTreeView.text.creating",
    renameAction: "fileTreeView.text.renameAction",
    renaming: "fileTreeView.text.renaming",
    favoritesTitle: "fileTreeView.text.favoritesTitle",
    addToFavorites: "fileTreeView.text.addToFavorites",
    removeFromFavorites: "fileTreeView.text.removeFromFavorites",
    favoritesContextMenuItem: "fileTreeView.text.favoritesContextMenuItem",
  },
  messages: {
    invalidFileName: "fileTreeView.messages.invalidFileName",
    invalidFolderName: "fileTreeView.messages.invalidFolderName",
    invalidRenameName: "fileTreeView.messages.invalidRenameName",
    emptyName: "fileTreeView.messages.emptyName",
    fileAlreadyExistsTemplate:
      "fileTreeView.messages.fileAlreadyExistsTemplate",
    folderAlreadyExistsTemplate:
      "fileTreeView.messages.folderAlreadyExistsTemplate",
    permissionDeniedCreateFile:
      "fileTreeView.messages.permissionDeniedCreateFile",
    permissionDeniedCreateFolder:
      "fileTreeView.messages.permissionDeniedCreateFolder",
    permissionDenied: "fileTreeView.messages.permissionDenied",
    failedCreateFile: "fileTreeView.messages.failedCreateFile",
    failedCreateFolder: "fileTreeView.messages.failedCreateFolder",
    failedRename: "fileTreeView.messages.failedRename",
    dialogApiNotAvailable: "fileTreeView.messages.dialogApiNotAvailable",
    importDialogTitle: "fileTreeView.messages.importDialogTitle",
    importedFileNameFallback: "fileTreeView.messages.importedFileNameFallback",
    unknownError: "fileTreeView.messages.unknownError",
    renameAlreadyExistsTemplate:
      "fileTreeView.messages.renameAlreadyExistsTemplate",
    deleteConfirmationTemplate:
      "fileTreeView.messages.deleteConfirmationTemplate",
    deleteConfirmationFolderExtra:
      "fileTreeView.messages.deleteConfirmationFolderExtra",
    failedDeletePrefix: "fileTreeView.messages.failedDeletePrefix",
    failedImportPrefix: "fileTreeView.messages.failedImportPrefix",
    failedMovePrefix: "fileTreeView.messages.failedMovePrefix",
  },
} as const;

export const buildFileTreeText = (t: TranslateFn) => ({
  newFile: t(FILE_TREE_KEYS.text.newFile),
  newFolder: t(FILE_TREE_KEYS.text.newFolder),
  importFile: t(FILE_TREE_KEYS.text.importFile),
  collapseAll: t(FILE_TREE_KEYS.text.collapseAll),
  rename: t(FILE_TREE_KEYS.text.rename),
  delete: t(FILE_TREE_KEYS.text.delete),
  duplicate: t(FILE_TREE_KEYS.text.duplicate),
  moveToFolder: t(FILE_TREE_KEYS.text.moveToFolder),
  createFileTitle: t(FILE_TREE_KEYS.text.createFileTitle),
  createFolderTitle: t(FILE_TREE_KEYS.text.createFolderTitle),
  renameFileTitle: t(FILE_TREE_KEYS.text.renameFileTitle),
  renameFolderTitle: t(FILE_TREE_KEYS.text.renameFolderTitle),
  fileNameLabel: t(FILE_TREE_KEYS.text.fileNameLabel),
  folderNameLabel: t(FILE_TREE_KEYS.text.folderNameLabel),
  newNameLabel: t(FILE_TREE_KEYS.text.newNameLabel),
  filePlaceholder: t(FILE_TREE_KEYS.text.filePlaceholder),
  folderPlaceholder: t(FILE_TREE_KEYS.text.folderPlaceholder),
  fileExtensionHint: t(FILE_TREE_KEYS.text.fileExtensionHint),
  createLocationRoot: t(FILE_TREE_KEYS.text.createLocationRoot),
  createLocationPrefix: t(FILE_TREE_KEYS.text.createLocationPrefix),
  cancel: t(FILE_TREE_KEYS.text.cancel),
  create: t(FILE_TREE_KEYS.text.create),
  creating: t(FILE_TREE_KEYS.text.creating),
  renameAction: t(FILE_TREE_KEYS.text.renameAction),
  renaming: t(FILE_TREE_KEYS.text.renaming),
  favoritesTitle: t(FILE_TREE_KEYS.text.favoritesTitle),
  addToFavorites: t(FILE_TREE_KEYS.text.addToFavorites),
  removeFromFavorites: t(FILE_TREE_KEYS.text.removeFromFavorites),
  favoritesContextMenuItem: t(FILE_TREE_KEYS.text.favoritesContextMenuItem),
});

export const buildFileTreeMessages = (t: TranslateFn) => {
  const fileAlreadyExistsTemplate = t(
    FILE_TREE_KEYS.messages.fileAlreadyExistsTemplate,
  );
  const folderAlreadyExistsTemplate = t(
    FILE_TREE_KEYS.messages.folderAlreadyExistsTemplate,
  );
  const renameAlreadyExistsTemplate = t(
    FILE_TREE_KEYS.messages.renameAlreadyExistsTemplate,
  );
  const deleteConfirmationTemplate = t(
    FILE_TREE_KEYS.messages.deleteConfirmationTemplate,
  );
  const deleteConfirmationFolderExtra = t(
    FILE_TREE_KEYS.messages.deleteConfirmationFolderExtra,
  );

  return {
    invalidFileName: t(FILE_TREE_KEYS.messages.invalidFileName),
    invalidFolderName: t(FILE_TREE_KEYS.messages.invalidFolderName),
    invalidRenameName: t(FILE_TREE_KEYS.messages.invalidRenameName),
    emptyName: t(FILE_TREE_KEYS.messages.emptyName),
    fileAlreadyExists: (name: string) =>
      template(fileAlreadyExistsTemplate, { name }),
    folderAlreadyExists: (name: string) =>
      template(folderAlreadyExistsTemplate, { name }),
    permissionDeniedCreateFile: t(
      FILE_TREE_KEYS.messages.permissionDeniedCreateFile,
    ),
    permissionDeniedCreateFolder: t(
      FILE_TREE_KEYS.messages.permissionDeniedCreateFolder,
    ),
    permissionDenied: t(FILE_TREE_KEYS.messages.permissionDenied),
    failedCreateFile: t(FILE_TREE_KEYS.messages.failedCreateFile),
    failedCreateFolder: t(FILE_TREE_KEYS.messages.failedCreateFolder),
    failedRename: t(FILE_TREE_KEYS.messages.failedRename),
    dialogApiNotAvailable: t(FILE_TREE_KEYS.messages.dialogApiNotAvailable),
    importDialogTitle: t(FILE_TREE_KEYS.messages.importDialogTitle),
    importedFileNameFallback: t(
      FILE_TREE_KEYS.messages.importedFileNameFallback,
    ),
    unknownError: t(FILE_TREE_KEYS.messages.unknownError),
    renameAlreadyExists: (itemType: "file" | "folder") =>
      template(renameAlreadyExistsTemplate, { itemType }),
    deleteConfirmation: (
      itemType: "folder" | "file",
      name: string,
      isFolder: boolean,
    ) =>
      template(deleteConfirmationTemplate, {
        itemType,
        name,
        extra: isFolder ? deleteConfirmationFolderExtra : "",
      }),
    failedDeletePrefix: t(FILE_TREE_KEYS.messages.failedDeletePrefix),
    failedImportPrefix: t(FILE_TREE_KEYS.messages.failedImportPrefix),
    failedMovePrefix: t(FILE_TREE_KEYS.messages.failedMovePrefix),
  };
};

export const FILE_TREE_TEXT = { ...enGbFileTreeView.text };

const enGbMessages = enGbFileTreeView.messages;
export const FILE_TREE_MESSAGES = {
  invalidFileName: enGbMessages.invalidFileName,
  invalidFolderName: enGbMessages.invalidFolderName,
  invalidRenameName: enGbMessages.invalidRenameName,
  emptyName: enGbMessages.emptyName,
  fileAlreadyExists: (name: string) =>
    template(enGbMessages.fileAlreadyExistsTemplate, { name }),
  folderAlreadyExists: (name: string) =>
    template(enGbMessages.folderAlreadyExistsTemplate, { name }),
  permissionDeniedCreateFile: enGbMessages.permissionDeniedCreateFile,
  permissionDeniedCreateFolder: enGbMessages.permissionDeniedCreateFolder,
  permissionDenied: enGbMessages.permissionDenied,
  failedCreateFile: enGbMessages.failedCreateFile,
  failedCreateFolder: enGbMessages.failedCreateFolder,
  failedRename: enGbMessages.failedRename,
  dialogApiNotAvailable: enGbMessages.dialogApiNotAvailable,
  importDialogTitle: enGbMessages.importDialogTitle,
  importedFileNameFallback: enGbMessages.importedFileNameFallback,
  unknownError: enGbMessages.unknownError,
  renameAlreadyExists: (itemType: "file" | "folder") =>
    template(enGbMessages.renameAlreadyExistsTemplate, { itemType }),
  deleteConfirmation: (
    itemType: "folder" | "file",
    name: string,
    isFolder: boolean,
  ) =>
    template(enGbMessages.deleteConfirmationTemplate, {
      itemType,
      name,
      extra: isFolder ? enGbMessages.deleteConfirmationFolderExtra : "",
    }),
  failedDeletePrefix: enGbMessages.failedDeletePrefix,
  failedImportPrefix: enGbMessages.failedImportPrefix,
  failedMovePrefix: enGbMessages.failedMovePrefix,
};

export const INVALID_NAME_CHARS = /[<>:"/\\|?*]/;
export const FAVORITES_STORAGE_KEY = "notegit-tree-favorites";
