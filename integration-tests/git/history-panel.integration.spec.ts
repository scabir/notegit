import {
  apiGetDiff,
  apiGetHistory,
  apiGetVersion,
  appendToCurrentEditor,
  cleanupUserDataDir,
  closeAppIfOpen,
  commitAndPushAll,
  connectGitRepo,
  createIsolatedUserDataDir,
  createMarkdownFile,
  launchIntegrationApp,
  saveCurrentFile,
} from "../helpers/gitIntegration";
import { expect, test } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";

test("history panel loads commits for selected file", async ({
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
    await commitAndPushAll(page);

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

test("historical version content can be loaded", async ({
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
    await commitAndPushAll(page);

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

test("diff between revisions returns hunks", async ({
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
    await commitAndPushAll(page);
    await appendToCurrentEditor(page, "\nline two\n");
    await saveCurrentFile(page);
    await commitAndPushAll(page);

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
