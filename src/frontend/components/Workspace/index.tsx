import React, { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Tooltip, Chip } from '@mui/material';
import {
  Settings as SettingsIcon,
  SaveAlt as SaveAllIcon,
  Search as SearchIcon,
  History as HistoryIcon,
  CloudUpload as CloudUploadIcon,
  CloudSync as CloudSyncIcon,
} from '@mui/icons-material';
import { FileTreeView } from '../FileTreeView';
import { MarkdownEditor } from '../MarkdownEditor';
import { ShortcutHelper, type ShortcutHelperHandle } from '../ShortcutHelper';
import { TextEditor } from '../TextEditor';
import { StatusBar } from '../StatusBar';
import { SettingsDialog } from '../SettingsDialog';
import { CommitDialog } from '../CommitDialog';
import { SearchDialog } from '../SearchDialog';
import { RepoSearchDialog } from '../RepoSearchDialog';
import { HistoryPanel } from '../HistoryPanel';
import { HistoryViewer } from '../HistoryViewer';
import type { AppSettings, FileTreeNode, FileContent, RepoStatus } from '../../../shared/types';
import packageJson from '../../../../package.json';
import { startS3AutoSync } from '../../utils/s3AutoSync';
import { WORKSPACE_TEXT } from './constants';
import {
  rootSx,
  saveStatusRowSx,
  statusChipSx,
  saveMessageSx,
  spacerSx,
  mainContentSx,
  sidebarSx,
  resizeHandleSx,
  editorPaneSx,
} from './styles';
import { buildHeaderTitle } from './utils';
import type { WorkspaceProps } from './types';

export function Workspace({ onThemeChange }: WorkspaceProps) {
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [repoStatus, setRepoStatus] = useState<RepoStatus | null>(null);
  const [repoPath, setRepoPath] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
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
  const s3AutoSyncCleanupRef = React.useRef<(() => void) | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = React.useRef(0);
  const resizeStartWidth = React.useRef(0);

  const fileContentCacheRef = React.useRef<Map<string, string>>(new Map());
  const shortcutHelperRef = React.useRef<ShortcutHelperHandle | null>(null);

  const [activeProfileName, setActiveProfileName] = useState<string>('');
  const [appVersion, setAppVersion] = useState<string>('');
  const isS3Repo = repoStatus?.provider === 's3';

  const headerTitle = buildHeaderTitle(activeProfileName, appVersion);

  useEffect(() => {
    loadWorkspace();
  }, [shortcutHelperRef]);

  useEffect(() => {
    if (!isS3Repo || !appSettings) {
      if (s3AutoSyncCleanupRef.current) {
        s3AutoSyncCleanupRef.current();
        s3AutoSyncCleanupRef.current = null;
      }
      return;
    }

    if (s3AutoSyncCleanupRef.current) {
      s3AutoSyncCleanupRef.current();
      s3AutoSyncCleanupRef.current = null;
    }

    s3AutoSyncCleanupRef.current = startS3AutoSync(
      appSettings.s3AutoSyncEnabled,
      appSettings.s3AutoSyncIntervalSec,
      {
        startAutoPush: window.notegitApi.repo.startAutoPush,
        getStatus: window.notegitApi.repo.getStatus,
        listTree: window.notegitApi.files.listTree,
        setStatus: setRepoStatus,
        setTree,
      }
    );

    return () => {
      if (s3AutoSyncCleanupRef.current) {
        s3AutoSyncCleanupRef.current();
        s3AutoSyncCleanupRef.current = null;
      }
    };
  }, [isS3Repo, appSettings?.s3AutoSyncEnabled, appSettings?.s3AutoSyncIntervalSec, appSettings]);

  const handleSaveFile = React.useCallback(async (content: string, isAutosave: boolean = false) => {
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

        if (selectedFile) {
          fileContentCacheRef.current.delete(selectedFile);
        }

        if (!isAutosave) {
          setSaveMessage('Saved locally');
        }

        const statusResponse = await window.notegitApi.repo.getStatus();
        if (statusResponse.ok && statusResponse.data) {
          setRepoStatus(statusResponse.data);
        }

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
  }, [selectedFile]);

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
      } else if (e.key === 'F1') {
        e.preventDefault();
        shortcutHelperRef.current?.openMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (hasUnsavedChanges && selectedFile && editorContent) {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

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
  }, [hasUnsavedChanges, selectedFile, editorContent, handleSaveFile]);

  // Save on app close
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && selectedFile && editorContent) {
        await handleSaveFile(editorContent, true);

        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, selectedFile, editorContent, handleSaveFile]);

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
        const configData = configResponse.data;
        setAppSettings(configData.appSettings);
        if (configData.repoSettings?.localPath) {
          setRepoPath(configData.repoSettings.localPath);
        }

        // Get active profile name
        if (configData.activeProfileId && configData.profiles) {
          const activeProfile = configData.profiles.find(
            p => p.id === configData.activeProfileId
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

    if (selectedFile && editorContent) {
      fileContentCacheRef.current.set(selectedFile, editorContent);
    }

    setSelectedFile(path);

    try {
      const cachedContent = fileContentCacheRef.current.get(path);

      if (cachedContent !== undefined) {
        const response = await window.notegitApi.files.read(path);
        if (response.ok && response.data) {
          setFileContent({
            ...response.data,
            content: cachedContent,
          });
          setEditorContent(cachedContent);
          setHasUnsavedChanges(true);
        }
      } else {
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



  const handleCommit = async () => {
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
        await loadWorkspace();
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

  const handleFetch = async () => {
    try {
      const response = await window.notegitApi.repo.fetch();
      if (response.ok && response.data) {
        setRepoStatus(response.data);
        console.log('Fetch successful', response.data);
      } else {
        console.error('Failed to fetch:', response.error);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    }
  };

  const handlePush = async () => {
    try {
      const response = await window.notegitApi.repo.push();
      if (response.ok) {
        console.log('Push successful');
        if (isS3Repo) {
          await loadWorkspace();
          if (selectedFile) {
            const fileResponse = await window.notegitApi.files.read(selectedFile);
            if (fileResponse.ok && fileResponse.data) {
              setFileContent(fileResponse.data);
            }
          }
        }
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

        const newFilePath = parentPath ? `${parentPath}/${fileName}` : fileName;

        const treeResponse = await window.notegitApi.files.listTree();
        if (treeResponse.ok && treeResponse.data) {
          setTree(treeResponse.data);
        }

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
        if (selectedFile === path) {
          setSelectedFile(null);
          setFileContent(null);
        }
        const treeResponse = await window.notegitApi.files.listTree();
        if (treeResponse.ok && treeResponse.data) {
          setTree(treeResponse.data);
        }
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

        if (selectedFile === oldPath) {
          setSelectedFile(newPath);
          if (fileContent) {
            setFileContent({
              ...fileContent,
              path: newPath,
            });
          }
        }
        else if (selectedFile && selectedFile.startsWith(oldPath + '/')) {
          const newSelectedPath = selectedFile.replace(oldPath + '/', newPath + '/');
          setSelectedFile(newSelectedPath);
          if (fileContent) {
            setFileContent({
              ...fileContent,
              path: newSelectedPath,
            });
          }
        }

        if (!isS3Repo) {
          try {
            await window.notegitApi.files.commitAll(
              `Move: ${oldPath} -> ${newPath}`
            );
            console.log('Move committed successfully');
          } catch (commitError) {
            console.warn('Failed to auto-commit move:', commitError);
          }
        }

        const treeResponse = await window.notegitApi.files.listTree();
        if (treeResponse.ok && treeResponse.data) {
          setTree(treeResponse.data);
        }
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
        const treeResponse = await window.notegitApi.files.listTree();
        if (treeResponse.ok && treeResponse.data) {
          setTree(treeResponse.data);
        }
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



  const handleCommitAndPush = async () => {
    if (hasUnsavedChanges && selectedFile) {
      await handleSaveFile(editorContent);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setSaveStatus('saving');
    setSaveMessage(isS3Repo ? 'Syncing...' : 'Committing and pushing...');

    try {
      if (isS3Repo) {
        const response = await window.notegitApi.repo.push();
        if (response.ok) {
          setSaveStatus('saved');
          setSaveMessage('Synced successfully');
          await loadWorkspace();
          if (selectedFile) {
            const fileResponse = await window.notegitApi.files.read(selectedFile);
            if (fileResponse.ok && fileResponse.data) {
              setFileContent(fileResponse.data);
            }
          }
        } else {
          setSaveStatus('error');
          setSaveMessage(response.error?.message || 'Failed to sync');
          console.error('Failed to sync:', response.error);
        }
      } else {
        const response = await window.notegitApi.files.commitAndPushAll();

        if (response.ok) {
          if (response.data?.message === 'Nothing to commit') {
            setSaveStatus('idle');
            setSaveMessage('Nothing to commit');
          } else {
            setSaveStatus('saved');
            setSaveMessage('Committed and pushed successfully');
          }
        } else {
          setSaveStatus('error');
          setSaveMessage(response.error?.message || 'Failed to commit and push');
          console.error('Failed to commit and push:', response.error);
        }
      }

      const statusResponse = await window.notegitApi.repo.getStatus();
      if (statusResponse.ok && statusResponse.data) {
        setRepoStatus(statusResponse.data);
      }

      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, isS3Repo ? 2000 : 3000);
    } catch (error: any) {
      setSaveStatus('error');
      setSaveMessage(error.message || (isS3Repo ? 'Failed to sync' : 'Failed to commit and push'));
      console.error(isS3Repo ? 'Failed to sync:' : 'Failed to commit and push:', error);

      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 5000);
    }
  };

  const handleSelectFileFromSearch = async (filePath: string) => {
    await handleSelectFile(filePath, 'file');
  };

  const handleSelectMatchFromRepoSearch = async (filePath: string, lineNumber: number) => {
    await handleSelectFile(filePath, 'file');
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
    <Box sx={rootSx}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense">
          <Typography variant="h6" component="div">
            {headerTitle}
          </Typography>

          {saveStatus !== 'idle' && (
            <Box sx={saveStatusRowSx}>
              {saveStatus === 'saving' && (
                <Chip
                  label={WORKSPACE_TEXT.savingLabel}
                  size="small"
                  color="info"
                  sx={statusChipSx}
                />
              )}
              {saveStatus === 'saved' && (
                <Chip
                  label={WORKSPACE_TEXT.savedLabel}
                  size="small"
                  color="success"
                  sx={statusChipSx}
                />
              )}
              {saveStatus === 'error' && (
                <Chip
                  label={WORKSPACE_TEXT.errorLabel}
                  size="small"
                  color="error"
                  sx={statusChipSx}
                />
              )}
              {saveMessage && (
                <Typography variant="caption" color="text.secondary" sx={saveMessageSx}>
                  {saveMessage}
                </Typography>
              )}
            </Box>
          )}

          <Box sx={spacerSx} />

          <Tooltip title={WORKSPACE_TEXT.searchTooltip}>
            <IconButton onClick={() => setSearchDialogOpen(true)} color="default">
              <SearchIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={WORKSPACE_TEXT.historyTooltip}>
            <IconButton
              onClick={handleToggleHistory}
              color={historyPanelOpen ? 'primary' : 'default'}
            >
              <HistoryIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={WORKSPACE_TEXT.saveAllTooltip}>
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

          <Tooltip title={isS3Repo ? WORKSPACE_TEXT.syncTooltip : WORKSPACE_TEXT.commitPushTooltip}>
            <IconButton onClick={handleCommitAndPush} color="primary">
              {isS3Repo ? <CloudSyncIcon /> : <CloudUploadIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title={WORKSPACE_TEXT.settingsTooltip}>
            <IconButton onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <ShortcutHelper ref={shortcutHelperRef} />
        </Toolbar>
      </AppBar>

      <Box sx={mainContentSx}>
        <Box
          sx={sidebarSx(sidebarWidth)}
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
            isS3Repo={isS3Repo}
          />
        </Box>

        <Box
          onMouseDown={handleResizeStart}
          sx={resizeHandleSx(isResizing)}
        />

        <Box sx={editorPaneSx}>
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

        {historyPanelOpen && (
          <HistoryPanel
            filePath={selectedFile}
            onViewVersion={handleViewVersion}
            onClose={() => setHistoryPanelOpen(false)}
          />
        )}
      </Box>

      <StatusBar status={repoStatus} onFetch={handleFetch} onPull={handlePull} onPush={handlePush} />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onThemeChange={onThemeChange}
        onAppSettingsSaved={setAppSettings}
        currentNoteContent={editorContent}
        currentNotePath={selectedFile || undefined}
      />

      <CommitDialog
        open={commitDialogOpen}
        filePath={null}
        onClose={() => setCommitDialogOpen(false)}
        onSuccess={() => {
          handleCommit();
          setCommitDialogOpen(false);
        }}
      />

      <SearchDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        onSelectFile={handleSelectFileFromSearch}
      />

      <RepoSearchDialog
        open={repoSearchDialogOpen}
        onClose={() => setRepoSearchDialogOpen(false)}
        onSelectMatch={handleSelectMatchFromRepoSearch}
      />

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
