export interface AppSettings {
    autoSaveEnabled: boolean;
    autoSaveIntervalSec: number;
    theme: 'light' | 'dark' | 'system';
    editorPrefs: EditorPreferences;
}
export interface EditorPreferences {
    fontSize: number;
    lineNumbers: boolean;
    wordWrap: boolean;
    tabSize: number;
    showPreview: boolean;
}
export interface RepoSettings {
    remoteUrl: string;
    branch: string;
    localPath: string;
    pat: string;
    authMethod: AuthMethod;
}
export declare enum AuthMethod {
    PAT = "pat",
    SSH = "ssh"
}
export interface FullConfig {
    appSettings: AppSettings;
    repoSettings: RepoSettings | null;
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
export declare const DEFAULT_APP_SETTINGS: AppSettings;
export declare const DEFAULT_APP_STATE: AppStateSnapshot;
