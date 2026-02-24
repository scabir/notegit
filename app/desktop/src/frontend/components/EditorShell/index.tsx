import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { FileTreeView } from "../FileTreeView";
import { MarkdownEditor } from "../MarkdownEditor";
import type { ShortcutHelperHandle } from "../ShortcutHelper";
import { TextEditor } from "../TextEditor";
import { ImageViewer } from "../ImageViewer";
import { StatusBar } from "../StatusBar";
import { SettingsDialog } from "../SettingsDialog";
import { CommitDialog } from "../CommitDialog";
import { SearchDialog } from "../SearchDialog";
import { RepoSearchDialog } from "../RepoSearchDialog";
import { HistoryPanel } from "../HistoryPanel";
import { HistoryViewer } from "../HistoryViewer";
import { AboutDialog } from "../AboutDialog";
import type {
  AppSettings,
  FileTreeNode,
  FileContent,
  RepoStatus,
} from "../../../shared/types";
import { FileType, REPO_PROVIDERS } from "../../../shared/types";
import { startS3AutoSync } from "../../utils/s3AutoSync";
import { useI18n } from "../../i18n";
import {
  rootSx,
  mainContentSx,
  sidebarSx,
  resizeHandleSx,
  editorPaneSx,
} from "./styles";
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from "./constants";
import { buildHeaderTitle } from "./utils";
import type { EditorShellProps } from "./types";

const MAX_NAV_HISTORY = 100;
type TreePanelState = "open" | "closed";
type TreePanelAction = "toggle";

const treePanelReducer = (
  state: TreePanelState,
  action: TreePanelAction,
): TreePanelState => {
  if (action === "toggle") {
    return state === "open" ? "closed" : "open";
  }
  return state;
};

export function EditorShell({ onThemeChange }: EditorShellProps) {
  const { t } = useI18n();
  const message = React.useCallback(
    (key: string) => t(`editorShell.messages.${key}`),
    [t],
  );
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [navigationEntries, setNavigationEntries] = useState<string[]>([]);
  const [navigationIndex, setNavigationIndex] = useState(-1);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [repoStatus, setRepoStatus] = useState<RepoStatus | null>(null);
  const [repoPath, setRepoPath] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [repoSearchDialogOpen, setRepoSearchDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [historyViewerOpen, setHistoryViewerOpen] = useState(false);
  const [viewingCommitHash, setViewingCommitHash] = useState<string | null>(
    null,
  );
  const [viewingCommitMessage, setViewingCommitMessage] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editorContent, setEditorContent] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveMessage, setSaveMessage] = useState<string>("");
  const autosaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const statusTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const unrefTimeout = (timer: NodeJS.Timeout | null) => {
    if (timer && typeof (timer as any).unref === "function") {
      (timer as any).unref();
    }
  };
  const s3AutoSyncCleanupRef = React.useRef<(() => void) | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [treePanelState, dispatchTreePanel] = React.useReducer(
    treePanelReducer,
    "open",
  );
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = React.useRef(0);
  const resizeStartWidth = React.useRef(0);
  const lastExpandedSidebarWidthRef = React.useRef(SIDEBAR_DEFAULT_WIDTH);

  const fileContentCacheRef = React.useRef<Map<string, string>>(new Map());
  const shortcutHelperRef = React.useRef<ShortcutHelperHandle | null>(null);
  const navigationEntriesRef = React.useRef<string[]>([]);
  const navigationIndexRef = React.useRef(-1);

  const [activeProfileName, setActiveProfileName] = useState<string>("");
  const isS3Repo = repoStatus?.provider === REPO_PROVIDERS.s3;
  const isLocalRepo = repoStatus?.provider === REPO_PROVIDERS.local;
  const isTreeCollapsed = treePanelState === "closed";

  const headerTitle = buildHeaderTitle(activeProfileName);

  useEffect(() => {
    navigationEntriesRef.current = navigationEntries;
    navigationIndexRef.current = navigationIndex;
  }, [navigationEntries, navigationIndex]);

  const canNavigateBack = navigationIndex > 0;
  const canNavigateForward =
    navigationIndex >= 0 && navigationIndex < navigationEntries.length - 1;

  const pushNavigationEntry = React.useCallback((path: string) => {
    if (!path) return;
    const entries = navigationEntriesRef.current;
    const currentIndex = navigationIndexRef.current;
    const current = entries[currentIndex];
    if (current === path) {
      return;
    }

    let nextEntries = entries;
    if (currentIndex < entries.length - 1) {
      nextEntries = entries.slice(0, currentIndex + 1);
    }

    nextEntries = [...nextEntries, path];
    if (nextEntries.length > MAX_NAV_HISTORY) {
      const overflow = nextEntries.length - MAX_NAV_HISTORY;
      nextEntries = nextEntries.slice(overflow);
    }

    setNavigationEntries(nextEntries);
    const nextIndex = nextEntries.length - 1;
    navigationEntriesRef.current = nextEntries;
    navigationIndexRef.current = nextIndex;
    setNavigationIndex(nextIndex);
  }, []);

  const isEditableTarget = React.useCallback((target: EventTarget | null) => {
    if (
      typeof HTMLElement === "undefined" ||
      !(target instanceof HTMLElement)
    ) {
      return false;
    }
    const tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
      return true;
    }
    return Boolean(target.closest(".cm-editor"));
  }, []);

  const clearStatusTimer = React.useCallback(() => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  }, []);

  const setTransientStatus = React.useCallback(
    (
      status: "idle" | "saving" | "saved" | "error",
      message: string,
      timeoutMs = 3000,
    ) => {
      clearStatusTimer();
      setSaveStatus(status);
      setSaveMessage(message);
      if (timeoutMs > 0) {
        statusTimerRef.current = setTimeout(() => {
          setSaveStatus("idle");
          setSaveMessage("");
          statusTimerRef.current = null;
        }, timeoutMs);
        unrefTimeout(statusTimerRef.current);
      }
    },
    [clearStatusTimer],
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
            (p) => p.id === configData.activeProfileId,
          );
          if (activeProfile) {
            setActiveProfileName(activeProfile.name);
          }
        }
      }
    } catch (error) {
      setTransientStatus("error", message("failedLoadWorkspace"), 5000);
    }
  }, [message, setTransientStatus]);

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
      },
    );

    return () => {
      if (s3AutoSyncCleanupRef.current) {
        s3AutoSyncCleanupRef.current();
        s3AutoSyncCleanupRef.current = null;
      }
    };
  }, [
    isS3Repo,
    appSettings?.s3AutoSyncEnabled,
    appSettings?.s3AutoSyncIntervalSec,
    appSettings,
  ]);

  const handleSaveFile = React.useCallback(
    async (content: string, isAutosave: boolean = false) => {
      if (!selectedFile) return;

      setSaveStatus("saving");
      setSaveMessage("");

      try {
        const response = await window.notegitApi.files.save(
          selectedFile,
          content,
        );

        if (response.ok) {
          setSaveStatus("saved");
          setHasUnsavedChanges(false);

          if (selectedFile) {
            fileContentCacheRef.current.delete(selectedFile);
          }

          if (!isAutosave) {
            setSaveMessage(message("savedLocally"));
          }

          const statusResponse = await window.notegitApi.repo.getStatus();
          if (statusResponse.ok && statusResponse.data) {
            setRepoStatus(statusResponse.data);
          }
          if (!isAutosave) {
            setTransientStatus("saved", message("savedLocally"), 2000);
          } else {
            setSaveStatus("saved");
          }
        } else {
          setTransientStatus(
            "error",
            response.error?.message || message("failedSaveFile"),
            5000,
          );
        }
      } catch (error: any) {
        setTransientStatus(
          "error",
          error.message || message("failedSaveFile"),
          5000,
        );
      }
    },
    [message, selectedFile, setTransientStatus],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+P or Cmd/Ctrl+K to open file search
      if (
        (e.metaKey || e.ctrlKey) &&
        !e.shiftKey &&
        (e.key === "p" || e.key === "k")
      ) {
        e.preventDefault();
        setSearchDialogOpen(true);
      }
      // Cmd/Ctrl+Shift+F to open repo-wide search
      else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "f") {
        e.preventDefault();
        setRepoSearchDialogOpen(true);
      } else if (e.key === "F1") {
        e.preventDefault();
        shortcutHelperRef.current?.openMenu();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOpenShortcuts = () => {
      shortcutHelperRef.current?.openMenu();
    };
    const handleOpenAbout = () => {
      setAboutDialogOpen(true);
    };

    const offOpenShortcuts =
      window.notegitApi.menu.onOpenShortcuts(handleOpenShortcuts);
    const offOpenAbout = window.notegitApi.menu.onOpenAbout(handleOpenAbout);

    return () => {
      if (typeof offOpenShortcuts === "function") {
        offOpenShortcuts();
      }
      if (typeof offOpenAbout === "function") {
        offOpenAbout();
      }
    };
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
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, selectedFile, editorContent, handleSaveFile]);

  // loadWorkspace moved to useCallback above

  // setTransientStatus moved above loadWorkspace

  const openFile = React.useCallback(
    async (
      path: string,
      type: "file" | "folder",
      options: { recordHistory?: boolean } = {},
    ) => {
      if (type === "folder") return;

      if (options.recordHistory !== false) {
        pushNavigationEntry(path);
      }

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
            setTransientStatus(
              "error",
              response.error?.message || message("failedReadFile"),
              5000,
            );
          }
        }
      } catch (error) {
        setTransientStatus("error", message("failedReadFile"), 5000);
      }
    },
    [
      editorContent,
      message,
      pushNavigationEntry,
      selectedFile,
      setTransientStatus,
    ],
  );

  const handleSelectFile = React.useCallback(
    async (path: string, type: "file" | "folder") => {
      await openFile(path, type, { recordHistory: true });
    },
    [openFile],
  );

  const navigateToIndex = React.useCallback(
    (nextIndex: number) => {
      const entries = navigationEntriesRef.current;
      if (nextIndex < 0 || nextIndex >= entries.length) {
        return;
      }
      const target = entries[nextIndex];
      navigationIndexRef.current = nextIndex;
      setNavigationIndex(nextIndex);
      void openFile(target, "file", { recordHistory: false });
    },
    [openFile],
  );

  const handleNavigateBack = React.useCallback(() => {
    navigateToIndex(navigationIndexRef.current - 1);
  }, [navigateToIndex]);

  const handleNavigateForward = React.useCallback(() => {
    navigateToIndex(navigationIndexRef.current + 1);
  }, [navigateToIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) {
        return;
      }
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }
      if (isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
      if (event.key === "ArrowLeft") {
        handleNavigateBack();
      } else {
        handleNavigateForward();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNavigateBack, handleNavigateForward, isEditableTarget]);

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
        setTransientStatus("saved", message("pullSuccessful"), 2000);
        await loadWorkspace();
        if (selectedFile) {
          const fileResponse = await window.notegitApi.files.read(selectedFile);
          if (fileResponse.ok && fileResponse.data) {
            setFileContent(fileResponse.data);
          }
        }
      } else {
        setTransientStatus(
          "error",
          response.error?.message || message("failedPull"),
          5000,
        );
      }
    } catch (error) {
      setTransientStatus("error", message("failedPull"), 5000);
    }
  };

  const handleFetch = async () => {
    try {
      if (
        isS3Repo &&
        appSettings?.s3AutoSyncEnabled &&
        !s3AutoSyncCleanupRef.current
      ) {
        s3AutoSyncCleanupRef.current = startS3AutoSync(
          appSettings.s3AutoSyncEnabled,
          appSettings.s3AutoSyncIntervalSec,
          {
            startAutoPush: window.notegitApi.repo.startAutoPush,
            getStatus: window.notegitApi.repo.getStatus,
            listTree: window.notegitApi.files.listTree,
            setStatus: setRepoStatus,
            setTree,
          },
        );
      }

      const response = await window.notegitApi.repo.fetch();
      if (response.ok && response.data) {
        setRepoStatus(response.data);
        setTransientStatus("saved", message("fetchSuccessful"), 2000);
        if (
          s3AutoSyncCleanupRef.current &&
          response.data.provider !== REPO_PROVIDERS.s3
        ) {
          s3AutoSyncCleanupRef.current();
          s3AutoSyncCleanupRef.current = null;
        }
      } else {
        setTransientStatus(
          "error",
          response.error?.message || message("failedFetch"),
          5000,
        );
      }
    } catch (error) {
      setTransientStatus("error", message("failedFetch"), 5000);
    }
  };

  const handlePush = async () => {
    try {
      const response = await window.notegitApi.repo.push();
      if (response.ok) {
        setTransientStatus("saved", message("pushSuccessful"), 2000);
        if (isS3Repo) {
          await loadWorkspace();
          if (selectedFile) {
            const fileResponse =
              await window.notegitApi.files.read(selectedFile);
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
        setTransientStatus(
          "error",
          response.error?.message || message("failedPush"),
          5000,
        );
      }
    } catch (error) {
      setTransientStatus("error", message("failedPush"), 5000);
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

      await handleSelectFile(newFilePath, "file");
      return;
    }

    throw new Error(response.error?.message || message("failedCreateFile"));
  };

  const handleCreateFolder = async (parentPath: string, folderName: string) => {
    const response = await window.notegitApi.files.createFolder(
      parentPath,
      folderName,
    );
    if (response.ok) {
      const treeResponse = await window.notegitApi.files.listTree();
      if (treeResponse.ok && treeResponse.data) {
        setTree(treeResponse.data);
      }
      return;
    }

    throw new Error(response.error?.message || message("failedCreateFolder"));
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

    throw new Error(response.error?.message || message("failedDelete"));
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
      } else if (selectedFile && selectedFile.startsWith(oldPath + "/")) {
        const newSelectedPath = selectedFile.replace(
          oldPath + "/",
          newPath + "/",
        );
        setSelectedFile(newSelectedPath);
        if (fileContent) {
          setFileContent({
            ...fileContent,
            path: newSelectedPath,
          });
        }
      }

      if (repoStatus?.provider === REPO_PROVIDERS.git) {
        try {
          await window.notegitApi.files.commitAll(
            `${message("moveCommitMessagePrefix")} ${oldPath} -> ${newPath}`,
          );
        } catch (commitError) {
          setTransientStatus("error", message("failedAutoCommitMove"), 5000);
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

    throw new Error(response.error?.message || message("failedRename"));
  };

  const handleImport = async (sourcePath: string, targetPath: string) => {
    const response = await window.notegitApi.files.import(
      sourcePath,
      targetPath,
    );
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

    throw new Error(response.error?.message || message("failedImportFile"));
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
        await handleSelectFile(response.data, "file");
        return response.data;
      }
      throw new Error(
        response.error?.message || message("failedDuplicateFile"),
      );
    } catch (error: any) {
      setTransientStatus(
        "error",
        error.message || message("failedDuplicateFile"),
        5000,
      );
      throw error;
    }
  };

  const handleCommitAndPush = async () => {
    if (isLocalRepo) {
      return;
    }

    clearStatusTimer();

    if (hasUnsavedChanges && selectedFile) {
      await handleSaveFile(editorContent);
      await new Promise((resolve) => setTimeout(resolve, 500));
      clearStatusTimer();
    }

    setSaveStatus("saving");
    setSaveMessage(
      isS3Repo ? message("syncing") : message("committingAndPushing"),
    );

    try {
      if (isS3Repo) {
        const response = await window.notegitApi.repo.push();
        if (response.ok) {
          setSaveStatus("saved");
          setSaveMessage(message("syncedSuccessfully"));
          await loadWorkspace();
          if (selectedFile) {
            const fileResponse =
              await window.notegitApi.files.read(selectedFile);
            if (fileResponse.ok && fileResponse.data) {
              setFileContent(fileResponse.data);
            }
          }
        } else {
          setSaveStatus("error");
          setSaveMessage(response.error?.message || message("failedSync"));
        }
      } else {
        const response = await window.notegitApi.files.commitAndPushAll();

        if (response.ok) {
          if (response.data?.message === "Nothing to commit") {
            setSaveStatus("idle");
            setSaveMessage(message("nothingToCommit"));
          } else {
            setSaveStatus("saved");
            setSaveMessage(message("committedAndPushedSuccessfully"));
          }
        } else {
          setSaveStatus("error");
          setSaveMessage(
            response.error?.message || message("failedCommitAndPush"),
          );
        }
      }

      const statusResponse = await window.notegitApi.repo.getStatus();
      if (statusResponse.ok && statusResponse.data) {
        setRepoStatus(statusResponse.data);
      }

      setTimeout(
        () => {
          setSaveStatus("idle");
          setSaveMessage("");
        },
        isS3Repo ? 2000 : 3000,
      );
    } catch (error: any) {
      setSaveStatus("error");
      setSaveMessage(
        error.message ||
          (isS3Repo ? message("failedSync") : message("failedCommitAndPush")),
      );

      setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage("");
      }, 5000);
    }
  };

  const handleSelectFileFromSearch = async (filePath: string) => {
    await handleSelectFile(filePath, "file");
  };

  const handleSelectMatchFromRepoSearch = async (
    filePath: string,
    _lineNumber: number,
  ) => {
    await handleSelectFile(filePath, "file");
  };

  const handleOpenLinkedFile = React.useCallback(
    async (filePath: string) => {
      await handleSelectFile(filePath, "file");
    },
    [handleSelectFile],
  );

  const handleViewVersion = (commitHash: string, commitMessage: string) => {
    setViewingCommitHash(commitHash);
    setViewingCommitMessage(commitMessage);
    setHistoryViewerOpen(true);
  };

  const handleToggleHistory = () => {
    setHistoryPanelOpen(!historyPanelOpen);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (isTreeCollapsed) {
      return;
    }
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

      const constrainedWidth = Math.max(
        SIDEBAR_MIN_WIDTH,
        Math.min(SIDEBAR_MAX_WIDTH, newWidth),
      );

      setSidebarWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleToggleTreeCollapse = React.useCallback(() => {
    if (isTreeCollapsed) {
      const restoredWidth = Math.max(
        SIDEBAR_MIN_WIDTH,
        Math.min(
          SIDEBAR_MAX_WIDTH,
          lastExpandedSidebarWidthRef.current || SIDEBAR_DEFAULT_WIDTH,
        ),
      );
      setSidebarWidth(restoredWidth);
      dispatchTreePanel("toggle");
      return;
    }

    lastExpandedSidebarWidthRef.current = sidebarWidth;
    setSidebarWidth(SIDEBAR_COLLAPSED_WIDTH);
    setIsResizing(false);
    dispatchTreePanel("toggle");
  }, [isTreeCollapsed, sidebarWidth]);

  useEffect(() => {
    return () => {
      clearStatusTimer();
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [clearStatusTimer]);

  return (
    <Box sx={rootSx}>
      <Box sx={mainContentSx}>
        <Box sx={sidebarSx(sidebarWidth, isTreeCollapsed)}>
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
            onNavigateBack={handleNavigateBack}
            onNavigateForward={handleNavigateForward}
            canNavigateBack={canNavigateBack}
            canNavigateForward={canNavigateForward}
            isS3Repo={isS3Repo}
            isCollapsed={isTreeCollapsed}
            onToggleCollapse={handleToggleTreeCollapse}
          />
        </Box>

        {!isTreeCollapsed && (
          <Box
            onMouseDown={handleResizeStart}
            sx={resizeHandleSx(isResizing)}
          />
        )}

        <Box sx={editorPaneSx}>
          {fileContent?.type === FileType.TEXT ? (
            <TextEditor
              file={fileContent}
              onSave={handleSaveFile}
              onChange={handleEditorChange}
              treePanelControls={
                isTreeCollapsed
                  ? {
                      onToggleTree: handleToggleTreeCollapse,
                      onNavigateBack: handleNavigateBack,
                      onNavigateForward: handleNavigateForward,
                      canNavigateBack,
                      canNavigateForward,
                    }
                  : undefined
              }
            />
          ) : fileContent?.type === FileType.IMAGE ? (
            <ImageViewer
              file={fileContent}
              repoPath={repoPath}
              treePanelControls={
                isTreeCollapsed
                  ? {
                      onToggleTree: handleToggleTreeCollapse,
                      onNavigateBack: handleNavigateBack,
                      onNavigateForward: handleNavigateForward,
                      canNavigateBack,
                      canNavigateForward,
                    }
                  : undefined
              }
            />
          ) : (
            <MarkdownEditor
              file={fileContent}
              repoPath={repoPath}
              onSave={handleSaveFile}
              onChange={handleEditorChange}
              onOpenLinkedFile={handleOpenLinkedFile}
              treePanelControls={
                isTreeCollapsed
                  ? {
                      onToggleTree: handleToggleTreeCollapse,
                      onNavigateBack: handleNavigateBack,
                      onNavigateForward: handleNavigateForward,
                      canNavigateBack,
                      canNavigateForward,
                    }
                  : undefined
              }
            />
          )}
        </Box>

        {historyPanelOpen && !isLocalRepo && (
          <HistoryPanel
            filePath={selectedFile}
            onViewVersion={handleViewVersion}
            onClose={() => setHistoryPanelOpen(false)}
          />
        )}
      </Box>

      <StatusBar
        status={repoStatus}
        onFetch={handleFetch}
        onPull={handlePull}
        onPush={handlePush}
        headerTitle={headerTitle}
        saveStatus={saveStatus}
        saveMessage={saveMessage}
        hasUnsavedChanges={hasUnsavedChanges}
        historyPanelOpen={historyPanelOpen}
        onOpenSearch={() => setSearchDialogOpen(true)}
        onToggleHistory={handleToggleHistory}
        onSaveAll={handleSaveAll}
        onCommitAndPush={handleCommitAndPush}
        onOpenSettings={() => setSettingsOpen(true)}
        shortcutHelperRef={shortcutHelperRef}
      />

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

      {!isLocalRepo && (
        <HistoryViewer
          open={historyViewerOpen}
          filePath={selectedFile}
          commitHash={viewingCommitHash}
          commitMessage={viewingCommitMessage}
          repoPath={repoPath}
          onClose={() => setHistoryViewerOpen(false)}
        />
      )}

      <AboutDialog
        open={aboutDialogOpen}
        onClose={() => setAboutDialogOpen(false)}
      />
    </Box>
  );
}
