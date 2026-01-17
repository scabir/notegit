import type { FileTreeNode, RepoStatus } from '../../shared/types';
import type { ApiResponse } from '../../shared/types/api';

export interface S3AutoSyncDeps {
  startAutoPush: () => Promise<ApiResponse<void>>;
  getStatus: () => Promise<ApiResponse<RepoStatus>>;
  listTree: () => Promise<ApiResponse<FileTreeNode[]>>;
  setStatus: (status: RepoStatus) => void;
  setTree: (tree: FileTreeNode[]) => void;
}

export const getS3AutoSyncIntervalMs = (intervalSec?: number): number => {
  const fallbackSec = 30;
  const seconds = intervalSec || fallbackSec;
  return Math.max(1000, seconds * 1000);
};

export const startS3AutoSync = (
  enabled: boolean,
  intervalSec: number | undefined,
  deps: S3AutoSyncDeps
): (() => void) => {
  if (!enabled) {
    return () => {};
  }

  const refreshStatusAndTree = async () => {
    const statusResponse = await deps.getStatus();
    if (statusResponse.ok && statusResponse.data) {
      deps.setStatus(statusResponse.data);
    }

    const treeResponse = await deps.listTree();
    if (treeResponse.ok && treeResponse.data) {
      deps.setTree(treeResponse.data);
    }
  };

  void deps.startAutoPush();
  void refreshStatusAndTree();

  const intervalMs = getS3AutoSyncIntervalMs(intervalSec);
  const timer = setInterval(() => {
    void refreshStatusAndTree();
  }, intervalMs);

  return () => clearInterval(timer);
};
