import type { RepoProviderType, RepoSettings } from "../../shared/types";
import type { RepoStatus, CommitEntry, DiffHunk } from "../../shared/types";

export interface RepoProvider {
  type: RepoProviderType;
  configure(settings: RepoSettings): void;
  open(settings: RepoSettings): Promise<{ localPath: string }>;
  getStatus(): Promise<RepoStatus>;
  fetch(): Promise<RepoStatus>;
  pull(): Promise<void>;
  push(): Promise<void>;
  startAutoSync(intervalMs?: number): void;
  stopAutoSync(): void;
}

export interface HistoryProvider {
  type: RepoProviderType;
  configure(settings: RepoSettings): void;
  getForFile(filePath: string): Promise<CommitEntry[]>;
  getVersion(versionId: string, filePath: string): Promise<string>;
  getDiff(
    versionA: string,
    versionB: string,
    filePath: string,
  ): Promise<DiffHunk[]>;
}
