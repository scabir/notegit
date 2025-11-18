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
  Description as DescriptionIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Code as CodeIcon,
  TextSnippet as TextIcon,
  InsertDriveFile as FileIcon,
  Add as PlusIcon,
  Remove as MinusIcon,
  CreateNewFolder as CreateFolderIcon,
  NoteAdd as NoteAddIcon,
  Delete as DeleteIcon,
  FileUpload as ImportIcon,
  DriveFileRenameOutline as RenameIcon,
  Clear as ClearIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  DriveFileMove as MoveIcon,
} from '@mui/icons-material';
import { MoveToFolderDialog } from './MoveToFolderDialog';
import type { FileTreeNode, FileType } from '../../shared/types';

interface FileTreeViewProps {
  tree: FileTreeNode[];
  selectedFile: string | null;
  onSelectFile: (path: string, type: 'file' | 'folder') => void;
  onCreateFile: (parentPath: string, fileName: string) => Promise<void>;
  onCreateFolder: (parentPath: string, folderName: string) => Promise<void>;
  onDelete: (path: string) => Promise<void>;
  onRename: (oldPath: string, newPath: string) => Promise<void>;
  onImport: (sourcePath: string, targetPath: string) => Promise<void>;
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
  onImport,
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
  
  // State for custom ordering (per-folder ordering)
  // Key is parent path (empty string for root), value is array of node IDs in order
  const [customOrder, setCustomOrder] = useState<Record<string, string[]>>({});

  // Auto-expand parent folders when a file is selected
  React.useEffect(() => {
    if (selectedFile) {
      const pathParts = selectedFile.split('/');
      const foldersToExpand: string[] = [];
      
      // Build all parent paths
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderPath = pathParts.slice(0, i + 1).join('/');
        foldersToExpand.push(folderPath);
      }
      
      // Expand all parent folders
      if (foldersToExpand.length > 0) {
        setExpanded((prev) => {
          const newExpanded = new Set([...prev, ...foldersToExpand]);
          return Array.from(newExpanded);
        });
      }
    }
  }, [selectedFile]);

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

  const handleOpenRenameDialog = () => {
    if (!selectedNode) return;
    
    // Set the current name (just the filename/folder name, not the full path)
    const currentName = selectedNode.name;
    setNewItemName(currentName);
    setErrorMessage('');
    setRenameDialogOpen(true);
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
      let parentNodeId: string | null = null;
      
      if (selectedNode) {
        if (selectedNode.type === 'folder') {
          // Create inside the selected folder
          parentPath = selectedNode.path;
          parentNodeId = selectedNode.id;
        } else {
          // Create in the same folder as the selected file
          const lastSlash = selectedNode.path.lastIndexOf('/');
          parentPath = lastSlash > 0 ? selectedNode.path.substring(0, lastSlash) : '';
          
          // Find parent folder node ID
          if (parentPath) {
            const parentNode = findNodeByPath(tree, parentPath);
            if (parentNode) {
              parentNodeId = parentNode.id;
            }
          }
        }
      }
      
      await onCreateFile(parentPath, fileName);
      
      // Auto-expand the parent folder
      if (parentNodeId && !expanded.includes(parentNodeId)) {
        setExpanded([...expanded, parentNodeId]);
      }
      
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
      let parentNodeId: string | null = null;
      
      if (selectedNode) {
        if (selectedNode.type === 'folder') {
          // Create inside the selected folder
          parentPath = selectedNode.path;
          parentNodeId = selectedNode.id;
        } else {
          // Create in the same folder as the selected file
          const lastSlash = selectedNode.path.lastIndexOf('/');
          parentPath = lastSlash > 0 ? selectedNode.path.substring(0, lastSlash) : '';
          
          // Find parent folder node ID
          if (parentPath) {
            const parentNode = findNodeByPath(tree, parentPath);
            if (parentNode) {
              parentNodeId = parentNode.id;
            }
          }
        }
      }
      
      await onCreateFolder(parentPath, trimmedName);
      
      // Auto-expand the parent folder
      if (parentNodeId && !expanded.includes(parentNodeId)) {
        setExpanded([...expanded, parentNodeId]);
      }
      
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

  const handleRename = async () => {
    if (!selectedNode) return;
    
    const trimmedName = newItemName.trim();
    if (!trimmedName) {
      setErrorMessage('Name cannot be empty');
      return;
    }

    // Validate filename
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      setErrorMessage('Name contains invalid characters: < > : " / \\ | ? *');
      return;
    }

    // Check if name hasn't changed
    if (trimmedName === selectedNode.name) {
      setRenameDialogOpen(false);
      return;
    }

    setCreating(true);
    setErrorMessage('');

    try {
      // Construct the new path
      const oldPath = selectedNode.path;
      const lastSlash = oldPath.lastIndexOf('/');
      const parentPath = lastSlash > 0 ? oldPath.substring(0, lastSlash) : '';
      const newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;

      await onRename(oldPath, newPath);

      // Success - close dialog
      setRenameDialogOpen(false);
      setNewItemName('');
      setErrorMessage('');
    } catch (error: any) {
      console.error('Failed to rename:', error);
      
      // Check for specific error messages
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
    const message = `Are you sure you want to delete ${itemType} "${selectedNode.name}"?${
      selectedNode.type === 'folder' ? ' All contents will be deleted.' : ''
    }`;
    
    if (window.confirm(message)) {
      try {
        await onDelete(selectedNode.path);
        // Clear selection after successful deletion
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
      
      // Open file picker dialog
      const result = await window.notegitApi.dialog.showOpenDialog({
        properties: ['openFile'],
        title: 'Select file to import',
      });

      if (result.canceled || result.filePaths.length === 0) {
        return;
      }

      const sourcePath = result.filePaths[0];
      const fileName = sourcePath.split('/').pop() || 'imported_file';

      // Determine target path based on selection
      let targetPath = fileName;
      if (selectedNode) {
        if (selectedNode.type === 'folder') {
          // Import into the selected folder
          targetPath = `${selectedNode.path}/${fileName}`;
        } else {
          // Import into the same folder as the selected file
          const lastSlash = selectedNode.path.lastIndexOf('/');
          const parentPath = lastSlash > 0 ? selectedNode.path.substring(0, lastSlash) : '';
          targetPath = parentPath ? `${parentPath}/${fileName}` : fileName;
        }
      }

      // Call the import handler
      await onImport(sourcePath, targetPath);
    } catch (error) {
      console.error('Failed to import file:', error);
      alert(`Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Helper to find a node by path
  const findNodeByPath = (nodes: FileTreeNode[], path: string): FileTreeNode | null => {
    for (const node of nodes) {
      if (node.path === path) return node;
      if (node.children) {
        const found = findNodeByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper to get siblings and parent path
  const getSiblingsAndParent = (node: FileTreeNode): { siblings: FileTreeNode[]; parentPath: string } => {
    const parentPath = node.path.includes('/')
      ? node.path.substring(0, node.path.lastIndexOf('/'))
      : '';
    
    // Find siblings
    const findSiblings = (nodes: FileTreeNode[], targetParentPath: string): FileTreeNode[] | null => {
      if (targetParentPath === '') {
        // Root level
        return nodes;
      }
      
      for (const n of nodes) {
        if (n.path === targetParentPath && n.children) {
          return n.children;
        }
        if (n.children) {
          const found = findSiblings(n.children, targetParentPath);
          if (found) return found;
        }
      }
      return null;
    };
    
    const siblings = findSiblings(tree, parentPath) || [];
    return { siblings, parentPath };
  };

  // Apply custom ordering to a list of nodes
  const applyCustomOrder = (nodes: FileTreeNode[], parentPath: string): FileTreeNode[] => {
    const order = customOrder[parentPath];
    if (!order) return nodes;
    
    // Sort nodes according to custom order
    const ordered = [...nodes].sort((a, b) => {
      const indexA = order.indexOf(a.id);
      const indexB = order.indexOf(b.id);
      
      // If both in order, use order
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only one in order, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // Otherwise maintain original order
      return 0;
    });
    
    return ordered;
  };

  // Move item up in its folder
  const handleMoveUp = (node: FileTreeNode) => {
    const { siblings, parentPath } = getSiblingsAndParent(node);
    const orderedSiblings = applyCustomOrder(siblings, parentPath);
    const currentIndex = orderedSiblings.findIndex(n => n.id === node.id);
    
    if (currentIndex <= 0) return; // Already at top
    
    // Swap with previous
    const newOrder = orderedSiblings.map(n => n.id);
    [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
    
    setCustomOrder(prev => ({
      ...prev,
      [parentPath]: newOrder,
    }));
  };

  // Move item down in its folder
  const handleMoveDown = (node: FileTreeNode) => {
    const { siblings, parentPath } = getSiblingsAndParent(node);
    const orderedSiblings = applyCustomOrder(siblings, parentPath);
    const currentIndex = orderedSiblings.findIndex(n => n.id === node.id);
    
    if (currentIndex === -1 || currentIndex >= orderedSiblings.length - 1) return; // Already at bottom
    
    // Swap with next
    const newOrder = orderedSiblings.map(n => n.id);
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
    
    setCustomOrder(prev => ({
      ...prev,
      [parentPath]: newOrder,
    }));
  };

  // Handle move to folder via dialog
  const handleMoveToFolder = async (destinationPath: string) => {
    if (!selectedNode) return;
    
    try {
      // Calculate new path
      const newPath = destinationPath ? `${destinationPath}/${selectedNode.name}` : selectedNode.name;
      
      // Call the rename handler (which moves the item)
      await onRename(selectedNode.path, newPath);
      
      // Close dialog
      setMoveDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to move:', error);
      alert(`Failed to move: ${error.message || 'Unknown error'}`);
    }
  };

  const renderTree = (node: FileTreeNode, parentPath: string = '') => {
    const isExpanded = expanded.includes(node.id);
    const { siblings } = getSiblingsAndParent(node);
    const orderedSiblings = applyCustomOrder(siblings, parentPath);
    const currentIndex = orderedSiblings.findIndex(n => n.id === node.id);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === orderedSiblings.length - 1;
    
    // Determine icon based on node type and expansion state
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

    // Apply ordering to children if folder
    const children = node.children ? applyCustomOrder(node.children, node.path) : [];

    return (
      <TreeItem 
        key={node.id} 
        nodeId={node.id} 
        label={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pr: 1,
              userSelect: 'none',
            }}
          >
            <span style={{ flex: 1 }}>{node.name}</span>
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                opacity: 0,
                '.MuiTreeItem-content:hover &': {
                  opacity: 1,
                },
              }}
            >
              <Tooltip title="Move up">
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveUp(node);
                    }}
                    disabled={isFirst}
                    sx={{ padding: '2px' }}
                  >
                    <ArrowUpIcon sx={{ fontSize: '14px' }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Move down">
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveDown(node);
                    }}
                    disabled={isLast}
                    sx={{ padding: '2px' }}
                  >
                    <ArrowDownIcon sx={{ fontSize: '14px' }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Move to folder">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node);
                    setMoveDialogOpen(true);
                  }}
                  sx={{ padding: '2px' }}
                >
                  <MoveIcon sx={{ fontSize: '14px' }} />
                </IconButton>
              </Tooltip>
            </Box>
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
      // Only open files in the editor, not folders
      if (node.type === 'file') {
        onSelectFile(node.path, node.type);
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedNode(null);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Check if the click is directly on the container (empty space)
    // and not on a TreeView element
    const target = e.target as HTMLElement;
    
    // If clicking on the padding area or directly on the container
    if (
      target.classList.contains('tree-container') || 
      target.classList.contains('MuiBox-root') ||
      (!target.closest('.MuiTreeItem-root') && !target.closest('.MuiTreeView-root'))
    ) {
      setSelectedNode(null);
    }
  };

  // Helper to get location text for create dialogs
  const getCreationLocationText = () => {
    if (!selectedNode) {
      return 'Will be created in root directory';
    }
    if (selectedNode.type === 'folder') {
      return `Will be created in: ${selectedNode.path || 'root'}`;
    }
    const lastSlash = selectedNode.path.lastIndexOf('/');
    const parentPath = lastSlash > 0 ? selectedNode.path.substring(0, lastSlash) : '';
    return parentPath ? `Will be created in: ${parentPath}` : 'Will be created in root directory';
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
        <Tooltip title="Import File">
          <IconButton size="small" onClick={handleImportFile}>
            <ImportIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Rename">
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
        <Tooltip title="Delete">
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
        <Tooltip title="Clear selection (create in root)">
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
        sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 1,
          position: 'relative',
        }}
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
          {applyCustomOrder(tree, '').map((node) => renderTree(node, ''))}
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
          <Box sx={{ mb: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {getCreationLocationText()}
            </Typography>
          </Box>
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
          <Box sx={{ mb: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {getCreationLocationText()}
            </Typography>
          </Box>
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

      {/* Rename Dialog */}
      <Dialog 
        open={renameDialogOpen} 
        onClose={() => {
          setRenameDialogOpen(false);
          setErrorMessage('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rename {selectedNode?.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Name"
            fullWidth
            value={newItemName}
            onChange={(e) => {
              setNewItemName(e.target.value);
              setErrorMessage(''); // Clear error when user types
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
            <Box sx={{ mt: 1, color: 'error.main', fontSize: '0.875rem' }}>
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
            Cancel
          </Button>
          <Button 
            onClick={handleRename} 
            disabled={creating || !newItemName.trim()}
            variant="contained"
          >
            {creating ? 'Renaming...' : 'Rename'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Move to Folder Dialog */}
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

