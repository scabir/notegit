import type { RepoStatus } from "../../../shared/types";

export interface StatusBarUncommittedChipProps {
  status: RepoStatus | null;
  isLocal: boolean;
  isS3: boolean;
  unsyncedLabel: string;
  uncommittedLabel: string;
  syncStatusLabel?: string;
}
