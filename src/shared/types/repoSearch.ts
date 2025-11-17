// Types for repo-wide search and replace

export interface RepoWideSearchResult {
  filePath: string; // Relative path
  fileName: string;
  fullPath: string; // Absolute path
  matches: RepoWideMatch[];
}

export interface RepoWideMatch {
  lineNumber: number;
  lineContent: string;
  matchStart: number; // Character position in line
  matchEnd: number; // Character position in line
  contextBefore: string;
  contextAfter: string;
}

export interface ReplaceResult {
  filesProcessed: number;
  filesModified: number;
  totalReplacements: number;
  errors: { filePath: string; error: string }[];
}

