import { useCallback, useState } from 'react';

export function useDialogState() {
  const [createFileDialogOpen, setCreateFileDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const clearError = useCallback(() => {
    setErrorMessage('');
  }, []);

  const resetNameAndError = useCallback(() => {
    setNewItemName('');
    setErrorMessage('');
  }, []);

  const openCreateFileDialog = useCallback(() => {
    resetNameAndError();
    setCreateFileDialogOpen(true);
  }, [resetNameAndError]);

  const openCreateFolderDialog = useCallback(() => {
    resetNameAndError();
    setCreateFolderDialogOpen(true);
  }, [resetNameAndError]);

  const openRenameDialog = useCallback((currentName: string) => {
    setNewItemName(currentName);
    setErrorMessage('');
    setRenameDialogOpen(true);
  }, []);

  const openMoveDialog = useCallback(() => {
    setMoveDialogOpen(true);
  }, []);

  const closeCreateFileDialog = useCallback(() => {
    setCreateFileDialogOpen(false);
  }, []);

  const closeCreateFolderDialog = useCallback(() => {
    setCreateFolderDialogOpen(false);
  }, []);

  const closeRenameDialog = useCallback(() => {
    setRenameDialogOpen(false);
  }, []);

  const closeMoveDialog = useCallback(() => {
    setMoveDialogOpen(false);
  }, []);

  return {
    createFileDialogOpen,
    createFolderDialogOpen,
    renameDialogOpen,
    moveDialogOpen,
    newItemName,
    creating,
    errorMessage,
    setNewItemName,
    setCreating,
    setErrorMessage,
    clearError,
    resetNameAndError,
    openCreateFileDialog,
    openCreateFolderDialog,
    openRenameDialog,
    openMoveDialog,
    closeCreateFileDialog,
    closeCreateFolderDialog,
    closeRenameDialog,
    closeMoveDialog,
  };
}
