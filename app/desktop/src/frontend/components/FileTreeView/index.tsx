import React from "react";
import { Box } from "@mui/material";
import { Star as FavoriteIcon } from "@mui/icons-material";
import { useI18n } from "../../i18n";
import { TOOLBAR_KEYS } from "../FileTreeToolbar/constants";
import { buildFileTreeMessages, buildFileTreeText } from "./constants";
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
  const { t } = useI18n();
  const fileTreeText = React.useMemo(() => buildFileTreeText(t), [t]);
  const fileTreeMessages = React.useMemo(() => buildFileTreeMessages(t), [t]);
  const toolbarText = React.useMemo(
    () => ({
      collapseTree: t(TOOLBAR_KEYS.collapseTree),
      expandTree: t(TOOLBAR_KEYS.expandTree),
      back: t(TOOLBAR_KEYS.back),
      forward: t(TOOLBAR_KEYS.forward),
      newFile: t(TOOLBAR_KEYS.newFile),
      newFolder: t(TOOLBAR_KEYS.newFolder),
      importFile: t(TOOLBAR_KEYS.importFile),
      collapseAll: t(TOOLBAR_KEYS.collapseAll),
    }),
    [t],
  );
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
    messages: fileTreeMessages,
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
    selectedNode,
    selectedFile,
    newItemName,
    createLocationRoot: fileTreeText.createLocationRoot,
    createLocationPrefix: fileTreeText.createLocationPrefix,
    fileExtensionHint: fileTreeText.fileExtensionHint,
  });

  const emptyContextMenuItems: ContextMenuItem[] = buildEmptyContextMenuItems({
    newFileLabel: fileTreeText.newFile,
    newFolderLabel: fileTreeText.newFolder,
    importFileLabel: fileTreeText.importFile,
    onCloseTreeContextMenu: handleCloseTreeContextMenu,
    onOpenFileDialog: openCreateFileDialog,
    onOpenFolderDialog: openCreateFolderDialog,
    onImportFile: handleImportFile,
  });

  const nodeContextMenuItems: ContextMenuItem[] = buildNodeContextMenuItems({
    node: treeContextMenuNode,
    isFavorite: contextNodeIsFavorite,
    labels: {
      newFile: fileTreeText.newFile,
      newFolder: fileTreeText.newFolder,
      rename: fileTreeText.rename,
      move: fileTreeText.moveToFolder,
      addToFavorites: fileTreeText.addToFavorites,
      removeFromFavorites: fileTreeText.removeFromFavorites,
      duplicate: fileTreeText.duplicate,
      delete: fileTreeText.delete,
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
        text={toolbarText}
      />

      {!isTreeCollapsed && favoriteNodes.length > 0 && (
        <FavoritesBar
          title={fileTreeText.favoritesTitle}
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
          favoriteMenuLabel={fileTreeText.favoritesContextMenuItem}
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
            createFileTitle: fileTreeText.createFileTitle,
            createFolderTitle: fileTreeText.createFolderTitle,
            fileNameLabel: fileTreeText.fileNameLabel,
            folderNameLabel: fileTreeText.folderNameLabel,
            filePlaceholder: fileTreeText.filePlaceholder,
            folderPlaceholder: fileTreeText.folderPlaceholder,
            cancel: fileTreeText.cancel,
            create: fileTreeText.create,
            creating: fileTreeText.creating,
            renameFolderTitle: fileTreeText.renameFolderTitle,
            renameFileTitle: fileTreeText.renameFileTitle,
            newNameLabel: fileTreeText.newNameLabel,
            renameAction: fileTreeText.renameAction,
            renaming: fileTreeText.renaming,
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
