const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

type FileTreeMessages = {
  fileAlreadyExists: (name: string) => string;
  folderAlreadyExists: (name: string) => string;
  permissionDeniedCreateFile: string;
  permissionDeniedCreateFolder: string;
  permissionDenied: string;
  renameAlreadyExists: (itemType: "file" | "folder") => string;
  unknownError: string;
};

export const mapCreateItemError = (
  error: unknown,
  itemType: "file" | "folder",
  itemName: string,
  fallback: string,
  messages: FileTreeMessages,
) => {
  const message = getErrorMessage(error, fallback);

  if (message.includes("exists") || message.includes("EEXIST")) {
    return itemType === "file"
      ? messages.fileAlreadyExists(itemName)
      : messages.folderAlreadyExists(itemName);
  }

  if (message.includes("permission") || message.includes("EACCES")) {
    return itemType === "file"
      ? messages.permissionDeniedCreateFile
      : messages.permissionDeniedCreateFolder;
  }

  return message;
};

export const mapRenameError = (
  error: unknown,
  itemType: "file" | "folder",
  fallback: string,
  messages: FileTreeMessages,
) => {
  const message = getErrorMessage(error, fallback);

  if (message.includes("already exists")) {
    return messages.renameAlreadyExists(itemType);
  }

  if (message.includes("permission")) {
    return messages.permissionDenied;
  }

  return message;
};

export const getOperationErrorMessage = (
  error: unknown,
  unknownErrorMessage: string,
) => getErrorMessage(error, unknownErrorMessage);
