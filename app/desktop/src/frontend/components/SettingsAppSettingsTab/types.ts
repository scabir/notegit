import type { AppSettings, RepoProviderType } from "../../../shared/types";

export interface SettingsAppSettingsTabProps {
  appSettings: AppSettings | null;
  repoProvider: RepoProviderType;
  supportedLocales?: string[];
  loading: boolean;
  onAppSettingsChange: (settings: AppSettings) => void;
  onSaveAppSettings: () => void;
}
