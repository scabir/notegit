export interface SaveNoteRequest {
  path: string;
  content: string;
  autoCommit?: boolean;
  commitMessage?: string;
}

export interface CreateNoteRequest {
  parentPath: string;
  name: string;
  initialContent?: string;
}

export interface CreateFolderRequest {
  parentPath: string;
  name: string;
}

export interface RenamePathRequest {
  oldPath: string;
  newPath: string;
}

export interface DeletePathRequest {
  path: string;
  recursive?: boolean;
}

export interface CommitRequest {
  path: string;
  message: string;
  autoPush?: boolean;
}

export interface SaveAsRequest {
  repoPath: string;
  destinationPath: string;
}
