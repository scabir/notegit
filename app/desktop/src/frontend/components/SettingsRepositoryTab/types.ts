import type {
  RepoProviderType,
  RepoSettings,
  GitRepoSettings,
  S3RepoSettings,
} from "../../../shared/types";

export interface SettingsRepositoryTabProps {
  repoProvider: RepoProviderType;
  repoSettings: Partial<RepoSettings>;
  gitRepoSettings: Partial<GitRepoSettings>;
  s3RepoSettings: Partial<S3RepoSettings>;
  loading: boolean;
  onRepoSettingsChange: (settings: Partial<RepoSettings>) => void;
  onSaveRepoSettings: () => void;
  onCopyRepoPath: () => void;
  onOpenRepoFolder: () => void;
}
