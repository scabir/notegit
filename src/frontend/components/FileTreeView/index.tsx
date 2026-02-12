import React from "react";
import { Box } from "@mui/material";
import { Star as FavoriteIcon } from "@mui/icons-material";
import { FILE_TREE_TEXT } from "./constants";
import { rootSx } from "./styles";
import type { FileTreeViewProps } from "./types";
import { FileTreeToolbar } from "../FileTreeToolbar";
import { FavoritesBar } from "../FileTreeFavoritesBar";
import { FileTreeContextMenus } from "../FileTreeContextMenus";
import type { ContextMenuItem } from "../FileTreeContextMenus/types";
import { FileTreeDialogs } from "../FileTreeDialogs";
import { FileTreeMain } from "../FileTreeMain";
import { useFavorites } from "./hooks/useFavorites";
import { useTreeContextMenu } from "./hooks/useTreeContextMenu";
import { useFileTreeShortcuts } from "./hooks/useFileTreeShortcuts";
import { useDialogState } from "./hooks/useDialogState";
import { useTreeSelectionState } from "./hooks/useTreeSelectionState";
import { useCreationMetadata } from "./hooks/useCreationMetadata";
import { useFileTreeActions } from "./hooks/useFileTreeActions";
import {
  buildEmptyContextMenuItems,
  buildNodeContextMenuItems,
} from "./contextMenuItems";

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
  isCollapsed,
  onToggleCollapse,
}: FileTreeViewProps) {
  const [internalIsTreeCollapsed, setInternalIsTreeCollapsed] =
    React.useState(false);
  const isTreeCollapsed = isCollapsed ?? internalIsTreeCollapsed;
  const handleToggleCollapse = React.useCallback(() => {
    if (onToggleCollapse) {
      onToggleCollapse();
      return;
    }
    setInternalIsTreeCollapsed((prev) => !prev);
  }, [onToggleCollapse]);

  const {
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
    openCreateFileDialog,
    openCreateFolderDialog,
    openRenameDialog,
    openMoveDialog,
    closeCreateFileDialog,
    closeCreateFolderDialog,
    closeRenameDialog,
    closeMoveDialog,
  } = useDialogState();

  const {
    treeContainerRef,
    selectedNode,
    setSelectedNode,
    selectedNodeForActions,
    expanded,
    setExpanded,
    handleNodeSelect,
    handleContainerClick,
    handleCollapseAll,
    handleNodeToggle,
    handleFavoriteClick,
  } = useTreeSelectionState({
    tree,
    selectedFile,
    onSelectFile,
    onCollapseAll,
  });

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
  const {
    handleOpenRenameDialog,
    handleOpenMoveDialog,
    handleCreateFile,
    handleCreateFolder,
    handleRename,
    handleDelete,
    handleImportFile,
    handleMoveToFolder,
  } = useFileTreeActions({
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
  });

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

  useFileTreeShortcuts(
    treeContainerRef,
    {
      openFileDialog: openCreateFileDialog,
      openFolderDialog: openCreateFolderDialog,
      handleDelete,
      handleImportFile,
      handleOpenRenameDialog,
      handleOpenMoveDialog,
      handleToggleFavorite: () => toggleFavorite(),
      handleCollapseAll,
      handleDuplicate:
        onDuplicate &&
        selectedNodeForActions &&
        selectedNodeForActions.type === "file"
          ? () => onDuplicate(selectedNodeForActions.path)
          : undefined,
    },
    !isTreeCollapsed,
  );

  const treeContextMenuNode = treeContextMenuState?.node || null;
  const {
    contextNodeIsFavorite,
    creationLocationText,
    fileHelperText,
    selectedNodeId,
  } = useCreationMetadata({
    treeContextMenuNode,
    favoriteNodes,
    selectedNodeForActions,
    selectedFile,
    newItemName,
    createLocationRoot: FILE_TREE_TEXT.createLocationRoot,
    createLocationPrefix: FILE_TREE_TEXT.createLocationPrefix,
    fileExtensionHint: FILE_TREE_TEXT.fileExtensionHint,
  });

  const emptyContextMenuItems: ContextMenuItem[] = buildEmptyContextMenuItems({
    newFileLabel: FILE_TREE_TEXT.newFile,
    newFolderLabel: FILE_TREE_TEXT.newFolder,
    importFileLabel: FILE_TREE_TEXT.importFile,
    onCloseTreeContextMenu: handleCloseTreeContextMenu,
    onOpenFileDialog: openCreateFileDialog,
    onOpenFolderDialog: openCreateFolderDialog,
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
    onOpenFileDialog: openCreateFileDialog,
    onOpenFolderDialog: openCreateFolderDialog,
    onAction: handleTreeContextMenuAction,
  });

  return (
    <Box sx={rootSx}>
      <FileTreeToolbar
        isCollapsed={isTreeCollapsed}
        canToggleCollapse={isTreeCollapsed || Boolean(selectedFile)}
        onToggleCollapse={handleToggleCollapse}
        onBack={onNavigateBack}
        onForward={onNavigateForward}
        canGoBack={canNavigateBack}
        canGoForward={canNavigateForward}
        onNewFile={openCreateFileDialog}
        onNewFolder={openCreateFolderDialog}
        onImport={handleImportFile}
        onCollapseAll={handleCollapseAll}
      />

      {!isTreeCollapsed && favoriteNodes.length > 0 && (
        <FavoritesBar
          favorites={favoriteNodes}
          onSelect={handleFavoriteClick}
          onContextMenu={handleFavoriteContextMenu}
        />
      )}

      {!isTreeCollapsed && (
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
      )}

      {!isTreeCollapsed && (
        <FileTreeMain
          tree={tree}
          expanded={expanded}
          selectedNodeId={selectedNodeId}
          treeContainerRef={treeContainerRef}
          onContainerClick={handleContainerClick}
          onTreeContextMenu={handleTreeContextMenu}
          onNodeSelect={handleNodeSelect}
          onNodeToggle={handleNodeToggle}
        />
      )}

      {!isTreeCollapsed && (
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
          onClearError={clearError}
          onCloseCreateFileDialog={closeCreateFileDialog}
          onCloseCreateFolderDialog={closeCreateFolderDialog}
          onCloseRenameDialog={closeRenameDialog}
          onCloseMoveDialog={closeMoveDialog}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onRename={handleRename}
          onMoveToFolder={handleMoveToFolder}
        />
      )}
    </Box>
  );
}
