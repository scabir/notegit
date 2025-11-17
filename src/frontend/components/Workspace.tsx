import React, { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Tooltip } from '@mui/material';
import { 
  Settings as SettingsIcon,
  Commit as CommitIcon,
  SaveAlt as SaveAllIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { FileTreeView } from './FileTreeView';
import { MarkdownEditor } from './MarkdownEditor';
import { TextEditor } from './TextEditor';
import { StatusBar } from './StatusBar';
import { SettingsDialog } from './SettingsDialog';
import { CommitDialog } from './CommitDialog';
import { SearchDialog } from './SearchDialog';
import type { FileTreeNode, FileContent, RepoStatus } from '../../shared/types';

interface WorkspaceProps {
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

export function Workspace({ onThemeChange }: WorkspaceProps) {
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [repoStatus, setRepoStatus] = useState<RepoStatus | null>(null);
  const [repoPath, setRepoPath] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editorContent, setEditorContent] = useState<string>('');

  useEffect(() => {
    loadWorkspace();
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+P or Cmd/Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && (e.key === 'p' || e.key === 'k')) {
        e.preventDefault();
        setSearchDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadWorkspace = async () => {
    try {
      // Load file tree
      const treeResponse = await window.notegitApi.files.listTree();
      if (treeResponse.ok && treeResponse.data) {
        setTree(treeResponse.data);
      }

      // Load repo status
      const statusResponse = await window.notegitApi.repo.getStatus();
      if (statusResponse.ok && statusResponse.data) {
        setRepoStatus(statusResponse.data);
      }

      // Get repo path from config
      const configResponse = await window.notegitApi.config.getFull();
      if (configResponse.ok && configResponse.data?.repoSettings?.localPath) {
        setRepoPath(configResponse.data.repoSettings.localPath);
      }
    } catch (error) {
      console.error('Failed to load workspace:', error);
    }
  };

  const handleSelectFile = async (path: string, type: 'file' | 'folder') => {
    if (type === 'folder') return;

    setSelectedFile(path);

    try {
      const response = await window.notegitApi.files.read(path);
      if (response.ok && response.data) {
        setFileContent(response.data);
      } else {
        console.error('Failed to read file:', response.error);
      }
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  };

  const handleSaveFile = async (content: string) => {
    if (!selectedFile) return;

    try {
      const response = await window.notegitApi.files.save(selectedFile, content);
      if (response.ok) {
        console.log('File saved successfully');
        // Refresh status
        const statusResponse = await window.notegitApi.repo.getStatus();
        if (statusResponse.ok && statusResponse.data) {
          setRepoStatus(statusResponse.data);
        }
      } else {
        console.error('Failed to save file:', response.error);
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const handleCommit = async () => {
    // Refresh status after commit
    const statusResponse = await window.notegitApi.repo.getStatus();
    if (statusResponse.ok && statusResponse.data) {
      setRepoStatus(statusResponse.data);
    }
  };

  const handlePull = async () => {
    try {
      const response = await window.notegitApi.repo.pull();
      if (response.ok) {
        console.log('Pull successful');
        // Refresh tree and status
        await loadWorkspace();
        // Reload current file if open
        if (selectedFile) {
          const fileResponse = await window.notegitApi.files.read(selectedFile);
          if (fileResponse.ok && fileResponse.data) {
            setFileContent(fileResponse.data);
          }
        }
      } else {
        console.error('Failed to pull:', response.error);
      }
    } catch (error) {
      console.error('Failed to pull:', error);
    }
  };

  const handlePush = async () => {
    try {
      const response = await window.notegitApi.repo.push();
      if (response.ok) {
        console.log('Push successful');
        // Refresh status
        const statusResponse = await window.notegitApi.repo.getStatus();
        if (statusResponse.ok && statusResponse.data) {
          setRepoStatus(statusResponse.data);
        }
      } else {
        console.error('Failed to push:', response.error);
      }
    } catch (error) {
      console.error('Failed to push:', error);
    }
  };

  const handleCreateFile = async (parentPath: string, fileName: string) => {
    try {
      const response = await window.notegitApi.files.create(parentPath, fileName);
      if (response.ok) {
        console.log('File created successfully');
        // Refresh tree
        const treeResponse = await window.notegitApi.files.listTree();
        if (treeResponse.ok && treeResponse.data) {
          setTree(treeResponse.data);
        }
      } else {
        console.error('Failed to create file:', response.error);
        throw new Error(response.error?.message || 'Failed to create file');
      }
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  };

  const handleCreateFolder = async (parentPath: string, folderName: string) => {
    try {
      const response = await window.notegitApi.files.createFolder(parentPath, folderName);
      if (response.ok) {
        console.log('Folder created successfully');
        // Refresh tree
        const treeResponse = await window.notegitApi.files.listTree();
        if (treeResponse.ok && treeResponse.data) {
          setTree(treeResponse.data);
        }
      } else {
        console.error('Failed to create folder:', response.error);
        throw new Error(response.error?.message || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  };

  const handleDelete = async (path: string) => {
    try {
      const response = await window.notegitApi.files.delete(path);
      if (response.ok) {
        console.log('Deleted successfully');
        // Clear selection if deleted file was selected
        if (selectedFile === path) {
          setSelectedFile(null);
          setFileContent(null);
        }
        // Refresh tree
        const treeResponse = await window.notegitApi.files.listTree();
        if (treeResponse.ok && treeResponse.data) {
          setTree(treeResponse.data);
        }
        // Refresh status
        const statusResponse = await window.notegitApi.repo.getStatus();
        if (statusResponse.ok && statusResponse.data) {
          setRepoStatus(statusResponse.data);
        }
      } else {
        console.error('Failed to delete:', response.error);
        throw new Error(response.error?.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      throw error;
    }
  };

  const handleRename = async (oldPath: string, newPath: string) => {
    try {
      const response = await window.notegitApi.files.rename(oldPath, newPath);
      if (response.ok) {
        console.log('Renamed/moved successfully');
        // Clear selection if renamed file was selected
        if (selectedFile === oldPath) {
          setSelectedFile(null);
          setFileContent(null);
        }
        // Refresh tree
        const treeResponse = await window.notegitApi.files.listTree();
        if (treeResponse.ok && treeResponse.data) {
          setTree(treeResponse.data);
        }
        // Refresh status
        const statusResponse = await window.notegitApi.repo.getStatus();
        if (statusResponse.ok && statusResponse.data) {
          setRepoStatus(statusResponse.data);
        }
      } else {
        console.error('Failed to rename:', response.error);
        throw new Error(response.error?.message || 'Failed to rename');
      }
    } catch (error) {
      console.error('Failed to rename:', error);
      throw error;
    }
  };

  const handleImport = async (sourcePath: string, targetPath: string) => {
    try {
      const response = await window.notegitApi.files.import(sourcePath, targetPath);
      if (response.ok) {
        console.log('File imported successfully');
        // Refresh tree
        const treeResponse = await window.notegitApi.files.listTree();
        if (treeResponse.ok && treeResponse.data) {
          setTree(treeResponse.data);
        }
        // Refresh status
        const statusResponse = await window.notegitApi.repo.getStatus();
        if (statusResponse.ok && statusResponse.data) {
          setRepoStatus(statusResponse.data);
        }
      } else {
        console.error('Failed to import file:', response.error);
        throw new Error(response.error?.message || 'Failed to import file');
      }
    } catch (error) {
      console.error('Failed to import file:', error);
      throw error;
    }
  };

  const handleEditorChange = (content: string, hasChanges: boolean) => {
    setEditorContent(content);
    setHasUnsavedChanges(hasChanges);
  };

  const handleSaveAll = async () => {
    if (hasUnsavedChanges && selectedFile) {
      await handleSaveFile(editorContent);
    }
  };

  const handleOpenCommitDialog = async () => {
    // Auto-save before opening commit dialog
    if (hasUnsavedChanges && selectedFile) {
      await handleSaveFile(editorContent);
    }
    setCommitDialogOpen(true);
  };

  const handleSelectFileFromSearch = async (filePath: string) => {
    // Select the file and load its content
    await handleSelectFile(filePath, 'file');
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top app bar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense">
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            notegit
          </Typography>
          
          <Tooltip title="Search (Cmd/Ctrl+P)">
            <IconButton onClick={() => setSearchDialogOpen(true)} color="default">
              <SearchIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Save all open files">
            <span>
              <IconButton 
                onClick={handleSaveAll}
                disabled={!hasUnsavedChanges}
                color={hasUnsavedChanges ? 'primary' : 'default'}
              >
                <SaveAllIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Commit all changes">
            <IconButton onClick={handleOpenCommitDialog} color="primary">
              <CommitIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Settings">
            <IconButton onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* File tree sidebar */}
        <Box
          sx={{
            width: 300,
            borderRight: 1,
            borderColor: 'divider',
            overflow: 'auto',
          }}
        >
          <FileTreeView
            tree={tree}
            selectedFile={selectedFile}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onDelete={handleDelete}
            onRename={handleRename}
            onImport={handleImport}
          />
        </Box>

        {/* Editor */}
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {fileContent?.type === 'text' ? (
            <TextEditor
              file={fileContent}
              onSave={handleSaveFile}
              onChange={handleEditorChange}
            />
          ) : (
            <MarkdownEditor
              file={fileContent}
              repoPath={repoPath}
              onSave={handleSaveFile}
              onChange={handleEditorChange}
            />
          )}
        </Box>
      </Box>

      {/* Status bar */}
      <StatusBar status={repoStatus} onPull={handlePull} onPush={handlePush} />

      {/* Settings dialog */}
      <SettingsDialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        onThemeChange={onThemeChange}
      />

      {/* Commit dialog */}
      <CommitDialog
        open={commitDialogOpen}
        filePath={null}
        onClose={() => setCommitDialogOpen(false)}
        onSuccess={() => {
          handleCommit();
          setCommitDialogOpen(false);
        }}
      />

      {/* Search dialog */}
      <SearchDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        onSelectFile={handleSelectFileFromSearch}
      />
    </Box>
  );
}

