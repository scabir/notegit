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
import versionInfo from '../../../../version.json';
import { startS3AutoSync } from '../../utils/s3AutoSync';
import { WORKSPACE_TEXT } from './constants';
import {
  rootSx,
  topAppBarSx,
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
  const statusTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const unrefTimeout = (timer: NodeJS.Timeout | null) => {
    if (timer && typeof (timer as any).unref === 'function') {
      (timer as any).unref();
    }
  };
  const s3AutoSyncCleanupRef = React.useRef<(() => void) | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = React.useRef(0);
  const resizeStartWidth = React.useRef(0);

  const fileContentCacheRef = React.useRef<Map<string, string>>(new Map());
  const shortcutHelperRef = React.useRef<ShortcutHelperHandle | null>(null);

  const [activeProfileName, setActiveProfileName] = useState<string>('');
  const [appVersion, setAppVersion] = useState<string>(versionInfo.version);
  const isS3Repo = repoStatus?.provider === 's3';

  const headerTitle = buildHeaderTitle(activeProfileName, appVersion);

  const setTransientStatus = React.useCallback(
    (status: 'idle' | 'saving' | 'saved' | 'error', message: string, timeoutMs = 3000) => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
      setSaveStatus(status);
      setSaveMessage(message);
      if (timeoutMs > 0) {
        statusTimerRef.current = setTimeout(() => {
          setSaveStatus('idle');
          setSaveMessage('');
          statusTimerRef.current = null;
        }, timeoutMs);
        unrefTimeout(statusTimerRef.current);
      }
    },
    []
  );

  const loadWorkspace = React.useCallback(async () => {
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
      setAppVersion(versionInfo.version);
    } catch (error) {
      setTransientStatus('error', 'Failed to load workspace', 5000);
    }
  }, [setTransientStatus]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

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
        if (!isAutosave) {
          setTransientStatus('saved', 'Saved locally', 2000);
        } else {
          setSaveStatus('saved');
        }
      } else {
        setTransientStatus('error', response.error?.message || 'Failed to save file', 5000);
      }
    } catch (error: any) {
      setTransientStatus('error', error.message || 'Failed to save file', 5000);
    }
  }, [selectedFile, setTransientStatus]);

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
          handleSaveFile(editorContent, true);
        }, 300000); // 5 minutes
        unrefTimeout(autosaveTimerRef.current);
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

  // loadWorkspace moved to useCallback above

  // setTransientStatus moved above loadWorkspace

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
          setTransientStatus('error', response.error?.message || 'Failed to read file', 5000);
        }
      }
    } catch (error) {
      setTransientStatus('error', 'Failed to read file', 5000);
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
        setTransientStatus('saved', 'Pull successful', 2000);
        await loadWorkspace();
        if (selectedFile) {
          const fileResponse = await window.notegitApi.files.read(selectedFile);
          if (fileResponse.ok && fileResponse.data) {
            setFileContent(fileResponse.data);
          }
        }
      } else {
        setTransientStatus('error', response.error?.message || 'Failed to pull', 5000);
      }
    } catch (error) {
      setTransientStatus('error', 'Failed to pull', 5000);
    }
  };

  const handleFetch = async () => {
    try {
      if (isS3Repo && appSettings?.s3AutoSyncEnabled && !s3AutoSyncCleanupRef.current) {
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
      }

      const response = await window.notegitApi.repo.fetch();
      if (response.ok && response.data) {
        setRepoStatus(response.data);
        setTransientStatus('saved', 'Fetch successful', 2000);
        if (s3AutoSyncCleanupRef.current && response.data.provider !== 's3') {
          s3AutoSyncCleanupRef.current();
          s3AutoSyncCleanupRef.current = null;
        }
      } else {
        setTransientStatus('error', response.error?.message || 'Failed to fetch', 5000);
      }
    } catch (error) {
      setTransientStatus('error', 'Failed to fetch', 5000);
    }
  };

  const handlePush = async () => {
    try {
      const response = await window.notegitApi.repo.push();
      if (response.ok) {
        setTransientStatus('saved', 'Push successful', 2000);
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
        setTransientStatus('error', response.error?.message || 'Failed to push', 5000);
      }
    } catch (error) {
      setTransientStatus('error', 'Failed to push', 5000);
    }
  };

  const handleCreateFile = async (parentPath: string, fileName: string) => {
    const response = await window.notegitApi.files.create(parentPath, fileName);
    if (response.ok) {
      const newFilePath = parentPath ? `${parentPath}/${fileName}` : fileName;

      const treeResponse = await window.notegitApi.files.listTree();
      if (treeResponse.ok && treeResponse.data) {
        setTree(treeResponse.data);
      }

      await handleSelectFile(newFilePath, 'file');
      return;
    }

    throw new Error(response.error?.message || 'Failed to create file');
  };

  const handleCreateFolder = async (parentPath: string, folderName: string) => {
    const response = await window.notegitApi.files.createFolder(parentPath, folderName);
    if (response.ok) {
      const treeResponse = await window.notegitApi.files.listTree();
      if (treeResponse.ok && treeResponse.data) {
        setTree(treeResponse.data);
      }
      return;
    }

    throw new Error(response.error?.message || 'Failed to create folder');
  };

  const handleDelete = async (path: string) => {
    const response = await window.notegitApi.files.delete(path);
    if (response.ok) {
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
      return;
    }

    throw new Error(response.error?.message || 'Failed to delete');
  };

  const handleRename = async (oldPath: string, newPath: string) => {
    const response = await window.notegitApi.files.rename(oldPath, newPath);
    if (response.ok) {
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
        } catch (commitError) {
          setTransientStatus('error', 'Failed to auto-commit move', 5000);
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
      return;
    }

    throw new Error(response.error?.message || 'Failed to rename');
  };

  const handleImport = async (sourcePath: string, targetPath: string) => {
    const response = await window.notegitApi.files.import(sourcePath, targetPath);
    if (response.ok) {
      const treeResponse = await window.notegitApi.files.listTree();
      if (treeResponse.ok && treeResponse.data) {
        setTree(treeResponse.data);
      }
      const statusResponse = await window.notegitApi.repo.getStatus();
      if (statusResponse.ok && statusResponse.data) {
        setRepoStatus(statusResponse.data);
      }
      return;
    }

    throw new Error(response.error?.message || 'Failed to import file');
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

  const handleDuplicate = async (path: string): Promise<string | void> => {
    try {
      const response = await window.notegitApi.files.duplicate(path);
      if (response.ok && response.data) {
        const treeResponse = await window.notegitApi.files.listTree();
        if (treeResponse.ok && treeResponse.data) {
          setTree(treeResponse.data);
        }
        await handleSelectFile(response.data, 'file');
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to duplicate file');
    } catch (error: any) {
      setTransientStatus('error', error.message || 'Failed to duplicate file', 5000);
      throw error;
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

      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 5000);
    }
  };

  const handleSelectFileFromSearch = async (filePath: string) => {
    await handleSelectFile(filePath, 'file');
  };

  const handleSelectMatchFromRepoSearch = async (filePath: string, _lineNumber: number) => {
    await handleSelectFile(filePath, 'file');
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

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
        statusTimerRef.current = null;
      }
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, []);

  return (
    <Box sx={rootSx}>
      <AppBar position="static" color="default" elevation={1} sx={topAppBarSx}>
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
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  width: 1,
                  height: 1,
                  overflow: 'hidden',
                  clip: 'rect(1px, 1px, 1px, 1px)',
                }}
              >
                {`${saveStatus === 'error'
                  ? WORKSPACE_TEXT.errorLabel
                  : saveStatus === 'saved'
                  ? WORKSPACE_TEXT.savedLabel
                  : WORKSPACE_TEXT.savingLabel} ${saveMessage || ''}`}
              </Typography>
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
            onDuplicate={handleDuplicate}
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
