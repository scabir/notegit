import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { TreeView, TreeItem } from '@mui/x-tree-view';
import {
  Folder as FolderIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import type { FileTreeNode } from '../../shared/types';

interface MoveToFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (destinationPath: string) => void;
  itemToMove: FileTreeNode | null;
  tree: FileTreeNode[];
}

export function MoveToFolderDialog({
  open,
  onClose,
  onConfirm,
  itemToMove,
  tree,
}: MoveToFolderDialogProps) {
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>('');
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    if (open) {
      setSelectedFolderPath('');
      setError('');
    }
  }, [open]);

  const isDescendant = (ancestorPath: string, descendantPath: string): boolean => {
    if (!descendantPath) return false;
    if (!ancestorPath) return false;
    return descendantPath === ancestorPath || descendantPath.startsWith(ancestorPath + '/');
  };

  const getFolders = (nodes: FileTreeNode[], parentPath: string = ''): FileTreeNode[] => {
    const folders: FileTreeNode[] = [];
    
    for (const node of nodes) {
      if (node.type === 'folder') {
        folders.push(node);
        if (node.children) {
          folders.push(...getFolders(node.children, node.path));
        }
      }
    }
    
    return folders;
  };

  const allFolders = getFolders(tree);

  const renderFolderTree = (node: FileTreeNode): React.ReactNode => {
    if (node.type !== 'folder') return null;

    const isInvalid = itemToMove && (
      node.id === itemToMove.id ||
      (itemToMove.type === 'folder' && isDescendant(itemToMove.path, node.path))
    );

    return (
      <TreeItem
        key={node.id}
        nodeId={node.id}
        label={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              py: 0.5,
              opacity: isInvalid ? 0.4 : 1,
              cursor: isInvalid ? 'not-allowed' : 'pointer',
            }}
          >
            <FolderIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
            <Typography variant="body2">{node.name}</Typography>
          </Box>
        }
        disabled={isInvalid}
      >
        {node.children?.filter(child => child.type === 'folder').map(child => renderFolderTree(child))}
      </TreeItem>
    );
  };

  const handleConfirm = () => {
    if (!itemToMove) return;

    if (!selectedFolderPath && selectedFolderPath !== '') {
      setError('Please select a destination folder');
      return;
    }

    const currentParentPath = itemToMove.path.includes('/')
      ? itemToMove.path.substring(0, itemToMove.path.lastIndexOf('/'))
      : '';

    if (selectedFolderPath === currentParentPath) {
      setError('Item is already in this location');
      return;
    }

    const destinationFolder = allFolders.find(f => f.path === selectedFolderPath);
    if (destinationFolder?.children?.some(child => child.name === itemToMove.name)) {
      setError(`An item named "${itemToMove.name}" already exists in the destination folder`);
      return;
    }

    onConfirm(selectedFolderPath);
  };

  if (!itemToMove) return null;

  const currentLocation = itemToMove.path.includes('/')
    ? itemToMove.path.substring(0, itemToMove.path.lastIndexOf('/'))
    : 'root';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Move Item</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Moving: <strong>{itemToMove.name}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Current location: <strong>{currentLocation}</strong>
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Select destination folder:
        </Typography>

        <Box
          onClick={() => {
            setSelectedFolderPath('');
            setError('');
          }}
          sx={{
            p: 1,
            mb: 1,
            borderRadius: 1,
            cursor: 'pointer',
            bgcolor: selectedFolderPath === '' ? 'action.selected' : 'transparent',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FolderIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
            <Typography variant="body2">Root Directory</Typography>
          </Box>
        </Box>

        <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
          {allFolders.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              No folders in repository
            </Typography>
          ) : (
            <TreeView
              defaultCollapseIcon={<ExpandMoreIcon />}
              defaultExpandIcon={<ChevronRightIcon />}
              selected={selectedFolderPath}
              onNodeSelect={(_event: React.SyntheticEvent, nodeId: string) => {
                const folder = allFolders.find(f => f.id === nodeId);
                if (folder) {
                  const isInvalid = itemToMove && (
                    folder.id === itemToMove.id ||
                    (itemToMove.type === 'folder' && isDescendant(itemToMove.path, folder.path))
                  );
                  
                  if (!isInvalid) {
                    setSelectedFolderPath(folder.path);
                    setError('');
                  }
                }
              }}
            >
              {tree.filter(node => node.type === 'folder').map(node => renderFolderTree(node))}
            </TreeView>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedFolderPath && selectedFolderPath !== ''}
        >
          Move Here
        </Button>
      </DialogActions>
    </Dialog>
  );
}
