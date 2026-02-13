import { getSyncStatus } from "../../../frontend/components/StatusBarSyncChip/utils";
import type { GetSyncStatusParams } from "../../../frontend/components/StatusBarSyncChip/types";
import { REPO_PROVIDERS } from "../../../shared/types";

const createParams = (
  overrides: Partial<GetSyncStatusParams> = {},
): GetSyncStatusParams => ({
  status: {
    provider: REPO_PROVIDERS.git,
    branch: "main",
    ahead: 0,
    behind: 0,
    hasUncommitted: false,
    pendingPushCount: 0,
    needsPull: false,
  },
  isS3: false,
  isLocal: false,
  hasUnsavedChanges: false,
  uncommittedLabel: "Uncommitted changes",
  unsyncedLabel: "Unsynced changes",
  savedLabel: "Saved",
  syncedLabel: "Synced",
  ...overrides,
});

describe("StatusBarSyncChip getSyncStatus", () => {
  it("returns null when status is not available", () => {
    expect(getSyncStatus(createParams({ status: null }))).toBeNull();
  });

  it("returns local repo labels based on unsaved changes", () => {
    const unsaved = getSyncStatus(
      createParams({ isLocal: true, hasUnsavedChanges: true }),
    );
    const saved = getSyncStatus(
      createParams({ isLocal: true, hasUnsavedChanges: false }),
    );

    expect(unsaved?.label).toBe("Uncommitted changes");
    expect(unsaved?.color).toBe("warning");
    expect(saved?.label).toBe("Saved");
    expect(saved?.color).toBe("success");
  });

  it("prioritizes pending push count for git and s3 labels", () => {
    const gitPending = getSyncStatus(
      createParams({
        status: { ...createParams().status!, pendingPushCount: 2 },
      }),
    );
    const s3Pending = getSyncStatus(
      createParams({
        isS3: true,
        status: { ...createParams().status!, pendingPushCount: 3 },
      }),
    );

    expect(gitPending?.label).toBe("2 commits waiting");
    expect(s3Pending?.label).toBe("3 changes waiting");
    expect(gitPending?.color).toBe("warning");
  });

  it("reports ahead and behind states with provider-specific labels", () => {
    const gitAhead = getSyncStatus(
      createParams({ status: { ...createParams().status!, ahead: 2 } }),
    );
    const s3Ahead = getSyncStatus(
      createParams({
        isS3: true,
        status: { ...createParams().status!, ahead: 1 },
      }),
    );
    const gitBehind = getSyncStatus(
      createParams({ status: { ...createParams().status!, behind: 4 } }),
    );
    const s3Behind = getSyncStatus(
      createParams({
        isS3: true,
        status: { ...createParams().status!, behind: 5 },
      }),
    );

    expect(gitAhead?.label).toBe("2 ahead");
    expect(gitAhead?.color).toBe("info");
    expect(s3Ahead?.label).toBe("1 local changes");
    expect(gitBehind?.label).toBe("4 behind");
    expect(s3Behind?.label).toBe("5 remote changes");
  });

  it("shows uncommitted/synced labels when no pending sync counters exist", () => {
    const gitUncommitted = getSyncStatus(
      createParams({
        status: { ...createParams().status!, hasUncommitted: true },
      }),
    );
    const s3Uncommitted = getSyncStatus(
      createParams({
        isS3: true,
        status: { ...createParams().status!, hasUncommitted: true },
      }),
    );
    const synced = getSyncStatus(createParams());

    expect(gitUncommitted?.label).toBe("Uncommitted changes");
    expect(s3Uncommitted?.label).toBe("Unsynced changes");
    expect(gitUncommitted?.color).toBe("default");
    expect(synced?.label).toBe("Synced");
    expect(synced?.color).toBe("success");
  });
});
