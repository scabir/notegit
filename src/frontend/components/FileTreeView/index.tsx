import React, { useRef, useState } from 'react';
import { TreeView } from '@mui/x-tree-view';
import { Box } from '@mui/material';
import { Star as FavoriteIcon } from '@mui/icons-material';
import type { FileTreeNode } from '../../../shared/types';
import { FILE_TREE_TEXT, FILE_TREE_MESSAGES, INVALID_NAME_CHARS } from './constants';
import { rootSx, treeContainerSx, treeItemLabelSx } from './styles';
import { normalizeName, findNode, findNodeByPath } from './utils';
import type { FileTreeViewProps } from './types';
import { FileTreeToolbar } from '../FileTreeToolbar';
import { FavoritesBar } from '../FileTreeFavoritesBar';
import { FileTreeContextMenus } from '../FileTreeContextMenus';
import type { ContextMenuItem } from '../FileTreeContextMenus/types';
import { renderTreeItems } from '../FileTreeRenderer';
import { FileTreeDialogs } from '../FileTreeDialogs';
import { useFavorites } from './hooks/useFavorites';
import { useTreeContextMenu } from './hooks/useTreeContextMenu';
import { useFileTreeShortcuts } from './hooks/useFileTreeShortcuts';
import {
  resolveParentDestination,
  resolveImportTargetPath,
  resolveCreationLocationText,
} from './pathResolvers';
import {
  mapCreateItemError,
  mapRenameError,
  getOperationErrorMessage,
} from './errorHelpers';
import { buildEmptyContextMenuItems, buildNodeContextMenuItems } from './contextMenuItems';

export function FileTreeView({
  tree,
  selectedFile,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onRename,
  onDuplicate,
  onImport,
  onCollapseAll,
  onNavigateBack = () => {},
  onNavigateForward = () => {},
  canNavigateBack = false,
  canNavigateForward = false,
  isS3Repo,
}: FileTreeViewProps) {
  const [createFileDialogOpen, setCreateFileDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedNode, setSelectedNode] = useState<FileTreeNode | null>(null);
  const selectedNodeForActions = React.useMemo(() => {
    if (selectedNode) return selectedNode;
    if (!selectedFile) return null;
    return findNodeByPath(tree, selectedFile);
  }, [selectedFile, selectedNode, tree]);
  const {
    favoriteNodes,
    favoriteMenuState,
    toggleFavorite,
    handleFavoriteContextMenu,
    handleCloseFavoriteMenu,
    handleRemoveFavorite,
    updateFavoritesForPathChange,
    removeFavoritesUnderPath,
  } = useFavorites(tree, selectedNodeForActions);
  const [expanded, setExpanded] = useState<string[]>([]);
  const treeContainerRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (selectedFile) {
      const pathParts = selectedFile.split('/');
      const foldersToExpand: string[] = [];

      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderPath = pathParts.slice(0, i + 1).join('/');
        foldersToExpand.push(folderPath);
      }

      if (foldersToExpand.length > 0) {
        setExpanded((prev) => {
          const newExpanded = new Set([...prev, ...foldersToExpand]);
          return Array.from(newExpanded);
        });
      }
    }
  }, [selectedFile]);

  React.useEffect(() => {
    if (!selectedFile) return;
    if (selectedNode?.type === 'folder') return;
    if (selectedNode?.path === selectedFile) return;

    const node = findNodeByPath(tree, selectedFile);
    if (node) {
      setSelectedNode(node);
    }
  }, [selectedFile, selectedNode, tree]);

  const handleOpenFileDialog = () => {
    setNewItemName('');
    setErrorMessage('');
    setCreateFileDialogOpen(true);
  };

  const handleOpenFolderDialog = () => {
    setNewItemName('');
    setErrorMessage('');
    setCreateFolderDialogOpen(true);
  };

  const handleOpenRenameDialog = (node?: FileTreeNode) => {
    const targetNode = node ?? selectedNodeForActions;
    if (!targetNode) return;

    setSelectedNode(targetNode);

    const currentName = targetNode.name;
    setNewItemName(currentName);
    setErrorMessage('');
    setRenameDialogOpen(true);
  };
  const handleOpenMoveDialog = (node?: FileTreeNode) => {
    const targetNode = node ?? selectedNodeForActions;
    if (!targetNode) return;
    setSelectedNode(targetNode);
    setMoveDialogOpen(true);
  };

  const handleCreateFile = async () => {
    const trimmedName = newItemName.trim();
    if (!trimmedName) return;

    let fileName = normalizeName(trimmedName, isS3Repo);
    if (!fileName.includes('.')) {
      fileName = `${fileName}.md`;
    }

    if (INVALID_NAME_CHARS.test(fileName)) {
      setErrorMessage(FILE_TREE_MESSAGES.invalidFileName);
      return;
    }

    setCreating(true);
    setErrorMessage('');

    try {
      const { parentPath, parentNodeId } = resolveParentDestination(selectedNodeForActions, tree);

      await onCreateFile(parentPath, fileName);

      if (parentNodeId) {
        setExpanded((prev) => (prev.includes(parentNodeId) ? prev : [...prev, parentNodeId]));
      }

      setCreateFileDialogOpen(false);
      setNewItemName('');
      setErrorMessage('');
    } catch (error: any) {
      setErrorMessage(
        mapCreateItemError(error, 'file', fileName, FILE_TREE_MESSAGES.failedCreateFile)
      );
      console.error('Failed to create file:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateFolder = async () => {
    const trimmedName = newItemName.trim();
    if (!trimmedName) return;

    const folderName = normalizeName(trimmedName, isS3Repo);
    if (INVALID_NAME_CHARS.test(folderName)) {
      setErrorMessage(FILE_TREE_MESSAGES.invalidFolderName);
      return;
    }

    setCreating(true);
    setErrorMessage('');

    try {
      const { parentPath, parentNodeId } = resolveParentDestination(selectedNodeForActions, tree);

      await onCreateFolder(parentPath, folderName);

      if (parentNodeId) {
        setExpanded((prev) => (prev.includes(parentNodeId) ? prev : [...prev, parentNodeId]));
      }

      setCreateFolderDialogOpen(false);
      setNewItemName('');
      setErrorMessage('');
    } catch (error: any) {
      setErrorMessage(
        mapCreateItemError(error, 'folder', folderName, FILE_TREE_MESSAGES.failedCreateFolder)
      );
      console.error('Failed to create folder:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async () => {
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
      setRenameDialogOpen(false);
      return;
    }

    setCreating(true);
    setErrorMessage('');

    try {
      const oldPath = selectedNode.path;
      const lastSlash = oldPath.lastIndexOf('/');
      const parentPath = lastSlash > 0 ? oldPath.substring(0, lastSlash) : '';
      const newPath = parentPath ? `${parentPath}/${normalizedName}` : normalizedName;

      await onRename(oldPath, newPath);
      updateFavoritesForPathChange(oldPath, newPath);

      setRenameDialogOpen(false);
      setNewItemName('');
      setErrorMessage('');
    } catch (error: any) {
      console.error('Failed to rename:', error);
      setErrorMessage(
        mapRenameError(error, selectedNode.type, FILE_TREE_MESSAGES.failedRename)
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (node?: FileTreeNode) => {
    const targetNode = node ?? selectedNodeForActions;
    if (!targetNode) return;

    const itemType = targetNode.type === 'folder' ? 'folder' : 'file';
    const message = FILE_TREE_MESSAGES.deleteConfirmation(
      itemType,
      targetNode.name,
      targetNode.type === 'folder'
    );

    if (window.confirm(message)) {
      try {
        await onDelete(targetNode.path);
        removeFavoritesUnderPath(targetNode.path);
        setSelectedNode(null);
      } catch (error) {
        console.error('Failed to delete:', error);
        alert(
          `${FILE_TREE_MESSAGES.failedDeletePrefix} ${itemType}: ${getOperationErrorMessage(error)}`
        );
      }
    }
  };

  const handleImportFile = async () => {
    try {
      if (!window.notegitApi.dialog) {
        alert(FILE_TREE_MESSAGES.dialogApiNotAvailable);
        return;
      }

      const result = await window.notegitApi.dialog.showOpenDialog({
        properties: ['openFile'],
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
        FILE_TREE_MESSAGES.importedFileNameFallback
      );

      await onImport(sourcePath, targetPath);
    } catch (error) {
      console.error('Failed to import file:', error);
      alert(`${FILE_TREE_MESSAGES.failedImportPrefix}: ${getOperationErrorMessage(error)}`);
    }
  };

  const handleMoveToFolder = async (destinationPath: string) => {
    if (!selectedNode) return;

    try {
      const oldPath = selectedNode.path;
      const newPath = destinationPath ? `${destinationPath}/${selectedNode.name}` : selectedNode.name;

      await onRename(selectedNode.path, newPath);
      updateFavoritesForPathChange(oldPath, newPath);

      setMoveDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to move:', error);
      alert(`${FILE_TREE_MESSAGES.failedMovePrefix}: ${getOperationErrorMessage(error)}`);
    }
  };

  const handleNodeSelect = (_event: React.SyntheticEvent, nodeId: string) => {
    const node = findNode(tree, nodeId);
    if (node) {
      setSelectedNode(node);
      if (node.type === 'file') {
        onSelectFile(node.path, node.type);
      }
      treeContainerRef.current?.focus();
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    if (
      target.classList.contains('tree-container') ||
      (!target.closest('.MuiTreeItem-root') && !target.closest('.MuiTreeView-root'))
    ) {
      setSelectedNode(null);
      treeContainerRef.current?.focus();
    }
  };

  const handleCollapseAll = React.useCallback(() => {
    setExpanded([]);
    onCollapseAll?.();
  }, [onCollapseAll]);

  const expandPathToNode = (node: FileTreeNode) => {
    const pathParts = node.path.split('/').filter(Boolean);
    const depth = node.type === 'folder' ? pathParts.length : pathParts.length - 1;
    if (depth <= 0) return;

    const foldersToExpand = Array.from({ length: depth }, (_, index) =>
      pathParts.slice(0, index + 1).join('/')
    );

    setExpanded((prev) => {
      const nextExpanded = new Set([...prev, ...foldersToExpand]);
      return Array.from(nextExpanded);
    });
  };

  const handleFavoriteClick = (node: FileTreeNode) => {
    const targetNode = findNodeByPath(tree, node.path) ?? node;
    expandPathToNode(targetNode);
    handleNodeSelect({} as React.SyntheticEvent, targetNode.id);
  };

  const {
    treeContextMenuState,
    handleTreeContextMenu,
    handleCloseTreeContextMenu,
    handleTreeContextMenuAction,
  } = useTreeContextMenu({
    treeContainerRef,
    selectedNode,
    setSelectedNode,
    onRename: handleOpenRenameDialog,
    onMove: handleOpenMoveDialog,
    onToggleFavorite: toggleFavorite,
    onDelete: handleDelete,
    onDuplicate: onDuplicate
      ? async (node) => {
          await onDuplicate(node.path);
        }
      : undefined,
    onContextMenuOpen: handleCloseFavoriteMenu,
  });

  useFileTreeShortcuts(treeContainerRef, {
    openFileDialog: handleOpenFileDialog,
    openFolderDialog: handleOpenFolderDialog,
    handleDelete,
    handleImportFile,
    handleOpenRenameDialog,
    handleOpenMoveDialog,
    handleToggleFavorite: toggleFavorite,
    handleCollapseAll,
    handleDuplicate:
      onDuplicate && selectedNodeForActions && selectedNodeForActions.type === 'file'
        ? () => onDuplicate(selectedNodeForActions.path)
        : undefined,
  });
  const treeContextMenuNode = treeContextMenuState?.node || null;
  const contextNodeIsFavorite = Boolean(
    treeContextMenuNode && favoriteNodes.some((node) => node.path === treeContextMenuNode.path)
  );
  const creationLocationText = resolveCreationLocationText(
    selectedNodeForActions,
    FILE_TREE_TEXT.createLocationRoot,
    FILE_TREE_TEXT.createLocationPrefix
  );
  const fileHelperText = !newItemName.includes('.') ? FILE_TREE_TEXT.fileExtensionHint : ' ';
  const selectedNodeId = selectedNodeForActions?.id ?? selectedFile ?? undefined;

  const emptyContextMenuItems: ContextMenuItem[] = buildEmptyContextMenuItems({
    newFileLabel: FILE_TREE_TEXT.newFile,
    newFolderLabel: FILE_TREE_TEXT.newFolder,
    importFileLabel: FILE_TREE_TEXT.importFile,
    onCloseTreeContextMenu: handleCloseTreeContextMenu,
    onOpenFileDialog: handleOpenFileDialog,
    onOpenFolderDialog: handleOpenFolderDialog,
    onImportFile: handleImportFile,
  });

  const nodeContextMenuItems: ContextMenuItem[] = buildNodeContextMenuItems({
    node: treeContextMenuNode,
    isFavorite: contextNodeIsFavorite,
    labels: {
      newFile: FILE_TREE_TEXT.newFile,
      newFolder: FILE_TREE_TEXT.newFolder,
      rename: FILE_TREE_TEXT.rename,
      move: FILE_TREE_TEXT.moveToFolder,
      addToFavorites: FILE_TREE_TEXT.addToFavorites,
      removeFromFavorites: FILE_TREE_TEXT.removeFromFavorites,
      duplicate: FILE_TREE_TEXT.duplicate,
      delete: FILE_TREE_TEXT.delete,
    },
    onCloseTreeContextMenu: handleCloseTreeContextMenu,
    onOpenFileDialog: handleOpenFileDialog,
    onOpenFolderDialog: handleOpenFolderDialog,
    onAction: handleTreeContextMenuAction,
  });

  return (
    <Box sx={rootSx}>
      <FileTreeToolbar
        onBack={onNavigateBack}
        onForward={onNavigateForward}
        canGoBack={canNavigateBack}
        canGoForward={canNavigateForward}
        onNewFile={handleOpenFileDialog}
        onNewFolder={handleOpenFolderDialog}
        onImport={handleImportFile}
        onCollapseAll={handleCollapseAll}
      />

      {favoriteNodes.length > 0 && (
        <FavoritesBar
          favorites={favoriteNodes}
          onSelect={handleFavoriteClick}
          onContextMenu={handleFavoriteContextMenu}
        />
      )}

      <FileTreeContextMenus
        favoriteMenuState={favoriteMenuState}
        onCloseFavoriteMenu={handleCloseFavoriteMenu}
        onRemoveFavorite={handleRemoveFavorite}
        favoriteMenuLabel={FILE_TREE_TEXT.favoritesContextMenuItem}
        favoriteMenuIcon={<FavoriteIcon fontSize="small" />}
        treeContextMenuState={treeContextMenuState}
        onCloseTreeContextMenu={handleCloseTreeContextMenu}
        emptyContextMenuItems={emptyContextMenuItems}
        nodeContextMenuItems={nodeContextMenuItems}
      />

      <Box
        className="tree-container"
        sx={treeContainerSx}
        onClick={handleContainerClick}
        onContextMenu={handleTreeContextMenu}
        ref={treeContainerRef}
        tabIndex={0}
      >
        <TreeView
          defaultCollapseIcon={<span />}
          defaultExpandIcon={<span />}
          expanded={expanded}
          onNodeToggle={(_event: React.SyntheticEvent, nodeIds: string[]) => {
            setExpanded(nodeIds);
          }}
          selected={selectedNodeId}
          onNodeSelect={handleNodeSelect}
        >
          {renderTreeItems(tree, {
            expanded,
            treeItemLabelSx,
            handleTreeContextMenu,
            selectedNodeId,
          })}
        </TreeView>
      </Box>

      <FileTreeDialogs
        text={{
          createFileTitle: FILE_TREE_TEXT.createFileTitle,
          createFolderTitle: FILE_TREE_TEXT.createFolderTitle,
          fileNameLabel: FILE_TREE_TEXT.fileNameLabel,
          folderNameLabel: FILE_TREE_TEXT.folderNameLabel,
          filePlaceholder: FILE_TREE_TEXT.filePlaceholder,
          folderPlaceholder: FILE_TREE_TEXT.folderPlaceholder,
          cancel: FILE_TREE_TEXT.cancel,
          create: FILE_TREE_TEXT.create,
          creating: FILE_TREE_TEXT.creating,
          renameFolderTitle: FILE_TREE_TEXT.renameFolderTitle,
          renameFileTitle: FILE_TREE_TEXT.renameFileTitle,
          newNameLabel: FILE_TREE_TEXT.newNameLabel,
          renameAction: FILE_TREE_TEXT.renameAction,
          renaming: FILE_TREE_TEXT.renaming,
        }}
        tree={tree}
        selectedNode={selectedNode}
        createFileDialogOpen={createFileDialogOpen}
        createFolderDialogOpen={createFolderDialogOpen}
        renameDialogOpen={renameDialogOpen}
        moveDialogOpen={moveDialogOpen}
        newItemName={newItemName}
        creating={creating}
        errorMessage={errorMessage}
        creationLocationText={creationLocationText}
        fileHelperText={fileHelperText}
        onSetName={setNewItemName}
        onClearError={() => setErrorMessage('')}
        onCloseCreateFileDialog={() => setCreateFileDialogOpen(false)}
        onCloseCreateFolderDialog={() => setCreateFolderDialogOpen(false)}
        onCloseRenameDialog={() => setRenameDialogOpen(false)}
        onCloseMoveDialog={() => setMoveDialogOpen(false)}
        onCreateFile={handleCreateFile}
        onCreateFolder={handleCreateFolder}
        onRename={handleRename}
        onMoveToFolder={handleMoveToFolder}
      />
    </Box>
  );
}
