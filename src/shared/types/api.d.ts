import type { FileTreeNode, FileContent } from './domain';
import type { RepoSettings, FullConfig, AppSettings } from './config';
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
export declare enum ApiErrorCode {
    GIT_NOT_INSTALLED = "GIT_NOT_INSTALLED",
    GIT_CLONE_FAILED = "GIT_CLONE_FAILED",
    GIT_AUTH_FAILED = "GIT_AUTH_FAILED",
    GIT_PULL_FAILED = "GIT_PULL_FAILED",
    GIT_PUSH_FAILED = "GIT_PUSH_FAILED",
    GIT_CONFLICT = "GIT_CONFLICT",
    FS_NOT_FOUND = "FS_NOT_FOUND",
    FS_PERMISSION_DENIED = "FS_PERMISSION_DENIED",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export interface OpenOrCloneRepoResponse {
    localPath: string;
    tree: FileTreeNode[];
    status: RepoStatus;
}
export interface NotegitApi {
    config: {
        getFull: () => Promise<ApiResponse<FullConfig>>;
        updateAppSettings: (settings: Partial<AppSettings>) => Promise<ApiResponse<void>>;
        updateRepoSettings: (settings: RepoSettings) => Promise<ApiResponse<void>>;
        checkGitInstalled: () => Promise<ApiResponse<boolean>>;
    };
    repo: {
        openOrClone: (settings: RepoSettings) => Promise<ApiResponse<OpenOrCloneRepoResponse>>;
        getStatus: () => Promise<ApiResponse<RepoStatus>>;
        pull: () => Promise<ApiResponse<void>>;
        push: () => Promise<ApiResponse<void>>;
        startAutoPush: () => Promise<ApiResponse<void>>;
    };
    files: {
        listTree: () => Promise<ApiResponse<FileTreeNode[]>>;
        read: (path: string) => Promise<ApiResponse<FileContent>>;
        save: (path: string, content: string) => Promise<ApiResponse<void>>;
        commit: (path: string, message: string) => Promise<ApiResponse<void>>;
        create: (parentPath: string, name: string) => Promise<ApiResponse<void>>;
        createFolder: (parentPath: string, name: string) => Promise<ApiResponse<void>>;
        delete: (path: string) => Promise<ApiResponse<void>>;
        rename: (oldPath: string, newPath: string) => Promise<ApiResponse<void>>;
        saveAs: (repoPath: string, destPath: string) => Promise<ApiResponse<void>>;
    };
    history: {
        getForFile: (path: string) => Promise<ApiResponse<CommitEntry[]>>;
        getVersion: (commitHash: string, path: string) => Promise<ApiResponse<string>>;
        getDiff: (hash1: string, hash2: string, path: string) => Promise<ApiResponse<DiffHunk[]>>;
    };
}
declare global {
    interface Window {
        notegitApi: NotegitApi;
    }
}
