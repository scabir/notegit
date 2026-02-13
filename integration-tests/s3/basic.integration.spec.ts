import {
  apiReadFile,
  cleanupUserDataDir,
  closeAppIfOpen,
  connectS3Repo,
  createIsolatedUserDataDir,
  createMarkdownFile,
  getRepoStatus,
  launchIntegrationApp,
  saveCurrentFile,
} from "../helpers/gitIntegration";
import { expect, test } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";

test("connect to s3 repo and sync one file (mock)", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir, {
      env: { NOTEGIT_INTEGRATION_S3_MOCK: "1" },
    });
    app = launched.app;
    const page = launched.page;

    await connectS3Repo(page);

    await createMarkdownFile(page, "s3-basic.md");
    await page.locator(".cm-content").first().click();
    await page.keyboard.type("\nS3 integration content\n");
    await saveCurrentFile(page);

    const statusAfterSave = await getRepoStatus(page);
    expect(statusAfterSave.provider).toBe("s3");

    await page.getByTestId("status-bar-commit-push-action").click();
    await expect(page.getByTestId("status-bar-save-status-saved")).toBeVisible();

    await expect
      .poll(async () => {
        const status = await getRepoStatus(page);
        return status.hasUncommitted || status.pendingPushCount > 0;
      })
      .toBe(false);

    const content = await apiReadFile(page, "s3-basic.md");
    expect(content).toContain("S3 integration content");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});
