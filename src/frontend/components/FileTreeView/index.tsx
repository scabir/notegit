import React, { useState } from 'react';
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
  Clear as ClearIcon,
  DriveFileMove as MoveIcon,
} from '@mui/icons-material';
import { MoveToFolderDialog } from '../MoveToFolderDialog';
import type { FileTreeNode } from '../../../shared/types';
import { FILE_TREE_TEXT, INVALID_NAME_CHARS } from './constants';
import {
  rootSx,
  toolbarSx,
  treeContainerSx,
  treeItemLabelSx,
  dialogInfoSx,
  dialogErrorSx,
} from './styles';
import { getFileIcon, normalizeName, findNode, findNodeByPath, getParentPath } from './utils';
import type { FileTreeViewProps } from './types';

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
  const [expanded, setExpanded] = useState<string[]>([]);

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

  const handleOpenRenameDialog = () => {
    if (!selectedNode) return;

    const currentName = selectedNode.name;
    setNewItemName(currentName);
    setErrorMessage('');
    setRenameDialogOpen(true);
  };
  const handleOpenMoveDialog = () => {
    if (!selectedNode) return;
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

  const handleDelete = async () => {
    if (!selectedNode) return;

    const itemType = selectedNode.type === 'folder' ? 'folder' : 'file';
    const message = `Are you sure you want to delete ${itemType} "${selectedNode.name}"?${selectedNode.type === 'folder' ? ' All contents will be deleted.' : ''
      }`;

    if (window.confirm(message)) {
      try {
        await onDelete(selectedNode.path);
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
      const newPath = destinationPath ? `${destinationPath}/${selectedNode.name}` : selectedNode.name;

      await onRename(selectedNode.path, newPath);

      setMoveDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to move:', error);
      alert(`Failed to move: ${error.message || 'Unknown error'}`);
    }
  };

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
          <Box sx={treeItemLabelSx}>
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
    }
  };

  const handleClearSelection = () => {
    setSelectedNode(null);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    if (
      target.classList.contains('tree-container') ||
      target.classList.contains('MuiBox-root') ||
      (!target.closest('.MuiTreeItem-root') && !target.closest('.MuiTreeView-root'))
    ) {
      setSelectedNode(null);
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
              onClick={handleOpenRenameDialog}
              disabled={!selectedNode}
            >
              <RenameIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={FILE_TREE_TEXT.moveToFolder}>
          <span>
            <IconButton
              size="small"
              onClick={handleOpenMoveDialog}
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
              onClick={handleDelete}
              disabled={!selectedNode}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title={FILE_TREE_TEXT.clearSelection}>
          <span>
            <IconButton
              size="small"
              onClick={handleClearSelection}
              disabled={!selectedNode}
              color={selectedNode ? 'primary' : 'default'}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Toolbar>

      <Box
        className="tree-container"
        sx={treeContainerSx}
        onClick={handleContainerClick}
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
