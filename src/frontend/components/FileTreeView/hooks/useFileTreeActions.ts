import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { FileTreeNode } from "../../../../shared/types";
import { FILE_TREE_MESSAGES, INVALID_NAME_CHARS } from "../constants";
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
      setErrorMessage(FILE_TREE_MESSAGES.invalidFileName);
      return;
    }

    setCreating(true);
    setErrorMessage("");

    try {
      const { parentPath, parentNodeId } = resolveParentDestination(
        selectedNodeForActions,
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
          FILE_TREE_MESSAGES.failedCreateFile,
        ),
      );
      console.error("Failed to create file:", error);
    } finally {
      setCreating(false);
    }
  }, [
    closeCreateFileDialog,
    isS3Repo,
    newItemName,
    onCreateFile,
    selectedNodeForActions,
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
      setErrorMessage(FILE_TREE_MESSAGES.invalidFolderName);
      return;
    }

    setCreating(true);
    setErrorMessage("");

    try {
      const { parentPath, parentNodeId } = resolveParentDestination(
        selectedNodeForActions,
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
          FILE_TREE_MESSAGES.failedCreateFolder,
        ),
      );
      console.error("Failed to create folder:", error);
    } finally {
      setCreating(false);
    }
  }, [
    closeCreateFolderDialog,
    isS3Repo,
    newItemName,
    onCreateFolder,
    selectedNodeForActions,
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
      setErrorMessage(FILE_TREE_MESSAGES.emptyName);
      return;
    }

    const normalizedName = normalizeName(trimmedName, isS3Repo);
    if (INVALID_NAME_CHARS.test(normalizedName)) {
      setErrorMessage(FILE_TREE_MESSAGES.invalidRenameName);
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
          FILE_TREE_MESSAGES.failedRename,
        ),
      );
    } finally {
      setCreating(false);
    }
  }, [
    closeRenameDialog,
    isS3Repo,
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
      const message = FILE_TREE_MESSAGES.deleteConfirmation(
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
            `${FILE_TREE_MESSAGES.failedDeletePrefix} ${itemType}: ${getOperationErrorMessage(error)}`,
          );
        }
      }
    },
    [
      onDelete,
      removeFavoritesUnderPath,
      selectedNodeForActions,
      setSelectedNode,
    ],
  );

  const handleImportFile = useCallback(async () => {
    try {
      if (!window.notegitApi.dialog) {
        alert(FILE_TREE_MESSAGES.dialogApiNotAvailable);
        return;
      }

      const result = await window.notegitApi.dialog.showOpenDialog({
        properties: ["openFile"],
        title: FILE_TREE_MESSAGES.importDialogTitle,
      });

      if (result.canceled || result.filePaths.length === 0) {
        return;
      }

      const sourcePath = result.filePaths[0];
      const targetPath = resolveImportTargetPath(
        sourcePath,
        selectedNodeForActions,
        isS3Repo,
        FILE_TREE_MESSAGES.importedFileNameFallback,
      );

      await onImport(sourcePath, targetPath);
    } catch (error) {
      console.error("Failed to import file:", error);
      alert(
        `${FILE_TREE_MESSAGES.failedImportPrefix}: ${getOperationErrorMessage(error)}`,
      );
    }
  }, [isS3Repo, onImport, selectedNodeForActions]);

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
          `${FILE_TREE_MESSAGES.failedMovePrefix}: ${getOperationErrorMessage(error)}`,
        );
      }
    },
    [closeMoveDialog, onRename, selectedNode, updateFavoritesForPathChange],
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
