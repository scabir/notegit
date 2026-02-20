import {
  apiCommitAndPushAll,
  apiCreateFile,
  apiFetch,
  apiPull,
  apiReadFile,
  appendToCurrentEditor,
  cleanupUserDataDir,
  closeAppIfOpen,
  connectS3Repo,
  createIsolatedUserDataDir,
  createMarkdownFile,
  expectSavedStatus,
  expectSyncChipText,
  expectTreeToContainPath,
  flattenTreePaths,
  getRepoStatus,
  launchS3IntegrationApp,
  listTree,
  syncAll,
} from "../helpers/gitIntegration";
import { expect, test } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";

test("(S3) create file, edit content, and sync", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectS3Repo(page);
    await createMarkdownFile(page, "s3-sync-note.md");
    await appendToCurrentEditor(page, "\nS3 integration test content\n");
    await syncAll(page);

    await expect
      .poll(async () => {
        const status = await getRepoStatus(page);
        return status.hasUncommitted || status.pendingPushCount > 0;
      })
      .toBe(false);

    const content = await apiReadFile(page, "s3-sync-note.md");
    expect(content).toContain("S3 integration test content");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) local-only changes are visible before sync", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectS3Repo(page);
    await apiCreateFile(page, "", "local-only.md");

    await expectSyncChipText(page, "changes waiting");

    const status = await getRepoStatus(page);
    expect(status.provider).toBe("s3");
    expect(status.hasUncommitted).toBe(true);
    expect(status.pendingPushCount).toBeGreaterThan(0);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) sync all from mixed changes succeeds", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectS3Repo(page);
    await apiCreateFile(page, "", "mixed-a.md");
    await apiCreateFile(page, "", "mixed-b.md");

    await syncAll(page);

    await expectTreeToContainPath(page, "mixed-a.md");
    await expectTreeToContainPath(page, "mixed-b.md");

    const status = await getRepoStatus(page);
    expect(status.hasUncommitted).toBe(false);
    expect(status.pendingPushCount).toBe(0);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) sync with no local changes returns synced successfully", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectS3Repo(page);

    const message = await apiCommitAndPushAll(page);
    expect(message).toBe("Synced successfully");

    const status = await getRepoStatus(page);
    expect(status.hasUncommitted).toBe(false);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) save-all action persists unsaved buffer before sync", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectS3Repo(page);
    await createMarkdownFile(page, "save-all.md");
    await appendToCurrentEditor(page, "\nsave-all content\n");
    await page.getByTestId("status-bar-save-all-action").click();
    await expectSavedStatus(page);

    const savedEditorContent = await apiReadFile(page, "save-all.md");
    expect(savedEditorContent).toContain("save-all content");

    await syncAll(page);
    const statusAfterSync = await getRepoStatus(page);
    expect(statusAfterSync.hasUncommitted).toBe(false);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) beforeunload autosave persists content in s3 workspace", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectS3Repo(page);
    await createMarkdownFile(page, "autosave.md");
    await appendToCurrentEditor(page, "\nautosaved text\n");
    await page.evaluate(() => {
      window.dispatchEvent(new Event("beforeunload", { cancelable: true }));
    });

    await expect
      .poll(async () => {
        const content = await apiReadFile(page, "autosave.md");
        return content.includes("autosaved text");
      })
      .toBe(true);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) status bar uses bucket label and hides git-only actions", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectS3Repo(page);

    await expect(page.getByTestId("status-bar-branch-label")).toContainText(
      "Bucket:",
    );
    await expect(page.getByTestId("status-bar-fetch-action")).toHaveCount(0);
    await expect(page.getByTestId("status-bar-pull-action")).toHaveCount(0);
    await expect(page.getByTestId("status-bar-push-action")).toHaveCount(0);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) sync chip transitions from pending changes to synced", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectS3Repo(page);
    await apiCreateFile(page, "", "chip-transition.md");

    const statusBeforeSync = await getRepoStatus(page);
    expect(statusBeforeSync.pendingPushCount).toBeGreaterThan(0);

    await syncAll(page);
    await expectSyncChipText(page, "Synced");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) fetch reports status without changing tree", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectS3Repo(page);
    await apiCreateFile(page, "", "fetch-safe.md");

    const treeBefore = flattenTreePaths(await listTree(page));
    await apiFetch(page);
    const treeAfter = flattenTreePaths(await listTree(page));

    expect(treeAfter).toEqual(treeBefore);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) pull is safe and keeps local-only unsynced changes", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectS3Repo(page);
    await apiCreateFile(page, "", "pull-safe.md");

    await apiPull(page);

    const status = await getRepoStatus(page);
    expect(status.hasUncommitted).toBe(true);
    expect(status.pendingPushCount).toBeGreaterThan(0);
    await expectTreeToContainPath(page, "pull-safe.md");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});
