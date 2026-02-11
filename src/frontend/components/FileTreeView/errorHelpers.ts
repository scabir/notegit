import { FILE_TREE_MESSAGES } from './constants';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export const mapCreateItemError = (
  error: unknown,
  itemType: 'file' | 'folder',
  itemName: string,
  fallback: string
) => {
  const message = getErrorMessage(error, fallback);

  if (message.includes('exists') || message.includes('EEXIST')) {
    return itemType === 'file'
      ? FILE_TREE_MESSAGES.fileAlreadyExists(itemName)
      : FILE_TREE_MESSAGES.folderAlreadyExists(itemName);
  }

  if (message.includes('permission') || message.includes('EACCES')) {
    return itemType === 'file'
      ? FILE_TREE_MESSAGES.permissionDeniedCreateFile
      : FILE_TREE_MESSAGES.permissionDeniedCreateFolder;
  }

  return message;
};

export const mapRenameError = (error: unknown, itemType: 'file' | 'folder', fallback: string) => {
  const message = getErrorMessage(error, fallback);

  if (message.includes('already exists')) {
    return FILE_TREE_MESSAGES.renameAlreadyExists(itemType);
  }

  if (message.includes('permission')) {
    return FILE_TREE_MESSAGES.permissionDenied;
  }

  return message;
};

export const getOperationErrorMessage = (error: unknown) =>
  getErrorMessage(error, FILE_TREE_MESSAGES.unknownError);
