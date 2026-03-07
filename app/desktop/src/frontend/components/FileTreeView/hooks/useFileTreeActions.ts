import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { FileTreeNode } from "../../../../shared/types";
import { INVALID_NAME_CHARS } from "../constants";
import {
  mapCreateItemError,
  mapRenameError,
  getOperationErrorMessage,
} from "../errorHelpers";
import {
  resolveImportTargetPath,
  resolveParentDestination,
} from "../pathResolvers";
import { normalizeName } from "../utils";

type UseFileTreeActionsParams = {
  tree: FileTreeNode[];
  selectedNode: FileTreeNode | null;
  selectedNodeForActions: FileTreeNode | null;
  isS3Repo: boolean;
  onCreateFile: (parentPath: string, fileName: string) => Promise<void>;
  onCreateFolder: (parentPath: string, folderName: string) => Promise<void>;
  onDelete: (path: string) => Promise<void>;
  onRename: (oldPath: string, newPath: string) => Promise<void>;
  onImport: (sourcePath: string, targetPath: string) => Promise<void>;
  updateFavoritesForPathChange: (oldPath: string, newPath: string) => void;
  removeFavoritesUnderPath: (pathToRemove: string) => void;
  setSelectedNode: (node: FileTreeNode | null) => void;
  setExpanded: Dispatch<SetStateAction<string[]>>;
  newItemName: string;
  setNewItemName: (value: string) => void;
  setCreating: (value: boolean) => void;
  setErrorMessage: (value: string) => void;
  openRenameDialog: (currentName: string) => void;
  openMoveDialog: () => void;
  closeCreateFileDialog: () => void;
  closeCreateFolderDialog: () => void;
  closeRenameDialog: () => void;
  closeMoveDialog: () => void;
  messages: {
    invalidFileName: string;
    invalidFolderName: string;
    invalidRenameName: string;
    emptyName: string;
    fileAlreadyExists: (name: string) => string;
    folderAlreadyExists: (name: string) => string;
    permissionDeniedCreateFile: string;
    permissionDeniedCreateFolder: string;
    permissionDenied: string;
    failedCreateFile: string;
    failedCreateFolder: string;
    failedRename: string;
    dialogApiNotAvailable: string;
    importDialogTitle: string;
    importedFileNameFallback: string;
    unknownError: string;
    renameAlreadyExists: (itemType: "file" | "folder") => string;
    deleteConfirmation: (
      itemType: "folder" | "file",
      name: string,
      isFolder: boolean,
    ) => string;
    failedDeletePrefix: string;
    failedImportPrefix: string;
    failedMovePrefix: string;
  };
};

export function useFileTreeActions({
  tree,
  selectedNode,
  selectedNodeForActions,
  isS3Repo,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onRename,
  onImport,
  updateFavoritesForPathChange,
  removeFavoritesUnderPath,
  setSelectedNode,
  setExpanded,
  newItemName,
  setNewItemName,
  setCreating,
  setErrorMessage,
  openRenameDialog,
  openMoveDialog,
  closeCreateFileDialog,
  closeCreateFolderDialog,
  closeRenameDialog,
  closeMoveDialog,
  messages,
}: UseFileTreeActionsParams) {
  const handleOpenRenameDialog = useCallback(
    (node?: FileTreeNode) => {
      const targetNode = node ?? selectedNodeForActions;
      if (!targetNode) return;

      setSelectedNode(targetNode);
      openRenameDialog(targetNode.name);
    },
    [openRenameDialog, selectedNodeForActions, setSelectedNode],
  );

  const handleOpenMoveDialog = useCallback(
    (node?: FileTreeNode) => {
      const targetNode = node ?? selectedNodeForActions;
      if (!targetNode) return;

      setSelectedNode(targetNode);
      openMoveDialog();
    },
    [openMoveDialog, selectedNodeForActions, setSelectedNode],
  );

  const handleCreateFile = useCallback(async () => {
    const trimmedName = newItemName.trim();
    if (!trimmedName) return;

    let fileName = normalizeName(trimmedName, isS3Repo);
    if (!fileName.includes(".")) {
      fileName = `${fileName}.md`;
    }

    if (INVALID_NAME_CHARS.test(fileName)) {
      setErrorMessage(messages.invalidFileName);
      return;
    }

    setCreating(true);
    setErrorMessage("");

    try {
      const { parentPath, parentNodeId } = resolveParentDestination(
        selectedNode,
        tree,
      );

      await onCreateFile(parentPath, fileName);

      if (parentNodeId) {
        setExpanded((prev) =>
          prev.includes(parentNodeId) ? prev : [...prev, parentNodeId],
        );
      }

      closeCreateFileDialog();
      setNewItemName("");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        mapCreateItemError(
          error,
          "file",
          fileName,
          messages.failedCreateFile,
          messages,
        ),
      );
      console.error("Failed to create file:", error);
    } finally {
      setCreating(false);
    }
  }, [
    closeCreateFileDialog,
    isS3Repo,
    messages,
    newItemName,
    onCreateFile,
    selectedNode,
    setCreating,
    setErrorMessage,
    setExpanded,
    setNewItemName,
    tree,
  ]);

  const handleCreateFolder = useCallback(async () => {
    const trimmedName = newItemName.trim();
    if (!trimmedName) return;

    const folderName = normalizeName(trimmedName, isS3Repo);
    if (INVALID_NAME_CHARS.test(folderName)) {
      setErrorMessage(messages.invalidFolderName);
      return;
    }

    setCreating(true);
    setErrorMessage("");

    try {
      const { parentPath, parentNodeId } = resolveParentDestination(
        selectedNode,
        tree,
      );

      await onCreateFolder(parentPath, folderName);

      if (parentNodeId) {
        setExpanded((prev) =>
          prev.includes(parentNodeId) ? prev : [...prev, parentNodeId],
        );
      }

      closeCreateFolderDialog();
      setNewItemName("");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        mapCreateItemError(
          error,
          "folder",
          folderName,
          messages.failedCreateFolder,
          messages,
        ),
      );
      console.error("Failed to create folder:", error);
    } finally {
      setCreating(false);
    }
  }, [
    closeCreateFolderDialog,
    isS3Repo,
    messages,
    newItemName,
    onCreateFolder,
    selectedNode,
    setCreating,
    setErrorMessage,
    setExpanded,
    setNewItemName,
    tree,
  ]);

  const handleRename = useCallback(async () => {
    if (!selectedNode) return;

    const trimmedName = newItemName.trim();
    if (!trimmedName) {
      setErrorMessage(messages.emptyName);
      return;
    }

    const normalizedName = normalizeName(trimmedName, isS3Repo);
    if (INVALID_NAME_CHARS.test(normalizedName)) {
      setErrorMessage(messages.invalidRenameName);
      return;
    }

    if (normalizedName === selectedNode.name) {
      closeRenameDialog();
      return;
    }

    setCreating(true);
    setErrorMessage("");

    try {
      const oldPath = selectedNode.path;
      const lastSlash = oldPath.lastIndexOf("/");
      const parentPath = lastSlash > 0 ? oldPath.substring(0, lastSlash) : "";
      const newPath = parentPath
        ? `${parentPath}/${normalizedName}`
        : normalizedName;

      await onRename(oldPath, newPath);
      updateFavoritesForPathChange(oldPath, newPath);

      closeRenameDialog();
      setNewItemName("");
      setErrorMessage("");
    } catch (error) {
      console.error("Failed to rename:", error);
      setErrorMessage(
        mapRenameError(
          error,
          selectedNode.type,
          messages.failedRename,
          messages,
        ),
      );
    } finally {
      setCreating(false);
    }
  }, [
    closeRenameDialog,
    isS3Repo,
    messages,
    newItemName,
    onRename,
    selectedNode,
    setCreating,
    setErrorMessage,
    setNewItemName,
    updateFavoritesForPathChange,
  ]);

  const handleDelete = useCallback(
    async (node?: FileTreeNode) => {
      const targetNode = node ?? selectedNodeForActions;
      if (!targetNode) return;

      const itemType = targetNode.type === "folder" ? "folder" : "file";
      const message = messages.deleteConfirmation(
        itemType,
        targetNode.name,
        targetNode.type === "folder",
      );

      if (window.confirm(message)) {
        try {
          await onDelete(targetNode.path);
          removeFavoritesUnderPath(targetNode.path);
          setSelectedNode(null);
        } catch (error) {
          console.error("Failed to delete:", error);
          alert(
            `${messages.failedDeletePrefix} ${itemType}: ${getOperationErrorMessage(error, messages.unknownError)}`,
          );
        }
      }
    },
    [
      messages,
      onDelete,
      removeFavoritesUnderPath,
      selectedNodeForActions,
      setSelectedNode,
    ],
  );

  const handleImportFile = useCallback(async () => {
    try {
      if (!window.notegitApi.dialog) {
        alert(messages.dialogApiNotAvailable);
        return;
      }

      const result = await window.notegitApi.dialog.showOpenDialog({
        properties: ["openFile"],
        title: messages.importDialogTitle,
      });

      if (result.canceled || result.filePaths.length === 0) {
        return;
      }

      const sourcePath = result.filePaths[0];
      const targetPath = resolveImportTargetPath(
        sourcePath,
        selectedNodeForActions,
        isS3Repo,
        messages.importedFileNameFallback,
      );

      await onImport(sourcePath, targetPath);
    } catch (error) {
      console.error("Failed to import file:", error);
      alert(
        `${messages.failedImportPrefix}: ${getOperationErrorMessage(error, messages.unknownError)}`,
      );
    }
  }, [isS3Repo, messages, onImport, selectedNodeForActions]);

  const handleMoveToFolder = useCallback(
    async (destinationPath: string) => {
      if (!selectedNode) return;

      try {
        const oldPath = selectedNode.path;
        const newPath = destinationPath
          ? `${destinationPath}/${selectedNode.name}`
          : selectedNode.name;

        await onRename(selectedNode.path, newPath);
        updateFavoritesForPathChange(oldPath, newPath);

        closeMoveDialog();
      } catch (error) {
        console.error("Failed to move:", error);
        alert(
          `${messages.failedMovePrefix}: ${getOperationErrorMessage(error, messages.unknownError)}`,
        );
      }
    },
    [
      closeMoveDialog,
      messages,
      onRename,
      selectedNode,
      updateFavoritesForPathChange,
    ],
  );

  return {
    handleOpenRenameDialog,
    handleOpenMoveDialog,
    handleCreateFile,
    handleCreateFolder,
    handleRename,
    handleDelete,
    handleImportFile,
    handleMoveToFolder,
  };
}
