import { test, expect } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";
import {
  appendToCurrentEditor,
  cleanupUserDataDir,
  closeAppIfOpen,
  connectGitRepo,
  createIsolatedUserDataDir,
  createMarkdownFile,
  getRepoStatus,
  launchIntegrationApp,
  saveCurrentFile,
} from "../helpers/gitIntegration";

test("3) save existing file without commit shows local changes", async ({
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
