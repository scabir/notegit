import React, { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Tooltip, Chip } from '@mui/material';
import { 
  Settings as SettingsIcon,
  Commit as CommitIcon,
  SaveAlt as SaveAllIcon,
  Search as SearchIcon,
  History as HistoryIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { FileTreeView } from './FileTreeView';
import { MarkdownEditor } from './MarkdownEditor';
import { TextEditor } from './TextEditor';
import { StatusBar } from './StatusBar';
import { SettingsDialog } from './SettingsDialog';
import { CommitDialog } from './CommitDialog';
import { SearchDialog } from './SearchDialog';
import { RepoSearchDialog } from './RepoSearchDialog';
import { HistoryPanel } from './HistoryPanel';
import { HistoryViewer } from './HistoryViewer';
import type { FileTreeNode, FileContent, RepoStatus } from '../../shared/types';
import packageJson from '../../../package.json';

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
  const [repoSearchDialogOpen, setRepoSearchDialogOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [historyViewerOpen, setHistoryViewerOpen] = useState(false);
  const [viewingCommitHash, setViewingCommitHash] = useState<string | null>(null);
  const [viewingCommitMessage, setViewingCommitMessage] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editorContent, setEditorContent] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const autosaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = React.useRef(0);
  const resizeStartWidth = React.useRef(0);
  
  // Cache for unsaved file content (per-session)
  const fileContentCacheRef = React.useRef<Map<string, string>>(new Map());
  
  // Header display info
  const [activeProfileName, setActiveProfileName] = useState<string>('');
  const [appVersion, setAppVersion] = useState<string>('');
  
  // Helper function to truncate profile name
  const getTruncatedProfileName = (name: string): string => {
    if (name.length <= 20) {
      return name;
    }
    return name.substring(0, 20) + '...';
  };
  
  // Compute header title
  const getHeaderTitle = (): string => {
    let title = 'notegit';
    if (activeProfileName) {
      title += ` - ${getTruncatedProfileName(activeProfileName)}`;
    }
    if (appVersion) {
      title += ` - ${appVersion}`;
    }
    return title;
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+P or Cmd/Ctrl+K to open file search
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === 'p' || e.key === 'k')) {
        e.preventDefault();
        setSearchDialogOpen(true);
      }
      // Cmd/Ctrl+Shift+F to open repo-wide search
      else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        setRepoSearchDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autosave timer - triggers 5 minutes after last change
  useEffect(() => {
    if (hasUnsavedChanges && selectedFile && editorContent) {
      // Clear any existing timer
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      // Set new timer for 5 minutes (300000 ms)
      autosaveTimerRef.current = setTimeout(() => {
        console.log('Autosave triggered');
        handleSaveFile(editorContent, true);
      }, 300000); // 5 minutes
    }

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, selectedFile, editorContent]);

  // Save on app close
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && selectedFile && editorContent) {
        // Trigger autosave
        await handleSaveFile(editorContent, true);
        
        // Show confirmation dialog
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, selectedFile, editorContent]);

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

      // Get repo path and profile info from config
      const configResponse = await window.notegitApi.config.getFull();
      if (configResponse.ok && configResponse.data) {
        if (configResponse.data.repoSettings?.localPath) {
          setRepoPath(configResponse.data.repoSettings.localPath);
        }
        
        // Get active profile name
        if (configResponse.data.activeProfileId && configResponse.data.profiles) {
          const activeProfile = configResponse.data.profiles.find(
            p => p.id === configResponse.data.activeProfileId
          );
          if (activeProfile) {
            setActiveProfileName(activeProfile.name);
          }
        }
      }
      
      // Set app version from package.json
      setAppVersion(packageJson.version);
    } catch (error) {
      console.error('Failed to load workspace:', error);
    }
  };

  const handleSelectFile = async (path: string, type: 'file' | 'folder') => {
    if (type === 'folder') return;

    // Save current file's content to cache before switching
    if (selectedFile && editorContent) {
      fileContentCacheRef.current.set(selectedFile, editorContent);
    }

    setSelectedFile(path);

    try {
      // Check if we have cached content for this file
      const cachedContent = fileContentCacheRef.current.get(path);
      
      if (cachedContent !== undefined) {
        // Use cached content
        const response = await window.notegitApi.files.read(path);
        if (response.ok && response.data) {
          // Keep the file metadata but use cached content
          setFileContent({
            ...response.data,
            content: cachedContent,
          });
          setEditorContent(cachedContent);
          // Mark as having unsaved changes since we're restoring cached content
          setHasUnsavedChanges(true);
        }
      } else {
        // Load from disk
        const response = await window.notegitApi.files.read(path);
        if (response.ok && response.data) {
          setFileContent(response.data);
          setEditorContent(response.data.content);
          setHasUnsavedChanges(false);
        } else {
          console.error('Failed to read file:', response.error);
        }
      }
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  };

  const handleSaveFile = async (content: string, isAutosave: boolean = false) => {
    if (!selectedFile) return;

    setSaveStatus('saving');
    setSaveMessage('');

    try {
      const response = await window.notegitApi.files.save(
        selectedFile,
        content
      );

      if (response.ok) {
        setSaveStatus('saved');
        setHasUnsavedChanges(false);
        
        // Clear cached content for this file after successful save
        if (selectedFile) {
          fileContentCacheRef.current.delete(selectedFile);
        }

        // Show success message
        if (!isAutosave) {
          setSaveMessage('Saved locally');
        }

        // Refresh status to show uncommitted changes
        const statusResponse = await window.notegitApi.repo.getStatus();
        if (statusResponse.ok && statusResponse.data) {
          setRepoStatus(statusResponse.data);
        }

        // Clear save status after a delay
        setTimeout(() => {
          if (!isAutosave) {
            setSaveStatus('idle');
            setSaveMessage('');
          }
        }, 2000);
      } else {
        setSaveStatus('error');
        setSaveMessage(response.error?.message || 'Failed to save file');
        console.error('Failed to save file:', response.error);
      }
    } catch (error: any) {
      setSaveStatus('error');
      setSaveMessage(error.message || 'Failed to save file');
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
        
        // Construct the full path of the newly created file
        const newFilePath = parentPath ? `${parentPath}/${fileName}` : fileName;
        
        // Refresh tree
        const treeResponse = await window.notegitApi.files.listTree();
        if (treeResponse.ok && treeResponse.data) {
          setTree(treeResponse.data);
        }
        
        // Automatically select and open the newly created file
        await handleSelectFile(newFilePath, 'file');
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
        
        // If the moved file was selected, update its path
        if (selectedFile === oldPath) {
          setSelectedFile(newPath);
          // Update file content with new path
          if (fileContent) {
            setFileContent({
              ...fileContent,
              path: newPath,
            });
          }
        } 
        // If a file inside a moved folder was selected, update its path
        else if (selectedFile && selectedFile.startsWith(oldPath + '/')) {
          const newSelectedPath = selectedFile.replace(oldPath + '/', newPath + '/');
          setSelectedFile(newSelectedPath);
          // Update file content with new path
          if (fileContent) {
            setFileContent({
              ...fileContent,
              path: newSelectedPath,
            });
          }
        }
        
        // Commit the move operation automatically
        try {
          // Stage all changes (the move will show as delete + add)
          await window.notegitApi.files.commitAll(
            `Move: ${oldPath} -> ${newPath}`
          );
          console.log('Move committed successfully');
        } catch (commitError) {
          console.warn('Failed to auto-commit move:', commitError);
          // Continue even if commit fails - the changes are on disk
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

  const handleCommitAndPush = async () => {
    // Auto-save before committing
    if (hasUnsavedChanges && selectedFile) {
      await handleSaveFile(editorContent);
      // Wait a bit for save to complete
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setSaveStatus('saving');
    setSaveMessage('Committing and pushing...');

    try {
      const response = await window.notegitApi.files.commitAndPushAll();

      if (response.ok) {
        if (response.data?.message === 'Nothing to commit') {
          setSaveStatus('idle');
          setSaveMessage('Nothing to commit');
        } else {
          setSaveStatus('saved');
          setSaveMessage('Committed and pushed successfully');
        }

        // Refresh status
        const statusResponse = await window.notegitApi.repo.getStatus();
        if (statusResponse.ok && statusResponse.data) {
          setRepoStatus(statusResponse.data);
        }

        // Clear status after a delay
        setTimeout(() => {
          setSaveStatus('idle');
          setSaveMessage('');
        }, 3000);
      } else {
        setSaveStatus('error');
        setSaveMessage(response.error?.message || 'Failed to commit and push');
        console.error('Failed to commit and push:', response.error);

        // Clear error after a delay
        setTimeout(() => {
          setSaveStatus('idle');
          setSaveMessage('');
        }, 5000);
      }
    } catch (error: any) {
      setSaveStatus('error');
      setSaveMessage(error.message || 'Failed to commit and push');
      console.error('Failed to commit and push:', error);

      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 5000);
    }
  };

  const handleSelectFileFromSearch = async (filePath: string) => {
    // Select the file and load its content
    await handleSelectFile(filePath, 'file');
  };

  const handleSelectMatchFromRepoSearch = async (filePath: string, lineNumber: number) => {
    // Open the file and potentially scroll to the line
    await handleSelectFile(filePath, 'file');
    // Note: Line scrolling would require editor API integration
    // For now, just opening the file is sufficient
    console.log(`Opening ${filePath} at line ${lineNumber}`);
  };

  const handleViewVersion = (commitHash: string, commitMessage: string) => {
    setViewingCommitHash(commitHash);
    setViewingCommitMessage(commitMessage);
    setHistoryViewerOpen(true);
  };

  const handleToggleHistory = () => {
    setHistoryPanelOpen(!historyPanelOpen);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartX.current;
      const newWidth = resizeStartWidth.current + delta;
      
      // Constrain width between 200px and 600px
      const MIN_WIDTH = 200;
      const MAX_WIDTH = 600;
      const constrainedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      
      setSidebarWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top app bar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense">
          <Typography variant="h6" component="div">
            {getHeaderTitle()}
          </Typography>

          {/* Save Status Indicator */}
          {saveStatus !== 'idle' && (
            <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              {saveStatus === 'saving' && (
                <Chip
                  label="Saving..."
                  size="small"
                  color="info"
                  sx={{ height: 24 }}
                />
              )}
              {saveStatus === 'saved' && (
                <Chip
                  label="Saved"
                  size="small"
                  color="success"
                  sx={{ height: 24 }}
                />
              )}
              {saveStatus === 'error' && (
                <Chip
                  label="Error"
                  size="small"
                  color="error"
                  sx={{ height: 24 }}
                />
              )}
              {saveMessage && (
                <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 300 }}>
                  {saveMessage}
                </Typography>
              )}
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />
          
          <Tooltip title="Search (Cmd/Ctrl+P)">
            <IconButton onClick={() => setSearchDialogOpen(true)} color="default">
              <SearchIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="File History">
            <IconButton 
              onClick={handleToggleHistory}
              color={historyPanelOpen ? 'primary' : 'default'}
            >
              <HistoryIcon />
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

          <Tooltip title="Commit and Push">
            <IconButton onClick={handleCommitAndPush} color="primary">
              <CloudUploadIcon />
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
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden', pb: '40px' }}>
        {/* File tree sidebar */}
        <Box
          sx={{
            width: sidebarWidth,
            minWidth: sidebarWidth,
            maxWidth: sidebarWidth,
            flexShrink: 0,
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

        {/* Resize handle */}
        <Box
          onMouseDown={handleResizeStart}
          sx={{
            width: '4px',
            cursor: 'col-resize',
            bgcolor: isResizing ? 'primary.main' : 'transparent',
            '&:hover': {
              bgcolor: 'primary.light',
            },
            transition: 'background-color 0.2s',
            flexShrink: 0,
          }}
        />

        {/* Editor */}
        <Box sx={{ flexGrow: 1, overflow: 'hidden', minWidth: 0 }}>
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

        {/* History Panel */}
        {historyPanelOpen && (
          <HistoryPanel
            filePath={selectedFile}
            onViewVersion={handleViewVersion}
            onClose={() => setHistoryPanelOpen(false)}
          />
        )}
      </Box>

      {/* Status bar */}
      <StatusBar status={repoStatus} onPull={handlePull} onPush={handlePush} />

      {/* Settings dialog */}
      <SettingsDialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        onThemeChange={onThemeChange}
        currentNoteContent={editorContent}
        currentNotePath={selectedFile || undefined}
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

      {/* Repo-wide search dialog */}
      <RepoSearchDialog
        open={repoSearchDialogOpen}
        onClose={() => setRepoSearchDialogOpen(false)}
        onSelectMatch={handleSelectMatchFromRepoSearch}
      />

      {/* History Viewer */}
      <HistoryViewer
        open={historyViewerOpen}
        filePath={selectedFile}
        commitHash={viewingCommitHash}
        commitMessage={viewingCommitMessage}
        repoPath={repoPath}
        onClose={() => setHistoryViewerOpen(false)}
      />
    </Box>
  );
}

