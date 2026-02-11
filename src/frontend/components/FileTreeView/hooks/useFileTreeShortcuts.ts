import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

export type ShortcutHandlers = {
  openFileDialog: () => void;
  openFolderDialog: () => void;
  handleDelete: () => void;
  handleImportFile: () => void;
  handleOpenRenameDialog: () => void;
  handleOpenMoveDialog: () => void;
  handleToggleFavorite: () => void;
  handleCollapseAll: () => void;
  handleDuplicate?: () => void;
};

export function useFileTreeShortcuts(
  treeContainerRef: RefObject<HTMLDivElement>,
  handlers: ShortcutHandlers,
  enabled = true
) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      const container = treeContainerRef.current;
      if (container && event.target instanceof Node && !container.contains(event.target)) {
        return;
      }

      const {
        openFileDialog,
        openFolderDialog,
        handleDelete,
        handleImportFile,
        handleOpenRenameDialog,
        handleOpenMoveDialog,
        handleToggleFavorite,
        handleCollapseAll,
        handleDuplicate,
      } = handlersRef.current;
      const mod = event.metaKey || event.ctrlKey;
      const shift = event.shiftKey;
      const key = event.key;

      if (mod && key.toLowerCase() === 'a') {
        event.preventDefault();
        openFileDialog();
        return;
      }

      if (mod && key.toLowerCase() === 'd') {
        event.preventDefault();
        openFolderDialog();
        return;
      }

      if (mod && key.toLowerCase() === 'i') {
        event.preventDefault();
        handleImportFile();
        return;
      }

      if ((mod && key.toLowerCase() === 'r') || key === 'F2') {
        event.preventDefault();
        handleOpenRenameDialog();
        return;
      }

      if (mod && key.toLowerCase() === 'm') {
        event.preventDefault();
        handleOpenMoveDialog();
        return;
      }

      if (mod && shift && key.toLowerCase() === 's') {
        event.preventDefault();
        handleToggleFavorite();
        return;
      }

      if (mod && shift && key.toLowerCase() === 'e') {
        event.preventDefault();
        handleCollapseAll();
        return;
      }

      if (mod && shift && key.toLowerCase() === 'u' && handleDuplicate) {
        event.preventDefault();
        handleDuplicate();
        return;
      }

      if (key === 'Delete' || (mod && key === 'Backspace')) {
        event.preventDefault();
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, treeContainerRef]);
}
