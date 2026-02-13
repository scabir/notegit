import {
  apiCommitAll,
  apiCommitAndPushAll,
  apiCreateFile,
  apiGetHistory,
  apiPush,
  apiReadFile,
  appendToCurrentEditor,
  cleanupUserDataDir,
  clickFetch,
  clickPush,
  clickPull,
  closeAppIfOpen,
  commitAndPushAll,
  connectGitRepo,
  createIsolatedUserDataDir,
  createMarkdownFile,
  expectErrorStatus,
  expectSavedStatus,
  expectTreeToContainPath,
  flattenTreePaths,
  getLatestCommitMessageForFile,
  getRepoInfo,
  getRepoStatus,
  launchIntegrationApp,
  listTree,
  saveCurrentFile,
  selectFileFromTree,
} from "../helpers/gitIntegration";
import { expect, test } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";
import * as fs from "fs/promises";
import * as path from "path";

test("create file, edit content, commit and push", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectGitRepo(page);
    await createMarkdownFile(page, "integration-note.md");
    await appendToCurrentEditor(page, "\nIntegration test content\n");
    await commitAndPushAll(page);

    await expect
      .poll(async () => {
        const status = await getRepoStatus(page);
        return status.ahead;
      })
      .toBe(0);

    const repoInfo = await getRepoInfo(page);
    await fs.access(path.join(repoInfo.localPath, "integration-note.md"));
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("save existing file without commit shows local changes", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectGitRepo(page);
    await createMarkdownFile(page, "save-only.md");
    await appendToCurrentEditor(page, "\nSave-only content\n");
    await saveCurrentFile(page);

    await expect(page.getByTestId("status-bar-sync-chip")).toContainText(
      "Uncommitted changes",
    );

    await expect
      .poll(async () => {
        const status = await getRepoStatus(page);
        return status.hasUncommitted;
      })
      .toBe(true);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("commit all from mixed changes (multiple files)", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectGitRepo(page);
    await createMarkdownFile(page, "mixed-a.md");
    await createMarkdownFile(page, "mixed-b.md");

    await selectFileFromTree(page, "mixed-a.md");
    await appendToCurrentEditor(
      page,
      "\nAdditional content for mixed file A\n",
    );
    await saveCurrentFile(page);

    await commitAndPushAll(page);

    const latestMessage = await getLatestCommitMessageForFile(
      page,
      "mixed-a.md",
    );
    expect(latestMessage).toContain("mixed-a.md");
    expect(latestMessage).toContain("mixed-b.md");

    const status = await getRepoStatus(page);
    expect(status.ahead).toBe(0);
    expect(status.hasUncommitted).toBe(false);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("commit+push with no changes returns nothing to commit", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    const message = await apiCommitAndPushAll(page);
    expect(message).toBe("Nothing to commit");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("auto-generated commit message truncates with 'and N more'", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    for (let index = 0; index < 6; index += 1) {
      await apiCreateFile(page, "", `multi-${index}.md`);
    }
    await apiCommitAndPushAll(page);

    const history = await apiGetHistory(page, "multi-0.md");
    expect(history[0].message).toContain("and 1 more");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("save then commit+push ends in synced status", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createMarkdownFile(page, "sync-state.md");
    await appendToCurrentEditor(page, "\ncontent\n");
    await saveCurrentFile(page);
    await commitAndPushAll(page);

    const status = await getRepoStatus(page);
    expect(status.ahead).toBe(0);
    expect(status.hasUncommitted).toBe(false);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("push button is disabled when no pending commits", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await expect(page.getByTestId("status-bar-push-action")).toBeDisabled();
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("push button enables after commit and disables after push", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await apiCreateFile(page, "", "push-toggle.md");
    await apiCommitAll(page, "commit without push");
    await clickFetch(page);
    await expect(page.getByTestId("status-bar-push-action")).toBeEnabled();

    await clickPush(page);
    await expectSavedStatus(page);
    await expect(page.getByTestId("status-bar-push-action")).toBeDisabled();

    const status = await getRepoStatus(page);
    expect(status.ahead).toBe(0);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("pull button enabled when behind and disabled after pull", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir, {
      env: { NOTEGIT_MOCK_GIT_INITIAL_BEHIND: "2" },
    });
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await expect(page.getByTestId("status-bar-pull-action")).toBeEnabled();
    await clickPull(page);
    await expectSavedStatus(page);
    await expect(page.getByTestId("status-bar-pull-action")).toBeDisabled();

    const status = await getRepoStatus(page);
    expect(status.behind).toBe(0);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("fetch refreshes behind count without changing tree", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir, {
      env: { NOTEGIT_MOCK_GIT_FETCH_SETS_BEHIND: "3" },
    });
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    const treeBefore = flattenTreePaths(await listTree(page));
    await clickFetch(page);
    const treeAfter = flattenTreePaths(await listTree(page));
    const status = await getRepoStatus(page);

    expect(status.behind).toBe(3);
    expect(treeAfter).toEqual(treeBefore);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("commit dialog path via commitAll + push supports custom message", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await apiCreateFile(page, "", "custom-message.md");
    await apiCommitAll(page, "Custom integration commit");
    await apiPush(page);

    const history = await apiGetHistory(page, "custom-message.md");
    expect(history[0].message).toBe("Custom integration commit");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("save-all action persists unsaved buffer before commit+push", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createMarkdownFile(page, "save-all.md");
    await appendToCurrentEditor(page, "\nsave-all content\n");
    await page.getByTestId("status-bar-save-all-action").click();
    await expectSavedStatus(page);

    const statusAfterSaveAll = await getRepoStatus(page);
    expect(statusAfterSaveAll.hasUncommitted).toBe(true);

    await commitAndPushAll(page);
    const statusAfterCommit = await getRepoStatus(page);
    expect(statusAfterCommit.hasUncommitted).toBe(false);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("save-all persists editor buffer while preserving other uncommitted files", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await apiCreateFile(page, "", "api-dirty.md");
    await createMarkdownFile(page, "editor-dirty.md");
    await appendToCurrentEditor(page, "\neditor dirty content\n");

    await page.getByTestId("status-bar-save-all-action").click();
    await expectSavedStatus(page);

    const savedEditorContent = await apiReadFile(page, "editor-dirty.md");
    expect(savedEditorContent).toContain("editor dirty content");

    const status = await getRepoStatus(page);
    expect(status.hasUncommitted).toBe(true);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("beforeunload autosave persists content and updates local status", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

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

    const status = await getRepoStatus(page);
    expect(status.hasUncommitted).toBe(true);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("pull conflict is surfaced without crashing", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir, {
      env: {
        NOTEGIT_MOCK_GIT_INITIAL_BEHIND: "1",
        NOTEGIT_MOCK_GIT_FAIL_PULL: "conflict",
      },
    });
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await clickPull(page);
    await expectErrorStatus(page, "CONFLICT");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("push failure is surfaced and app stays responsive", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir, {
      env: { NOTEGIT_MOCK_GIT_FAIL_PUSH: "1" },
    });
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);
    await createMarkdownFile(page, "push-fail.md");
    await appendToCurrentEditor(page, "\ncontent\n");

    await page.getByTestId("status-bar-commit-push-action").click();
    await expectErrorStatus(page, "Push failed");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("fetch failure is surfaced and app stays responsive", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir, {
      env: { NOTEGIT_MOCK_GIT_FAIL_FETCH: "1" },
    });
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await clickFetch(page);
    await expectErrorStatus(page, "Fetch failed");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("commit failure is surfaced and app stays responsive", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir, {
      env: { NOTEGIT_MOCK_GIT_FAIL_COMMIT: "1" },
    });
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);
    await createMarkdownFile(page, "commit-fail.md");
    await appendToCurrentEditor(page, "\ncontent\n");

    await page.getByTestId("status-bar-commit-push-action").click();
    await expectErrorStatus(page, "Commit failed");

    const status = await getRepoStatus(page);
    expect(status.hasUncommitted).toBe(true);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("push remains disabled when repo is only behind", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir, {
      env: { NOTEGIT_MOCK_GIT_INITIAL_BEHIND: "2" },
    });
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await expect(page.getByTestId("status-bar-pull-action")).toBeEnabled();
    await expect(page.getByTestId("status-bar-push-action")).toBeDisabled();
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("git unavailable warning is shown for existing git config", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let firstApp: ElectronApplication | null = null;
  let secondApp: ElectronApplication | null = null;
  try {
    const firstLaunch = await launchIntegrationApp(userDataDir);
    firstApp = firstLaunch.app;
    await connectGitRepo(firstLaunch.page);
    await closeAppIfOpen(firstApp);
    firstApp = null;

    const secondLaunch = await launchIntegrationApp(userDataDir, {
      env: { NOTEGIT_MOCK_GIT_INSTALLED: "0" },
    });
    secondApp = secondLaunch.app;
    const page = secondLaunch.page;

    await expect(
      page.getByText("Git is not installed on your system"),
    ).toBeVisible();
  } finally {
    await closeAppIfOpen(firstApp);
    await closeAppIfOpen(secondApp);
    await cleanupUserDataDir(userDataDir);
  }
});

test("offline mode handles pull/push/fetch errors and remains usable", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir, {
      env: {
        NOTEGIT_MOCK_GIT_OFFLINE: "1",
        NOTEGIT_MOCK_GIT_INITIAL_BEHIND: "1",
      },
    });
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);
    await createMarkdownFile(page, "offline.md");
    await appendToCurrentEditor(page, "\noffline content\n");

    await clickFetch(page);
    await expectErrorStatus(page, "Network offline");

    await clickPull(page);
    await expectErrorStatus(page, "Network offline");

    await page.getByTestId("status-bar-commit-push-action").click();
    await expectErrorStatus(page, "Network offline");

    await apiCreateFile(page, "", "still-works.md");
    await expectTreeToContainPath(page, "still-works.md");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});
