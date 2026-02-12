import type { ChipProps } from "@mui/material";
import type { ReactElement } from "react";
import type { RepoStatus } from "../../../shared/types";

export interface SyncStatusDisplay {
  icon: ReactElement;
  label: string;
  color: ChipProps["color"];
}

export interface GetSyncStatusParams {
  status: RepoStatus | null;
  isS3: boolean;
  isLocal: boolean;
  hasUnsavedChanges: boolean;
  uncommittedLabel: string;
  unsyncedLabel: string;
  savedLabel: string;
  syncedLabel: string;
}

export interface StatusBarSyncChipProps {
  syncStatus: SyncStatusDisplay | null;
}
