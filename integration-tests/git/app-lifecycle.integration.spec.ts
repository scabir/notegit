import {
  apiCreateProfile,
  apiGetActiveProfileId,
  apiSetActiveProfile,
  appendToCurrentEditor,
  cleanupUserDataDir,
  closeAppIfOpen,
  commitAndPushAll,
  connectGitRepo,
  createIsolatedUserDataDir,
  createMarkdownFile,
  flattenTreePaths,
  getRepoInfo,
  getTreeFileLocator,
  launchIntegrationApp,
  listTree,
  saveCurrentFile,
} from "../helpers/gitIntegration";
import { expect, test } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

test("restart app and recover git workspace", async ({
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

test("parallel app instances stay isolated by userData path", async ({
  request: _request,
}) => {
  const userDataDirA = await fs.mkdtemp(
    path.join(os.tmpdir(), `notegit-isolation-a-${Date.now()}-`),
  );
  const userDataDirB = await fs.mkdtemp(
    path.join(os.tmpdir(), `notegit-isolation-b-${Date.now()}-`),
  );

  let appA: ElectronApplication | null = null;
  let appB: ElectronApplication | null = null;

  try {
    const launchA = await launchIntegrationApp(userDataDirA);
    appA = launchA.app;
    const pageA = launchA.page;
    await connectGitRepo(pageA, {
      remoteUrl: "https://github.com/mock/isolation-a.git",
    });
    await createMarkdownFile(pageA, "only-a.md");

    const launchB = await launchIntegrationApp(userDataDirB);
    appB = launchB.app;
    const pageB = launchB.page;
    await connectGitRepo(pageB, {
      remoteUrl: "https://github.com/mock/isolation-b.git",
    });
    await createMarkdownFile(pageB, "only-b.md");

    const repoInfoA = await getRepoInfo(pageA);
    const repoInfoB = await getRepoInfo(pageB);
    expect(
      path.resolve(repoInfoA.localPath).startsWith(path.resolve(userDataDirA)),
    ).toBe(true);
    expect(
      path.resolve(repoInfoB.localPath).startsWith(path.resolve(userDataDirB)),
    ).toBe(true);

    const pathsA = flattenTreePaths(await listTree(pageA));
    const pathsB = flattenTreePaths(await listTree(pageB));
    expect(pathsA).toContain("only-a.md");
    expect(pathsA).not.toContain("only-b.md");
    expect(pathsB).toContain("only-b.md");
    expect(pathsB).not.toContain("only-a.md");
  } finally {
    await closeAppIfOpen(appA);
    await closeAppIfOpen(appB);
    await cleanupUserDataDir(userDataDirA);
    await cleanupUserDataDir(userDataDirB);
  }
});

test("restart preserves uncommitted changes and git status", async ({
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

    await createMarkdownFile(firstPage, "restart-dirty.md");
    await appendToCurrentEditor(firstPage, "\nrestart dirty content\n");
    await saveCurrentFile(firstPage);

    await closeAppIfOpen(firstApp);
    firstApp = null;

    const secondLaunch = await launchIntegrationApp(userDataDir);
    secondApp = secondLaunch.app;
    const secondPage = secondLaunch.page;

    await expect(getTreeFileLocator(secondPage, "restart-dirty.md")).toBeVisible();
    const reopenedTree = flattenTreePaths(await listTree(secondPage));
    expect(reopenedTree).toContain("restart-dirty.md");

    const status = await secondPage.evaluate(async () => {
      const response = await window.notegitApi.repo.getStatus();
      if (!response.ok || !response.data) {
        throw new Error(response.error?.message || "Failed to read repo status");
      }
      return response.data;
    });
    expect(status.hasUncommitted).toBe(true);
  } finally {
    await closeAppIfOpen(firstApp);
    await closeAppIfOpen(secondApp);
    await cleanupUserDataDir(userDataDir);
  }
});

test("restart loads repository for active profile", async ({
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
    const initialRepoInfo = await getRepoInfo(firstPage);
    await createMarkdownFile(firstPage, "default-profile-only.md");

    const newProfile = await apiCreateProfile(firstPage, "Lifecycle Profile B", {
      provider: "git",
      remoteUrl: "https://github.com/mock/lifecycle-profile-b.git",
      branch: "main",
      pat: "token-lifecycle-b",
      authMethod: "pat",
    });
    await apiSetActiveProfile(firstPage, newProfile.id);

    await closeAppIfOpen(firstApp);
    firstApp = null;

    const secondLaunch = await launchIntegrationApp(userDataDir);
    secondApp = secondLaunch.app;
    const secondPage = secondLaunch.page;

    await expect(
      secondPage.getByTestId("status-bar-commit-push-action"),
    ).toBeVisible();
    await expect(secondPage.getByText("default-profile-only.md")).toHaveCount(0);

    const activeProfileId = await apiGetActiveProfileId(secondPage);
    expect(activeProfileId).toBe(newProfile.id);
    const restartedRepoInfo = await getRepoInfo(secondPage);
    expect(restartedRepoInfo.localPath).not.toBe(initialRepoInfo.localPath);
  } finally {
    await closeAppIfOpen(firstApp);
    await closeAppIfOpen(secondApp);
    await cleanupUserDataDir(userDataDir);
  }
});
