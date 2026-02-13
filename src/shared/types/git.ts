import type { RepoProviderType } from "./config";

export interface RepoStatus {
  provider: RepoProviderType;
  branch: string;
  ahead: number;
  behind: number;
  hasUncommitted: boolean;
  pendingPushCount: number;
  needsPull: boolean;
  isConnected?: boolean;
  lastSyncTime?: Date;
}

export interface CommitEntry {
  hash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
  files?: string[];
}

export interface NoteHistoryEntry extends CommitEntry {
  filePath: string;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: "add" | "remove" | "context";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface GitStatusInfo {
  modified: string[];
  added: string[];
  deleted: string[];
  renamed: { from: string; to: string }[];
  untracked: string[];
}
