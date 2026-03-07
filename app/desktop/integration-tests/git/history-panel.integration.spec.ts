import {
  apiCommitAndPushAll,
  apiGetDiff,
  apiGetHistory,
  apiGetVersion,
  appendToCurrentEditor,
  cleanupUserDataDir,
  closeAppIfOpen,
  connectGitRepo,
  createIsolatedUserDataDir,
  createMarkdownFile,
  launchIntegrationApp,
  saveCurrentFile,
} from "../helpers/gitIntegration";
import { expect, test } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";

test("(git) history panel loads commits for selected file", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createMarkdownFile(page, "history-panel.md");
    await appendToCurrentEditor(page, "\nhistory content\n");
    await saveCurrentFile(page);
    await apiCommitAndPushAll(page);

    await page.getByTestId("status-bar-history-action").click();
    await expect(
      page.getByRole("heading", { name: "File History" }),
    ).toBeVisible();

    const history = await apiGetHistory(page, "history-panel.md");
    expect(history.length).toBeGreaterThan(0);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) historical version content can be loaded", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createMarkdownFile(page, "history-version.md");
    await appendToCurrentEditor(page, "\nversion one\n");
    await saveCurrentFile(page);
    await apiCommitAndPushAll(page);

    const history = await apiGetHistory(page, "history-version.md");
    const content = await apiGetVersion(
      page,
      history[0].hash,
      "history-version.md",
    );
    expect(content).toContain("version one");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) diff between revisions returns hunks", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createMarkdownFile(page, "history-diff.md");
    await appendToCurrentEditor(page, "\nline one\n");
    await saveCurrentFile(page);
    await apiCommitAndPushAll(page);
    await appendToCurrentEditor(page, "\nline two\n");
    await saveCurrentFile(page);
    await apiCommitAndPushAll(page);

    const history = await apiGetHistory(page, "history-diff.md");
    expect(history.length).toBeGreaterThanOrEqual(2);

    const diff = await apiGetDiff(
      page,
      history[1].hash,
      history[0].hash,
      "history-diff.md",
    );
    expect(diff.length).toBeGreaterThan(0);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) history panel shows empty state for uncommitted file", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createMarkdownFile(page, "history-empty.md");
    await appendToCurrentEditor(page, "\nnot committed yet\n");
    await saveCurrentFile(page);

    await page.getByTestId("status-bar-history-action").click();
    await expect(
      page.getByRole("heading", { name: "File History" }),
    ).toBeVisible();
    await expect(
      page.getByText("No commits found for this file"),
    ).toBeVisible();
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) history entry opens read-only history viewer dialog", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createMarkdownFile(page, "history-open-viewer.md");
    await appendToCurrentEditor(page, "\nviewer content\n");
    await saveCurrentFile(page);
    await apiCommitAndPushAll(page);

    await page.getByTestId("status-bar-history-action").click();
    const history = await apiGetHistory(page, "history-open-viewer.md");
    const shortHash = history[0].hash.slice(0, 7);
    await page.getByText(shortHash, { exact: true }).click();

    await expect(page.getByText("READ ONLY")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy Content" }),
    ).toBeVisible();
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) history panel can be closed and reopened", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createMarkdownFile(page, "history-toggle.md");
    await appendToCurrentEditor(page, "\nhistory toggle\n");
    await saveCurrentFile(page);
    await apiCommitAndPushAll(page);

    await page.getByTestId("status-bar-history-action").click();
    await expect(
      page.getByRole("heading", { name: "File History" }),
    ).toBeVisible();

    await page.getByTestId("status-bar-history-action").click();
    await expect(
      page.getByRole("heading", { name: "File History" }),
    ).toHaveCount(0);

    await page.getByTestId("status-bar-history-action").click();
    await expect(
      page.getByRole("heading", { name: "File History" }),
    ).toBeVisible();
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});
