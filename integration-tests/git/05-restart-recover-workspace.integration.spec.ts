import { test, expect } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";
import * as path from "path";
import {
  appendToCurrentEditor,
  cleanupUserDataDir,
  closeAppIfOpen,
  commitAndPushAll,
  connectGitRepo,
  createIsolatedUserDataDir,
  createMarkdownFile,
  getRepoInfo,
  getTreeFileLocator,
  launchIntegrationApp,
  saveCurrentFile,
} from "../helpers/gitIntegration";

test("5) restart app and recover git workspace", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let firstApp: ElectronApplication | null = null;
  let secondApp: ElectronApplication | null = null;

  try {
    const firstLaunch = await launchIntegrationApp(userDataDir);
    firstApp = firstLaunch.app;
    const firstPage = firstLaunch.page;

    await connectGitRepo(firstPage);
    await createMarkdownFile(firstPage, "restart-recovery.md");
    await appendToCurrentEditor(firstPage, "\nPersisted across restart\n");
    await saveCurrentFile(firstPage);
    await commitAndPushAll(firstPage);

    await closeAppIfOpen(firstApp);
    firstApp = null;

    const secondLaunch = await launchIntegrationApp(userDataDir);
    secondApp = secondLaunch.app;
    const secondPage = secondLaunch.page;

    await expect(
      secondPage.getByRole("button", { name: "Connect to Repository" }),
    ).toHaveCount(0);
    await expect(
      secondPage.getByTestId("status-bar-commit-push-action"),
    ).toBeVisible();
    await expect(
      getTreeFileLocator(secondPage, "restart-recovery.md"),
    ).toBeVisible();

    const repoInfo = await getRepoInfo(secondPage);
    expect(repoInfo.provider).toBe("git");
    expect(
      path.resolve(repoInfo.localPath).startsWith(path.resolve(userDataDir)),
    ).toBe(true);
  } finally {
    await closeAppIfOpen(firstApp);
    await closeAppIfOpen(secondApp);
    await cleanupUserDataDir(userDataDir);
  }
});
