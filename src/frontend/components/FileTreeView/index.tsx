import React, { useRef, useState } from 'react';
import { TreeView, TreeItem } from '@mui/x-tree-view';
import {
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import {
  Folder as FolderIcon,
  Add as PlusIcon,
  Remove as MinusIcon,
  CreateNewFolder as CreateFolderIcon,
  NoteAdd as NoteAddIcon,
  Delete as DeleteIcon,
  FileUpload as ImportIcon,
  DriveFileRenameOutline as RenameIcon,
  DriveFileMove as MoveIcon,
  StarBorder as FavoriteBorderIcon,
  Star as FavoriteIcon,
} from '@mui/icons-material';
import { MoveToFolderDialog } from '../MoveToFolderDialog';
import type { FileTreeNode } from '../../../shared/types';
import { FILE_TREE_TEXT, INVALID_NAME_CHARS, FAVORITES_STORAGE_KEY } from './constants';
import {
  rootSx,
  toolbarSx,
  treeContainerSx,
  treeItemLabelSx,
  dialogInfoSx,
  dialogErrorSx,
  favoritesSectionSx,
  favoriteListSx,
  favoriteItemSx,
} from './styles';
import { getFileIcon, normalizeName, findNode, findNodeByPath, getParentPath } from './utils';
import type { FileTreeViewProps } from './types';

const readFavoritesFromStorage = (): string[] => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter((entry) => typeof entry === 'string');
    }
  } catch {
    // ignore invalid JSON
  }

  return [];
};

const writeFavoritesToStorage = (favorites: string[]): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
};

export function FileTreeView({
  tree,
  selectedFile,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onRename,
  onImport,
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
  const [favorites, setFavorites] = useState<string[]>(() => readFavoritesFromStorage());
  const [favoriteMenuState, setFavoriteMenuState] = useState<{
    anchorEl: HTMLElement | null;
    path: string | null;
  } | null>(null);
  const [treeContextMenuState, setTreeContextMenuState] = useState<{
    node: FileTreeNode | null;
    mode: 'node' | 'empty';
    position: { top: number; left: number } | null;
  } | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const treeContainerRef = useRef<HTMLDivElement | null>(null);
  const shortcutHandlersRef = useRef({
    openFileDialog: () => {},
    openFolderDialog: () => {},
    handleDelete: () => {},
    handleImportFile: () => {},
    handleOpenRenameDialog: () => {},
    handleOpenMoveDialog: () => {},
    handleToggleFavorite: () => {},
  });

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
    writeFavoritesToStorage(favorites);
  }, [favorites]);

  React.useEffect(() => {
    setFavorites((prev) => {
      const filtered = prev.filter((path) => Boolean(findNodeByPath(tree, path)));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [tree]);

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
    const targetNode = node ?? selectedNode;
    if (!targetNode) return;

    setSelectedNode(targetNode);

    const currentName = targetNode.name;
    setNewItemName(currentName);
    setErrorMessage('');
    setRenameDialogOpen(true);
  };
  const handleOpenMoveDialog = (node?: FileTreeNode) => {
    const targetNode = node ?? selectedNode;
    if (!targetNode) return;
    setSelectedNode(targetNode);
    setMoveDialogOpen(true);
  };

  const handleToggleFavorite = (node?: FileTreeNode) => {
    const targetNode = node ?? selectedNode;
    if (!targetNode) return;

    setFavorites((prev) => {
      const exists = prev.includes(targetNode.path);
      if (exists) {
        return prev.filter((path) => path !== targetNode.path);
      }
      return [...prev, targetNode.path];
    });
  };

  const updateFavoritesForPathChange = (oldPath: string, newPath: string) => {
    setFavorites((prev) => {
      let updated = false;
      const newValues = prev.map((path) => {
        if (path === oldPath) {
          updated = true;
          return newPath;
        }
        if (path.startsWith(`${oldPath}/`)) {
          updated = true;
          return path.replace(oldPath, newPath);
        }
        return path;
      });
      return updated ? newValues : prev;
    });
  };

  const removeFavoritesUnderPath = (pathToRemove: string) => {
    setFavorites((prev) => {
      const filtered = prev.filter(
        (path) => path !== pathToRemove && !path.startsWith(`${pathToRemove}/`)
      );
      return filtered.length === prev.length ? prev : filtered;
    });
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

      if (selectedNode) {
        if (selectedNode.type === 'folder') {
          parentPath = selectedNode.path;
          parentNodeId = selectedNode.id;
        } else {
          const lastSlash = selectedNode.path.lastIndexOf('/');
          parentPath = lastSlash > 0 ? selectedNode.path.substring(0, lastSlash) : '';

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

      if (selectedNode) {
        if (selectedNode.type === 'folder') {
          parentPath = selectedNode.path;
          parentNodeId = selectedNode.id;
        } else {
          const lastSlash = selectedNode.path.lastIndexOf('/');
          parentPath = lastSlash > 0 ? selectedNode.path.substring(0, lastSlash) : '';

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
    const targetNode = node ?? selectedNode;
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
      if (selectedNode) {
        if (selectedNode.type === 'folder') {
          targetPath = `${selectedNode.path}/${fileName}`;
        } else {
          const lastSlash = selectedNode.path.lastIndexOf('/');
          const parentPath = lastSlash > 0 ? selectedNode.path.substring(0, lastSlash) : '';
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

  React.useEffect(() => {
    shortcutHandlersRef.current = {
      openFileDialog: handleOpenFileDialog,
      openFolderDialog: handleOpenFolderDialog,
      handleDelete,
      handleImportFile,
      handleOpenRenameDialog,
      handleOpenMoveDialog,
      handleToggleFavorite,
    };
  }, [
    handleOpenFileDialog,
    handleOpenFolderDialog,
    handleDelete,
    handleImportFile,
    handleOpenRenameDialog,
    handleOpenMoveDialog,
    handleToggleFavorite,
  ]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      const container = treeContainerRef.current;
      if (container && event.target instanceof Node && !container.contains(event.target)) {
        return;
      }

      const { openFileDialog, openFolderDialog, handleDelete: deleteHandler, handleImportFile: importHandler, handleOpenRenameDialog: renameHandler, handleOpenMoveDialog: moveHandler, handleToggleFavorite: toggleFavoriteHandler } = shortcutHandlersRef.current;
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
        importHandler();
        return;
      }

      if ((mod && key.toLowerCase() === 'r') || key === 'F2') {
        event.preventDefault();
        renameHandler();
        return;
      }

      if (mod && key.toLowerCase() === 'm') {
        event.preventDefault();
        moveHandler();
        return;
      }

      if (mod && shift && key.toLowerCase() === 's') {
        event.preventDefault();
        toggleFavoriteHandler();
        return;
      }

      if (key === 'Delete') {
        event.preventDefault();
        deleteHandler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderTree = (node: FileTreeNode, _parentPath: string = '') => {
    const isExpanded = expanded.includes(node.id);

    let icon;
    if (node.type === 'folder') {
      icon = (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
          {isExpanded ? (
            <MinusIcon fontSize="small" sx={{ color: 'primary.main' }} />
          ) : (
            <PlusIcon fontSize="small" sx={{ color: 'primary.main' }} />
          )}
          <FolderIcon fontSize="small" />
        </Box>
      );
    } else {
      icon = getFileIcon(node.fileType);
    }

    const children = node.children || [];

    return (
      <TreeItem
        key={node.id}
        nodeId={node.id}
        label={
          <Box
            sx={treeItemLabelSx}
            onContextMenu={(event) => handleTreeContextMenu(event, node)}
            data-node-id={node.id}
            data-node-path={node.path}
          >
            <span style={{ flex: 1 }}>{node.name}</span>
          </Box>
        }
        icon={icon}
      >
        {children.map((child) => renderTree(child, node.path))}
      </TreeItem>
    );
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
      target.classList.contains('MuiBox-root') ||
      (!target.closest('.MuiTreeItem-root') && !target.closest('.MuiTreeView-root'))
    ) {
      setSelectedNode(null);
      treeContainerRef.current?.focus();
    }
  };

  const handleFavoriteClick = (node: FileTreeNode) => {
    setSelectedNode(node);
    treeContainerRef.current?.focus();

    const parentPath = getParentPath(node.path);
    if (parentPath) {
      const parentNode = findNodeByPath(tree, parentPath);
      if (parentNode) {
        setExpanded((prev) => (prev.includes(parentNode.id) ? prev : [...prev, parentNode.id]));
      }
    }

    if (node.type === 'file') {
      onSelectFile(node.path, 'file');
    }
  };

  const handleFavoriteContextMenu = (
    event: React.MouseEvent<HTMLElement>,
    path: string,
  ) => {
    event.preventDefault();
    setFavoriteMenuState({
      anchorEl: event.currentTarget,
      path,
    });
  };

  const handleCloseFavoriteMenu = () => {
    setFavoriteMenuState(null);
  };

  const handleRemoveFavorite = () => {
    if (!favoriteMenuState?.path) return;
    setFavorites((prev) => prev.filter((path) => path !== favoriteMenuState.path));
    handleCloseFavoriteMenu();
  };

  const handleTreeContextMenu = (event: React.MouseEvent<HTMLElement>, node?: FileTreeNode) => {
    event.preventDefault();
    event.stopPropagation();

    const position = { top: event.clientY, left: event.clientX };

    if (node) {
      setSelectedNode(node);
      treeContainerRef.current?.focus();
      setTreeContextMenuState({
        node,
        mode: 'node',
        position,
      });
      setFavoriteMenuState(null);
      return;
    }

    if (selectedNode) {
      return;
    }

    treeContainerRef.current?.focus();
    setTreeContextMenuState({
      node: null,
      mode: 'empty',
      position,
    });
    setFavoriteMenuState(null);
  };

  const handleCloseTreeContextMenu = () => {
    setTreeContextMenuState(null);
  };

  const handleTreeContextMenuAction = (
    action: 'rename' | 'move' | 'favorite' | 'delete',
    node: FileTreeNode | null
  ) => {
    handleCloseTreeContextMenu();
    if (!node) return;

    switch (action) {
      case 'rename':
        handleOpenRenameDialog(node);
        break;
      case 'move':
        handleOpenMoveDialog(node);
        break;
      case 'favorite':
        handleToggleFavorite(node);
        break;
      case 'delete':
        handleDelete(node);
        break;
    }
  };

  const getCreationLocationText = () => {
    if (!selectedNode) {
      return FILE_TREE_TEXT.createLocationRoot;
    }
    if (selectedNode.type === 'folder') {
      return `${FILE_TREE_TEXT.createLocationPrefix}${selectedNode.path || 'root'}`;
    }
    const parentPath = getParentPath(selectedNode.path);
    return parentPath
      ? `${FILE_TREE_TEXT.createLocationPrefix}${parentPath}`
      : FILE_TREE_TEXT.createLocationRoot;
  };

  const favoriteNodes = favorites
    .map((path) => findNodeByPath(tree, path))
    .filter((node): node is FileTreeNode => Boolean(node));

  const selectedNodeIsFavorite = !!selectedNode && favorites.includes(selectedNode.path);
  const treeContextMenuMode = treeContextMenuState?.mode;
  const treeContextMenuNode = treeContextMenuState?.node || null;
  const showNodeContextMenu = treeContextMenuMode === 'node';
  const showEmptyContextMenu = treeContextMenuMode === 'empty';
  const contextNodeIsFavorite = Boolean(treeContextMenuNode && favorites.includes(treeContextMenuNode.path));
  const treeContextMenuPosition = treeContextMenuState?.position || null;

  return (
    <Box sx={rootSx}>
      <Toolbar variant="dense" sx={toolbarSx}>
        <Tooltip title={FILE_TREE_TEXT.newFile}>
          <IconButton size="small" onClick={handleOpenFileDialog}>
            <NoteAddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={FILE_TREE_TEXT.newFolder}>
          <IconButton size="small" onClick={handleOpenFolderDialog}>
            <CreateFolderIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={FILE_TREE_TEXT.importFile}>
          <IconButton size="small" onClick={handleImportFile}>
            <ImportIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={FILE_TREE_TEXT.rename}>
          <span>
            <IconButton
              size="small"
              onClick={() => handleOpenRenameDialog()}
              disabled={!selectedNode}
            >
              <RenameIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={selectedNodeIsFavorite ? FILE_TREE_TEXT.removeFromFavorites : FILE_TREE_TEXT.addToFavorites}>
          <span>
            <IconButton
              size="small"
              onClick={() => handleToggleFavorite()}
              disabled={!selectedNode}
              color={selectedNodeIsFavorite ? 'primary' : 'default'}
            >
              {selectedNodeIsFavorite ? (
                <FavoriteIcon fontSize="small" />
              ) : (
                <FavoriteBorderIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={FILE_TREE_TEXT.moveToFolder}>
          <span>
            <IconButton
              size="small"
              onClick={() => handleOpenMoveDialog()}
              disabled={!selectedNode}
            >
              <MoveIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={FILE_TREE_TEXT.delete}>
          <span>
            <IconButton
              size="small"
              onClick={() => handleDelete()}
              disabled={!selectedNode}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Box sx={{ flexGrow: 1 }} />
      </Toolbar>

      {favoriteNodes.length > 0 && (
        <Box sx={favoritesSectionSx} data-testid="favorites-section">
          <Typography variant="caption" color="text.secondary">
            {FILE_TREE_TEXT.favoritesTitle}
          </Typography>
          <Box sx={favoriteListSx}>
            {favoriteNodes.map((node) => (
              <Tooltip
                key={node.path}
                title={node.path}
                placement="top"
                arrow
              >
                <Button
                  size="small"
                  variant="text"
                  disableRipple
                  onClick={() => handleFavoriteClick(node)}
                  onContextMenu={(event) => handleFavoriteContextMenu(event, node.path)}
                  sx={favoriteItemSx}
                >
                  {node.name}
                </Button>
              </Tooltip>
            ))}
          </Box>
        </Box>
      )}

      <Menu
        id="favorite-context-menu"
        anchorEl={favoriteMenuState?.anchorEl || null}
        data-testid="favorite-context-menu"
        open={Boolean(favoriteMenuState?.anchorEl)}
        onClose={handleCloseFavoriteMenu}
        MenuListProps={{ 'aria-label': 'Favorite actions' }}
      >
        <MenuItem
          data-testid="favorite-context-menu-remove"
          onClick={handleRemoveFavorite}
        >
          <ListItemIcon>
            <FavoriteIcon fontSize="small" />
          </ListItemIcon>
          {FILE_TREE_TEXT.favoritesContextMenuItem}
        </MenuItem>
      </Menu>

      <Menu
        id="tree-context-menu-empty"
        data-testid="tree-context-menu-empty"
        anchorReference="anchorPosition"
        anchorPosition={treeContextMenuPosition || undefined}
        open={showEmptyContextMenu}
        onClose={handleCloseTreeContextMenu}
        MenuListProps={{ 'aria-label': 'Tree background actions' }}
      >
        <MenuItem
          data-testid="tree-context-new-file"
          onClick={() => {
            handleCloseTreeContextMenu();
            handleOpenFileDialog();
          }}
        >
          <ListItemIcon>
            <NoteAddIcon fontSize="small" />
          </ListItemIcon>
          {FILE_TREE_TEXT.newFile}
        </MenuItem>
        <MenuItem
          data-testid="tree-context-new-folder"
          onClick={() => {
            handleCloseTreeContextMenu();
            handleOpenFolderDialog();
          }}
        >
          <ListItemIcon>
            <CreateFolderIcon fontSize="small" />
          </ListItemIcon>
          {FILE_TREE_TEXT.newFolder}
        </MenuItem>
        <MenuItem
          data-testid="tree-context-import"
          onClick={() => {
            handleCloseTreeContextMenu();
            handleImportFile();
          }}
        >
          <ListItemIcon>
            <ImportIcon fontSize="small" />
          </ListItemIcon>
          {FILE_TREE_TEXT.importFile}
        </MenuItem>
      </Menu>

      <Menu
        id="tree-context-menu"
        data-testid="tree-context-menu"
        anchorReference="anchorPosition"
        anchorPosition={treeContextMenuPosition || undefined}
        open={showNodeContextMenu}
        onClose={handleCloseTreeContextMenu}
        MenuListProps={{ 'aria-label': 'Tree item actions' }}
      >
        <MenuItem
          data-testid="tree-context-rename"
          onClick={() => handleTreeContextMenuAction('rename', treeContextMenuNode)}
        >
          <ListItemIcon>
            <RenameIcon fontSize="small" />
          </ListItemIcon>
          {FILE_TREE_TEXT.rename}
        </MenuItem>
        <MenuItem
          data-testid="tree-context-move"
          onClick={() => handleTreeContextMenuAction('move', treeContextMenuNode)}
        >
          <ListItemIcon>
            <MoveIcon fontSize="small" />
          </ListItemIcon>
          {FILE_TREE_TEXT.moveToFolder}
        </MenuItem>
        <MenuItem
          data-testid="tree-context-favorite"
          onClick={() => handleTreeContextMenuAction('favorite', treeContextMenuNode)}
        >
          <ListItemIcon>
            {contextNodeIsFavorite ? (
              <FavoriteIcon fontSize="small" />
            ) : (
              <FavoriteBorderIcon fontSize="small" />
            )}
          </ListItemIcon>
          {contextNodeIsFavorite ? FILE_TREE_TEXT.removeFromFavorites : FILE_TREE_TEXT.addToFavorites}
        </MenuItem>
        <MenuItem
          data-testid="tree-context-delete"
          onClick={() => handleTreeContextMenuAction('delete', treeContextMenuNode)}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          {FILE_TREE_TEXT.delete}
        </MenuItem>
      </Menu>

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
          selected={selectedFile || undefined}
          onNodeSelect={handleNodeSelect}
        >
          {tree.map((node) => renderTree(node, ''))}
        </TreeView>
      </Box>

      <Dialog
        data-testid="create-file-dialog"
        open={createFileDialogOpen}
        onClose={() => {
          setCreateFileDialogOpen(false);
          setErrorMessage('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{FILE_TREE_TEXT.createFileTitle}</DialogTitle>
        <DialogContent>
          <Box sx={dialogInfoSx}>
            <Typography variant="caption" color="text.secondary">
              {getCreationLocationText()}
            </Typography>
          </Box>
          <TextField
            autoFocus
            margin="dense"
            label={FILE_TREE_TEXT.fileNameLabel}
            fullWidth
            value={newItemName}
            onChange={(e) => {
              setNewItemName(e.target.value);
              setErrorMessage('');
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !creating) {
                handleCreateFile();
              }
            }}
            placeholder={FILE_TREE_TEXT.filePlaceholder}
            helperText={!newItemName.includes('.') ? FILE_TREE_TEXT.fileExtensionHint : ' '}
            error={!!errorMessage}
          />
          {errorMessage && (
            <Box sx={dialogErrorSx}>
              {errorMessage}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCreateFileDialogOpen(false);
              setErrorMessage('');
            }}
          >
            {FILE_TREE_TEXT.cancel}
          </Button>
          <Button
            onClick={handleCreateFile}
            disabled={creating || !newItemName.trim()}
            variant="contained"
          >
            {creating ? FILE_TREE_TEXT.creating : FILE_TREE_TEXT.create}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        data-testid="create-folder-dialog"
        open={createFolderDialogOpen}
        onClose={() => {
          setCreateFolderDialogOpen(false);
          setErrorMessage('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{FILE_TREE_TEXT.createFolderTitle}</DialogTitle>
        <DialogContent>
          <Box sx={dialogInfoSx}>
            <Typography variant="caption" color="text.secondary">
              {getCreationLocationText()}
            </Typography>
          </Box>
          <TextField
            autoFocus
            margin="dense"
            label={FILE_TREE_TEXT.folderNameLabel}
            fullWidth
            value={newItemName}
            onChange={(e) => {
              setNewItemName(e.target.value);
              setErrorMessage('');
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !creating) {
                handleCreateFolder();
              }
            }}
            placeholder={FILE_TREE_TEXT.folderPlaceholder}
            error={!!errorMessage}
          />
          {errorMessage && (
            <Box sx={dialogErrorSx}>
              {errorMessage}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCreateFolderDialogOpen(false);
              setErrorMessage('');
            }}
          >
            {FILE_TREE_TEXT.cancel}
          </Button>
          <Button
            onClick={handleCreateFolder}
            disabled={creating || !newItemName.trim()}
            variant="contained"
          >
            {creating ? FILE_TREE_TEXT.creating : FILE_TREE_TEXT.create}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        data-testid="rename-dialog"
        open={renameDialogOpen}
        onClose={() => {
          setRenameDialogOpen(false);
          setErrorMessage('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedNode?.type === 'folder' ? FILE_TREE_TEXT.renameFolderTitle : FILE_TREE_TEXT.renameFileTitle}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={FILE_TREE_TEXT.newNameLabel}
            fullWidth
            value={newItemName}
            onChange={(e) => {
              setNewItemName(e.target.value);
              setErrorMessage('');
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !creating) {
                handleRename();
              }
            }}
            placeholder={selectedNode?.name || ''}
            error={!!errorMessage}
          />
          {errorMessage && (
            <Box sx={dialogErrorSx}>
              {errorMessage}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRenameDialogOpen(false);
              setErrorMessage('');
            }}
          >
            {FILE_TREE_TEXT.cancel}
          </Button>
          <Button
            onClick={handleRename}
            disabled={creating || !newItemName.trim()}
            variant="contained"
          >
            {creating ? FILE_TREE_TEXT.renaming : FILE_TREE_TEXT.renameAction}
          </Button>
        </DialogActions>
      </Dialog>

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
