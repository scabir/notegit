export interface AppSettings {
  autoSaveEnabled: boolean;
  autoSaveIntervalSec: number;
  s3AutoSyncEnabled: boolean;
  s3AutoSyncIntervalSec: number;
  theme: 'light' | 'dark' | 'system';
  editorPrefs: EditorPreferences;
}

export interface EditorPreferences {
  fontSize: number;
  lineNumbers: boolean;
  tabSize: number;
  showPreview: boolean;
}

export type RepoProviderType = 'git' | 's3';

export interface GitRepoSettings {
  provider: 'git';
  remoteUrl: string;
  branch: string;
  localPath: string;
  pat: string; // Personal Access Token (encrypted in storage)
  authMethod: AuthMethod;
}

export interface S3RepoSettings {
  provider: 's3';
  bucket: string;
  region: string;
  prefix?: string;
  localPath: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export type RepoSettings = GitRepoSettings | S3RepoSettings;

export enum AuthMethod {
  PAT = 'pat',
  SSH = 'ssh',
}

export interface Profile {
  id: string;
  name: string;
  repoSettings: RepoSettings;
  createdAt: number;
  lastUsedAt: number;
}

export interface FullConfig {
  appSettings: AppSettings;
  repoSettings: RepoSettings | null; // Legacy field for migration
  profiles: Profile[];
  activeProfileId: string | null;
  appStateSnapshot?: AppStateSnapshot;
}

export interface AppStateSnapshot {
  lastOpenedFile?: string;
  expandedFolders: string[];
  windowSize?: {
    width: number;
    height: number;
  };
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  autoSaveEnabled: false,
  autoSaveIntervalSec: 30,
  s3AutoSyncEnabled: true,
  s3AutoSyncIntervalSec: 30,
  theme: 'system',
  editorPrefs: {
    fontSize: 14,
    lineNumbers: true,
    tabSize: 2,
    showPreview: true,
  },
};

export const DEFAULT_APP_STATE: AppStateSnapshot = {
  expandedFolders: [],
};
