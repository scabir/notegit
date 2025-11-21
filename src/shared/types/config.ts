// Configuration types

export interface AppSettings {
  autoSaveEnabled: boolean;
  autoSaveIntervalSec: number;
  theme: 'light' | 'dark' | 'system';
  editorPrefs: EditorPreferences;
}

export interface EditorPreferences {
  fontSize: number;
  lineNumbers: boolean;
  tabSize: number;
  showPreview: boolean;
}

export interface RepoSettings {
  remoteUrl: string;
  branch: string;
  localPath: string;
  pat: string; // Personal Access Token (encrypted in storage)
  authMethod: AuthMethod;
}

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

// Default values
export const DEFAULT_APP_SETTINGS: AppSettings = {
  autoSaveEnabled: false,
  autoSaveIntervalSec: 30,
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

