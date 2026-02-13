import {
  apiGetDiff,
  apiGetHistory,
  apiGetVersion,
  appendToCurrentEditor,
  cleanupUserDataDir,
  closeAppIfOpen,
  connectS3Repo,
  createIsolatedUserDataDir,
  createMarkdownFile,
  launchS3IntegrationApp,
  saveCurrentFile,
  syncAll,
} from "../helpers/gitIntegration";
import { expect, test } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";

test("(S3) history panel loads object versions for selected file", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

    await createMarkdownFile(page, "history-panel.md");
    await appendToCurrentEditor(page, "\nhistory content\n");
    await saveCurrentFile(page);
    await syncAll(page);

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

test("(S3) historical s3 version content can be loaded", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

    await createMarkdownFile(page, "history-version.md");
    await appendToCurrentEditor(page, "\nversion one\n");
    await saveCurrentFile(page);
    await syncAll(page);

    await page.waitForTimeout(20);
    await appendToCurrentEditor(page, "\nversion two\n");
    await saveCurrentFile(page);
    await syncAll(page);

    const history = await apiGetHistory(page, "history-version.md");
    expect(history.length).toBeGreaterThanOrEqual(2);

    const oldVersion = await apiGetVersion(
      page,
      history[history.length - 1].hash,
      "history-version.md",
    );
    const latestVersion = await apiGetVersion(
      page,
      history[0].hash,
      "history-version.md",
    );

    expect(oldVersion).toContain("version one");
    expect(latestVersion).toContain("version two");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) history panel shows empty state for unsynced file", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

    await createMarkdownFile(page, "history-empty.md");

    await page.getByTestId("status-bar-history-action").click();
    await expect(
      page.getByRole("heading", { name: "File History" }),
    ).toBeVisible();
    await expect(page.getByText("No commits found for this file")).toBeVisible();
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) history entry opens read-only history viewer dialog", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

    await createMarkdownFile(page, "history-open-viewer.md");
    await appendToCurrentEditor(page, "\nviewer content\n");
    await saveCurrentFile(page);
    await syncAll(page);

    await page.getByTestId("status-bar-history-action").click();
    const history = await apiGetHistory(page, "history-open-viewer.md");
    const shortHash = history[0].hash.slice(0, 7);
    await page.getByText(shortHash, { exact: true }).click();

    await expect(page.getByText("READ ONLY")).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy Content" })).toBeVisible();
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) history panel can be closed and reopened", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

    await createMarkdownFile(page, "history-toggle.md");
    await appendToCurrentEditor(page, "\nhistory toggle\n");
    await saveCurrentFile(page);
    await syncAll(page);

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

test("(S3) history ordering is newest-first", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

    await createMarkdownFile(page, "history-order.md");
    await appendToCurrentEditor(page, "\nold body\n");
    await saveCurrentFile(page);
    await syncAll(page);

    await page.waitForTimeout(20);
    await appendToCurrentEditor(page, "\nnew body\n");
    await saveCurrentFile(page);
    await syncAll(page);

    const history = await apiGetHistory(page, "history-order.md");
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[0].message).toBe("Latest upload");
    expect(new Date(history[0].date).getTime()).toBeGreaterThanOrEqual(
      new Date(history[1].date).getTime(),
    );
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) diff request is reported as unsupported", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

    await createMarkdownFile(page, "history-diff.md");
    await appendToCurrentEditor(page, "\none\n");
    await saveCurrentFile(page);
    await syncAll(page);

    await page.waitForTimeout(20);
    await appendToCurrentEditor(page, "\ntwo\n");
    await saveCurrentFile(page);
    await syncAll(page);

    const history = await apiGetHistory(page, "history-diff.md");
    expect(history.length).toBeGreaterThanOrEqual(2);

    await expect(
      apiGetDiff(page, history[1].hash, history[0].hash, "history-diff.md"),
    ).rejects.toThrow("Diff is not supported for S3 history");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});
