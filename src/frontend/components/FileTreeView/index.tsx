import React, { useRef, useState } from 'react';
import { TreeView } from '@mui/x-tree-view';
import { Box } from '@mui/material';
import {
  CreateNewFolder as CreateFolderIcon,
  Delete as DeleteIcon,
  FileUpload as ImportIcon,
  DriveFileRenameOutline as RenameIcon,
  DriveFileMove as MoveIcon,
  StarBorder as FavoriteBorderIcon,
  Star as FavoriteIcon,
  NoteAdd as NoteAddIcon,
  ContentCopy as DuplicateIcon,
} from '@mui/icons-material';
import { MoveToFolderDialog } from '../MoveToFolderDialog';
import type { FileTreeNode } from '../../../shared/types';
import { FILE_TREE_TEXT, INVALID_NAME_CHARS } from './constants';
import { rootSx, treeContainerSx, treeItemLabelSx } from './styles';
import { normalizeName, findNode, findNodeByPath, getParentPath } from './utils';
import type { FileTreeViewProps, ContextMenuItem } from './types';
import { FileTreeToolbar } from './Toolbar';
import { FavoritesBar } from './FavoritesBar';
import { DialogCreateItem } from './DialogCreateItem';
import { DialogRename } from './DialogRename';
import { ContextMenus } from './ContextMenus';
import { renderTreeItems } from './TreeRenderer';
import { useFavorites } from './hooks/useFavorites';
import { useTreeContextMenu } from './hooks/useTreeContextMenu';
import { useFileTreeShortcuts } from './hooks/useFileTreeShortcuts';

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
      setErrorMessage('File name contains invalid characters: < > : " / \\ | ? *');
      return;
    }

    setCreating(true);
    setErrorMessage('');

    try {
      let parentPath = '';
      let parentNodeId: string | null = null;

      const targetNode = selectedNodeForActions;
      if (targetNode) {
        if (targetNode.type === 'folder') {
          parentPath = targetNode.path;
          parentNodeId = targetNode.id;
        } else {
          const lastSlash = targetNode.path.lastIndexOf('/');
          parentPath = lastSlash > 0 ? targetNode.path.substring(0, lastSlash) : '';

          if (parentPath) {
            const parentNode = findNodeByPath(tree, parentPath);
            if (parentNode) {
              parentNodeId = parentNode.id;
            }
          }
        }
      }

      await onCreateFile(parentPath, fileName);

      if (parentNodeId && !expanded.includes(parentNodeId)) {
        setExpanded([...expanded, parentNodeId]);
      }

      setCreateFileDialogOpen(false);
      setNewItemName('');
      setErrorMessage('');
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to create file';
      if (errorMsg.includes('exists') || errorMsg.includes('EEXIST')) {
        setErrorMessage(`File "${fileName}" already exists`);
      } else if (errorMsg.includes('permission') || errorMsg.includes('EACCES')) {
        setErrorMessage('Permission denied to create file');
      } else {
        setErrorMessage(errorMsg);
      }
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
      setErrorMessage('Folder name contains invalid characters: < > : " / \\ | ? *');
      return;
    }

    setCreating(true);
    setErrorMessage('');

    try {
      let parentPath = '';
      let parentNodeId: string | null = null;

      const targetNode = selectedNodeForActions;
      if (targetNode) {
        if (targetNode.type === 'folder') {
          parentPath = targetNode.path;
          parentNodeId = targetNode.id;
        } else {
          const lastSlash = targetNode.path.lastIndexOf('/');
          parentPath = lastSlash > 0 ? targetNode.path.substring(0, lastSlash) : '';

          if (parentPath) {
            const parentNode = findNodeByPath(tree, parentPath);
            if (parentNode) {
              parentNodeId = parentNode.id;
            }
          }
        }
      }

      await onCreateFolder(parentPath, folderName);

      if (parentNodeId && !expanded.includes(parentNodeId)) {
        setExpanded([...expanded, parentNodeId]);
      }

      setCreateFolderDialogOpen(false);
      setNewItemName('');
      setErrorMessage('');
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to create folder';
      if (errorMsg.includes('exists') || errorMsg.includes('EEXIST')) {
        setErrorMessage(`Folder "${folderName}" already exists`);
      } else if (errorMsg.includes('permission') || errorMsg.includes('EACCES')) {
        setErrorMessage('Permission denied to create folder');
      } else {
        setErrorMessage(errorMsg);
      }
      console.error('Failed to create folder:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async () => {
    if (!selectedNode) return;

    const trimmedName = newItemName.trim();
    if (!trimmedName) {
      setErrorMessage('Name cannot be empty');
      return;
    }

    const normalizedName = normalizeName(trimmedName, isS3Repo);
    if (INVALID_NAME_CHARS.test(normalizedName)) {
      setErrorMessage('Name contains invalid characters: < > : " / \\ | ? *');
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

      if (error.message && error.message.includes('already exists')) {
        setErrorMessage(`A ${selectedNode.type === 'folder' ? 'folder' : 'file'} with that name already exists`);
      } else if (error.message && error.message.includes('permission')) {
        setErrorMessage('Permission denied');
      } else {
        setErrorMessage(error.message || 'Failed to rename');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (node?: FileTreeNode) => {
    const targetNode = node ?? selectedNodeForActions;
    if (!targetNode) return;

    const itemType = targetNode.type === 'folder' ? 'folder' : 'file';
    const message = `Are you sure you want to delete ${itemType} "${targetNode.name}"?${targetNode.type === 'folder' ? ' All contents will be deleted.' : ''
      }`;

    if (window.confirm(message)) {
      try {
        await onDelete(targetNode.path);
        removeFavoritesUnderPath(targetNode.path);
        setSelectedNode(null);
      } catch (error) {
        console.error('Failed to delete:', error);
        alert(`Failed to delete ${itemType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleImportFile = async () => {
    try {
      if (!window.notegitApi.dialog) {
        alert('Dialog API not available. Please restart the app.');
        return;
      }

      const result = await window.notegitApi.dialog.showOpenDialog({
        properties: ['openFile'],
        title: 'Select file to import',
      });

      if (result.canceled || result.filePaths.length === 0) {
        return;
      }

      const sourcePath = result.filePaths[0];
      const rawFileName = sourcePath.split('/').pop() || 'imported_file';
      const fileName = normalizeName(rawFileName, isS3Repo);

      let targetPath = fileName;
      const targetNode = selectedNodeForActions;
      if (targetNode) {
        if (targetNode.type === 'folder') {
          targetPath = `${targetNode.path}/${fileName}`;
        } else {
          const lastSlash = targetNode.path.lastIndexOf('/');
          const parentPath = lastSlash > 0 ? targetNode.path.substring(0, lastSlash) : '';
          targetPath = parentPath ? `${parentPath}/${fileName}` : fileName;
        }
      }

      await onImport(sourcePath, targetPath);
    } catch (error) {
      console.error('Failed to import file:', error);
      alert(`Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      alert(`Failed to move: ${error.message || 'Unknown error'}`);
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
    handleDuplicate:
      onDuplicate && selectedNodeForActions && selectedNodeForActions.type === 'file'
        ? () => onDuplicate(selectedNodeForActions.path)
        : undefined,
  });
  const getCreationLocationText = () => {
    if (!selectedNodeForActions) {
      return FILE_TREE_TEXT.createLocationRoot;
    }
    if (selectedNodeForActions.type === 'folder') {
      return `${FILE_TREE_TEXT.createLocationPrefix}${selectedNodeForActions.path || 'root'}`;
    }
    const parentPath = getParentPath(selectedNodeForActions.path);
    return parentPath
      ? `${FILE_TREE_TEXT.createLocationPrefix}${parentPath}`
      : FILE_TREE_TEXT.createLocationRoot;
  };

  const treeContextMenuNode = treeContextMenuState?.node || null;
  const contextNodeIsFavorite = Boolean(
    treeContextMenuNode && favoriteNodes.some((node) => node.path === treeContextMenuNode.path)
  );
  const creationLocationText = getCreationLocationText();
  const fileHelperText = !newItemName.includes('.') ? FILE_TREE_TEXT.fileExtensionHint : ' ';
  const selectedNodeId = selectedNodeForActions?.id ?? selectedFile ?? undefined;

  const emptyContextMenuItems: ContextMenuItem[] = [
    {
      label: FILE_TREE_TEXT.newFile,
      icon: <NoteAddIcon fontSize="small" />,
      action: () => {
        handleCloseTreeContextMenu();
        handleOpenFileDialog();
      },
      testId: 'tree-context-new-file',
    },
    {
      label: FILE_TREE_TEXT.newFolder,
      icon: <CreateFolderIcon fontSize="small" />,
      action: () => {
        handleCloseTreeContextMenu();
        handleOpenFolderDialog();
      },
      testId: 'tree-context-new-folder',
    },
    {
      label: FILE_TREE_TEXT.importFile,
      icon: <ImportIcon fontSize="small" />,
      action: () => {
        handleCloseTreeContextMenu();
        handleImportFile();
      },
      testId: 'tree-context-import',
    },
  ];

  const nodeContextMenuItems: ContextMenuItem[] = [
    {
      label: FILE_TREE_TEXT.rename,
      icon: <RenameIcon fontSize="small" />,
      action: () => handleTreeContextMenuAction('rename', treeContextMenuNode),
      testId: 'tree-context-rename',
    },
    {
      label: FILE_TREE_TEXT.moveToFolder,
      icon: <MoveIcon fontSize="small" />,
      action: () => handleTreeContextMenuAction('move', treeContextMenuNode),
      testId: 'tree-context-move',
    },
    {
      label: contextNodeIsFavorite ? FILE_TREE_TEXT.removeFromFavorites : FILE_TREE_TEXT.addToFavorites,
      icon: contextNodeIsFavorite ? (
        <FavoriteIcon fontSize="small" />
      ) : (
        <FavoriteBorderIcon fontSize="small" />
      ),
      action: () => handleTreeContextMenuAction('favorite', treeContextMenuNode),
      testId: 'tree-context-favorite',
    },
    treeContextMenuNode?.type === 'file'
      ? {
          label: FILE_TREE_TEXT.duplicate,
          icon: <DuplicateIcon fontSize="small" />,
          action: () => handleTreeContextMenuAction('duplicate', treeContextMenuNode),
          testId: 'tree-context-duplicate',
        }
      : null,
    {
      label: FILE_TREE_TEXT.delete,
      icon: <DeleteIcon fontSize="small" />,
      action: () => handleTreeContextMenuAction('delete', treeContextMenuNode),
      testId: 'tree-context-delete',
    },
  ].filter(Boolean) as ContextMenuItem[];

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
      />

      {favoriteNodes.length > 0 && (
        <FavoritesBar
          favorites={favoriteNodes}
          onSelect={handleFavoriteClick}
          onContextMenu={handleFavoriteContextMenu}
        />
      )}

      <ContextMenus
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

      <DialogCreateItem
        testId="create-file-dialog"
        open={createFileDialogOpen}
        title={FILE_TREE_TEXT.createFileTitle}
        label={FILE_TREE_TEXT.fileNameLabel}
        helperText={fileHelperText}
        placeholder={FILE_TREE_TEXT.filePlaceholder}
        creationLocationText={creationLocationText}
        value={newItemName}
        errorMessage={errorMessage}
        creating={creating}
        onChange={(value) => {
          setNewItemName(value);
          setErrorMessage('');
        }}
        onClose={() => {
          setCreateFileDialogOpen(false);
          setErrorMessage('');
        }}
        onCreate={handleCreateFile}
        cancelLabel={FILE_TREE_TEXT.cancel}
        confirmLabel={FILE_TREE_TEXT.create}
        loadingLabel={FILE_TREE_TEXT.creating}
      />

      <DialogCreateItem
        testId="create-folder-dialog"
        open={createFolderDialogOpen}
        title={FILE_TREE_TEXT.createFolderTitle}
        label={FILE_TREE_TEXT.folderNameLabel}
        placeholder={FILE_TREE_TEXT.folderPlaceholder}
        creationLocationText={creationLocationText}
        value={newItemName}
        errorMessage={errorMessage}
        creating={creating}
        onChange={(value) => {
          setNewItemName(value);
          setErrorMessage('');
        }}
        onClose={() => {
          setCreateFolderDialogOpen(false);
          setErrorMessage('');
        }}
        onCreate={handleCreateFolder}
        cancelLabel={FILE_TREE_TEXT.cancel}
        confirmLabel={FILE_TREE_TEXT.create}
        loadingLabel={FILE_TREE_TEXT.creating}
      />

      <DialogRename
        testId="rename-dialog"
        open={renameDialogOpen}
        onClose={() => {
          setRenameDialogOpen(false);
          setErrorMessage('');
        }}
        title={selectedNode?.type === 'folder' ? FILE_TREE_TEXT.renameFolderTitle : FILE_TREE_TEXT.renameFileTitle}
        label={FILE_TREE_TEXT.newNameLabel}
        value={newItemName}
        onChange={(value) => {
          setNewItemName(value);
          setErrorMessage('');
        }}
        onSubmit={handleRename}
        errorMessage={errorMessage}
        creating={creating}
        placeholder={selectedNode?.name || ''}
        cancelLabel={FILE_TREE_TEXT.cancel}
        confirmLabel={FILE_TREE_TEXT.renameAction}
        loadingLabel={FILE_TREE_TEXT.renaming}
      />

      <MoveToFolderDialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        onConfirm={handleMoveToFolder}
        itemToMove={selectedNode}
        tree={tree}
      />
    </Box>
  );
}
