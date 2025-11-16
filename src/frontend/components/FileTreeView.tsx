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
} from '@mui/material';
import {
  Folder as FolderIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Code as CodeIcon,
  TextSnippet as TextIcon,
  InsertDriveFile as FileIcon,
  AddBox as PlusIcon,
  IndeterminateCheckBox as MinusIcon,
  CreateNewFolder as CreateFolderIcon,
  NoteAdd as NoteAddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import type { FileTreeNode, FileType } from '../../shared/types';

interface FileTreeViewProps {
  tree: FileTreeNode[];
  selectedFile: string | null;
  onSelectFile: (path: string, type: 'file' | 'folder') => void;
  onCreateFile: (parentPath: string, fileName: string) => Promise<void>;
  onCreateFolder: (parentPath: string, folderName: string) => Promise<void>;
  onDelete: (path: string) => Promise<void>;
  onRename: (oldPath: string, newPath: string) => Promise<void>;
}

const getFileIcon = (fileType?: FileType) => {
  switch (fileType) {
    case 'markdown':
      return <DescriptionIcon fontSize="small" sx={{ color: '#1976d2' }} />;
    case 'image':
      return <ImageIcon fontSize="small" sx={{ color: '#f50057' }} />;
    case 'pdf':
      return <PdfIcon fontSize="small" sx={{ color: '#d32f2f' }} />;
    case 'code':
      return <CodeIcon fontSize="small" sx={{ color: '#388e3c' }} />;
    case 'text':
      return <TextIcon fontSize="small" sx={{ color: '#757575' }} />;
    case 'json':
      return <CodeIcon fontSize="small" sx={{ color: '#ff9800' }} />;
    default:
      return <FileIcon fontSize="small" sx={{ color: '#757575' }} />;
  }
};

export function FileTreeView({ 
  tree, 
  selectedFile, 
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onRename,
}: FileTreeViewProps) {
  const [createFileDialogOpen, setCreateFileDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedNode, setSelectedNode] = useState<FileTreeNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<FileTreeNode | null>(null);

  // Clear input and error when dialog opens
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

  const handleCreateFile = async () => {
    const trimmedName = newItemName.trim();
    if (!trimmedName) return;
    
    // Auto-add .md extension if no extension is present
    let fileName = trimmedName;
    if (!fileName.includes('.')) {
      fileName = `${fileName}.md`;
    }

    // Validate filename
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(fileName)) {
      setErrorMessage('File name contains invalid characters: < > : " / \\ | ? *');
      return;
    }

    setCreating(true);
    setErrorMessage('');
    
    try {
      // Determine parent path based on selection
      let parentPath = '';
      if (selectedNode) {
        if (selectedNode.type === 'folder') {
          // Create inside the selected folder
          parentPath = selectedNode.path;
        } else {
          // Create in the same folder as the selected file
          const lastSlash = selectedNode.path.lastIndexOf('/');
          parentPath = lastSlash > 0 ? selectedNode.path.substring(0, lastSlash) : '';
        }
      }
      
      await onCreateFile(parentPath, fileName);
      // Success - close dialog
      setCreateFileDialogOpen(false);
      setNewItemName('');
      setErrorMessage('');
    } catch (error: any) {
      // Show error to user
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

    // Validate folder name
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      setErrorMessage('Folder name contains invalid characters: < > : " / \\ | ? *');
      return;
    }
    
    setCreating(true);
    setErrorMessage('');
    
    try {
      // Determine parent path based on selection
      let parentPath = '';
      if (selectedNode) {
        if (selectedNode.type === 'folder') {
          // Create inside the selected folder
          parentPath = selectedNode.path;
        } else {
          // Create in the same folder as the selected file
          const lastSlash = selectedNode.path.lastIndexOf('/');
          parentPath = lastSlash > 0 ? selectedNode.path.substring(0, lastSlash) : '';
        }
      }
      
      await onCreateFolder(parentPath, trimmedName);
      // Success - close dialog
      setCreateFolderDialogOpen(false);
      setNewItemName('');
      setErrorMessage('');
    } catch (error: any) {
      // Show error to user
      const errorMsg = error.message || 'Failed to create folder';
      if (errorMsg.includes('exists') || errorMsg.includes('EEXIST')) {
        setErrorMessage(`Folder "${trimmedName}" already exists`);
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

  const handleDelete = async () => {
    if (!selectedFile) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedFile}?`)) {
      try {
        await onDelete(selectedFile);
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  // Helper to find a node by ID
  const findNode = (nodes: FileTreeNode[], id: string): FileTreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleDragStart = (node: FileTreeNode) => (e: React.DragEvent) => {
    setDraggedNode(node);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetNode: FileTreeNode) => async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedNode || draggedNode.id === targetNode.id) {
      setDraggedNode(null);
      return;
    }

    // Only allow dropping into folders
    if (targetNode.type !== 'folder') {
      setDraggedNode(null);
      return;
    }

    // Check if trying to drop a folder into itself or its children
    if (draggedNode.type === 'folder' && targetNode.path.startsWith(draggedNode.path)) {
      console.warn('Cannot move a folder into itself or its children');
      setDraggedNode(null);
      return;
    }

    try {
      // Calculate new path
      const newPath = `${targetNode.path}/${draggedNode.name}`;
      
      // Call the parent's rename handler
      await onRename(draggedNode.path, newPath);
    } catch (error: any) {
      console.error('Failed to move:', error);
      alert(`Failed to move: ${error.message || 'Unknown error'}`);
    } finally {
      setDraggedNode(null);
    }
  };

  const renderTree = (node: FileTreeNode) => {
    const icon = node.type === 'folder' ? <FolderIcon fontSize="small" /> : getFileIcon(node.fileType);
    const isDragging = draggedNode?.id === node.id;

    return (
      <TreeItem 
        key={node.id} 
        nodeId={node.id} 
        label={
          <Box
            draggable
            onDragStart={handleDragStart(node)}
            onDragOver={node.type === 'folder' ? handleDragOver : undefined}
            onDrop={node.type === 'folder' ? handleDrop(node) : undefined}
            sx={{
              opacity: isDragging ? 0.5 : 1,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            {node.name}
          </Box>
        }
        icon={icon}
      >
        {node.children && node.children.map((child) => renderTree(child))}
      </TreeItem>
    );
  };

  const handleNodeSelect = (_event: React.SyntheticEvent, nodeId: string) => {
    const node = findNode(tree, nodeId);
    if (node) {
      setSelectedNode(node);
      // Only open files in the editor, not folders
      if (node.type === 'file') {
        onSelectFile(node.path, node.type);
      }
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar variant="dense" sx={{ minHeight: '48px', borderBottom: '1px solid #e0e0e0' }}>
        <Tooltip title="New File">
          <IconButton size="small" onClick={handleOpenFileDialog}>
            <NoteAddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="New Folder">
          <IconButton size="small" onClick={handleOpenFolderDialog}>
            <CreateFolderIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <span>
            <IconButton 
              size="small" 
              onClick={handleDelete}
              disabled={!selectedFile}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Toolbar>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        <TreeView
          defaultCollapseIcon={<MinusIcon />}
          defaultExpandIcon={<PlusIcon />}
          selected={selectedFile || undefined}
          onNodeSelect={handleNodeSelect}
        >
          {tree.map((node) => renderTree(node))}
        </TreeView>
      </Box>

      {/* Create File Dialog */}
      <Dialog 
        open={createFileDialogOpen} 
        onClose={() => {
          setCreateFileDialogOpen(false);
          setErrorMessage('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New File</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="File Name"
            fullWidth
            value={newItemName}
            onChange={(e) => {
              setNewItemName(e.target.value);
              setErrorMessage(''); // Clear error when user types
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !creating) {
                handleCreateFile();
              }
            }}
            placeholder="my-note (extension optional)"
            helperText={!newItemName.includes('.') ? "Extension will be auto-added as .md if not specified" : " "}
            error={!!errorMessage}
          />
          {errorMessage && (
            <Box sx={{ mt: 1, color: 'error.main', fontSize: '0.875rem' }}>
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
            Cancel
          </Button>
          <Button 
            onClick={handleCreateFile} 
            disabled={creating || !newItemName.trim()}
            variant="contained"
          >
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog 
        open={createFolderDialogOpen} 
        onClose={() => {
          setCreateFolderDialogOpen(false);
          setErrorMessage('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            value={newItemName}
            onChange={(e) => {
              setNewItemName(e.target.value);
              setErrorMessage(''); // Clear error when user types
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !creating) {
                handleCreateFolder();
              }
            }}
            placeholder="my-folder"
            error={!!errorMessage}
          />
          {errorMessage && (
            <Box sx={{ mt: 1, color: 'error.main', fontSize: '0.875rem' }}>
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
            Cancel
          </Button>
          <Button 
            onClick={handleCreateFolder} 
            disabled={creating || !newItemName.trim()}
            variant="contained"
          >
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

