import type { FileTreeNode, FileContent } from './domain';
import type { RepoSettings, FullConfig, AppSettings, Profile } from './config';
import type { RepoStatus, CommitEntry, DiffHunk } from './git';
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

export enum ApiErrorCode {
  GIT_NOT_INSTALLED = 'GIT_NOT_INSTALLED',
  GIT_CLONE_FAILED = 'GIT_CLONE_FAILED',
  GIT_AUTH_FAILED = 'GIT_AUTH_FAILED',
  GIT_PULL_FAILED = 'GIT_PULL_FAILED',
  GIT_PUSH_FAILED = 'GIT_PUSH_FAILED',
  GIT_CONFLICT = 'GIT_CONFLICT',
  FS_NOT_FOUND = 'FS_NOT_FOUND',
  FS_PERMISSION_DENIED = 'FS_PERMISSION_DENIED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REPO_NOT_INITIALIZED = 'REPO_NOT_INITIALIZED',
  REPO_PROVIDER_MISMATCH = 'REPO_PROVIDER_MISMATCH',
  S3_VERSIONING_REQUIRED = 'S3_VERSIONING_REQUIRED',
  S3_AUTH_FAILED = 'S3_AUTH_FAILED',
  S3_SYNC_FAILED = 'S3_SYNC_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface SearchResult {
  filePath: string;
  fileName: string;
  matches: SearchMatch[];
}

export interface SearchMatch {
  lineNumber: number;
  lineContent: string;
  contextBefore: string;
  contextAfter: string;
}

export interface OpenOrCloneRepoResponse {
  localPath: string;
  tree: FileTreeNode[];
  status: RepoStatus;
}

export interface NotegitApi {
  config: {
    getFull: () => Promise<ApiResponse<FullConfig>>;
    getAppSettings: () => Promise<ApiResponse<AppSettings>>;
    updateAppSettings: (settings: Partial<AppSettings>) => Promise<ApiResponse<void>>;
    updateRepoSettings: (settings: RepoSettings) => Promise<ApiResponse<void>>;
    getFavorites: () => Promise<ApiResponse<string[]>>;
    updateFavorites: (favorites: string[]) => Promise<ApiResponse<void>>;
    checkGitInstalled: () => Promise<ApiResponse<boolean>>;
    getProfiles: () => Promise<ApiResponse<Profile[]>>;
    getActiveProfileId: () => Promise<ApiResponse<string | null>>;
    createProfile: (name: string, repoSettings: Partial<RepoSettings>) => Promise<ApiResponse<Profile>>;
    deleteProfile: (profileId: string) => Promise<ApiResponse<void>>;
    setActiveProfile: (profileId: string) => Promise<ApiResponse<void>>;
    restartApp: () => Promise<void>;
  };
  repo: {
    openOrClone: (settings: RepoSettings) => Promise<ApiResponse<OpenOrCloneRepoResponse>>;
    getStatus: () => Promise<ApiResponse<RepoStatus>>;
    fetch: () => Promise<ApiResponse<RepoStatus>>;
    pull: () => Promise<ApiResponse<void>>;
    push: () => Promise<ApiResponse<void>>;
    startAutoPush: () => Promise<ApiResponse<void>>;
  };
  files: {
    listTree: () => Promise<ApiResponse<FileTreeNode[]>>;
    read: (path: string) => Promise<ApiResponse<FileContent>>;
    save: (path: string, content: string) => Promise<ApiResponse<void>>;
    saveWithGitWorkflow: (
      path: string,
      content: string,
      isAutosave?: boolean
    ) => Promise<
      ApiResponse<{ pullFailed?: boolean; pushFailed?: boolean; conflictDetected?: boolean }>
    >;
    commit: (path: string, message: string) => Promise<ApiResponse<void>>;
    commitAll: (message: string) => Promise<ApiResponse<void>>;
    commitAndPushAll: () => Promise<ApiResponse<{ message: string }>>;
    create: (parentPath: string, name: string) => Promise<ApiResponse<void>>;
    createFile: (parentPath: string, name: string) => Promise<ApiResponse<void>>;
    createFolder: (parentPath: string, name: string) => Promise<ApiResponse<void>>;
    delete: (path: string) => Promise<ApiResponse<void>>;
    rename: (oldPath: string, newPath: string) => Promise<ApiResponse<void>>;
    saveAs: (repoPath: string, destPath: string) => Promise<ApiResponse<void>>;
    duplicate: (repoPath: string) => Promise<ApiResponse<string>>;
    import: (sourcePath: string, targetPath: string) => Promise<ApiResponse<void>>;
  };
  dialog: {
    showOpenDialog: (options: any) => Promise<{ canceled: boolean; filePaths: string[] }>;
    showSaveDialog: (options: any) => Promise<{ canceled: boolean; filePath?: string }>;
  };
  history: {
    getForFile: (path: string) => Promise<ApiResponse<CommitEntry[]>>;
    getVersion: (commitHash: string, path: string) => Promise<ApiResponse<string>>;
    getDiff: (hash1: string, hash2: string, path: string) => Promise<ApiResponse<DiffHunk[]>>;
  };
  search: {
    query: (query: string, options?: { maxResults?: number }) => Promise<ApiResponse<SearchResult[]>>;
    repoWide: (
      query: string,
      options?: { caseSensitive?: boolean; useRegex?: boolean }
    ) => Promise<ApiResponse<any[]>>;
    replaceInRepo: (
      query: string,
      replacement: string,
      options: { caseSensitive?: boolean; useRegex?: boolean; filePaths?: string[] }
    ) => Promise<ApiResponse<any>>;
  };
  export: {
    note: (
      fileName: string,
      content: string,
      defaultExtension?: 'md' | 'txt'
    ) => Promise<ApiResponse<string>>;
    repoZip: () => Promise<ApiResponse<string>>;
  };
  logs: {
    getContent: (logType: 'combined' | 'error') => Promise<ApiResponse<string>>;
    export: (logType: 'combined' | 'error', destPath: string) => Promise<ApiResponse<void>>;
    getFolder: () => Promise<ApiResponse<string>>;
  };
}

declare global {
  interface Window {
    notegitApi: NotegitApi;
  }
}
