import {
  apiCreateFile,
  apiCreateProfile,
  apiGetActiveProfileId,
  apiSetActiveProfile,
  appendToCurrentEditor,
  cleanupUserDataDir,
  closeAppIfOpen,
  connectS3Repo,
  createIsolatedUserDataDir,
  createMarkdownFile,
  flattenTreePaths,
  getRepoInfo,
  getRepoStatus,
  getTreeFileLocator,
  launchS3IntegrationApp,
  listTree,
  saveCurrentFile,
  syncAll,
} from "../helpers/gitIntegration";
import { expect, test } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

test("(S3) restart app and recover s3 workspace", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let firstApp: ElectronApplication | null = null;
  let secondApp: ElectronApplication | null = null;

  try {
    const firstLaunch = await launchS3IntegrationApp(userDataDir);
    firstApp = firstLaunch.app;
    const firstPage = firstLaunch.page;

    await connectS3Repo(firstPage);
    await createMarkdownFile(firstPage, "restart-recovery.md");
    await appendToCurrentEditor(firstPage, "\nPersisted across restart\n");
    await saveCurrentFile(firstPage);
    await syncAll(firstPage);

    await closeAppIfOpen(firstApp);
    firstApp = null;

    const secondLaunch = await launchS3IntegrationApp(userDataDir);
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
    expect(repoInfo.provider).toBe("s3");
    expect(
      path.resolve(repoInfo.localPath).startsWith(path.resolve(userDataDir)),
    ).toBe(true);
  } finally {
    await closeAppIfOpen(firstApp);
    await closeAppIfOpen(secondApp);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) parallel app instances stay isolated by userData path", async ({
  request: _request,
}) => {
  const userDataDirA = await fs.mkdtemp(
    path.join(os.tmpdir(), `notegit-s3-isolation-a-${Date.now()}-`),
  );
  const userDataDirB = await fs.mkdtemp(
    path.join(os.tmpdir(), `notegit-s3-isolation-b-${Date.now()}-`),
  );

  let appA: ElectronApplication | null = null;
  let appB: ElectronApplication | null = null;

  try {
    const launchA = await launchS3IntegrationApp(userDataDirA);
    appA = launchA.app;
    const pageA = launchA.page;
    await connectS3Repo(pageA, { bucket: "s3-isolation-a" });
    await createMarkdownFile(pageA, "only-a.md");

    const launchB = await launchS3IntegrationApp(userDataDirB);
    appB = launchB.app;
    const pageB = launchB.page;
    await connectS3Repo(pageB, { bucket: "s3-isolation-b" });
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

test("(S3) restart preserves unsynced local changes", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let firstApp: ElectronApplication | null = null;
  let secondApp: ElectronApplication | null = null;
  try {
    const firstLaunch = await launchS3IntegrationApp(userDataDir);
    firstApp = firstLaunch.app;
    const firstPage = firstLaunch.page;
    await connectS3Repo(firstPage);

    await apiCreateFile(firstPage, "", "restart-dirty.md");

    await closeAppIfOpen(firstApp);
    firstApp = null;

    const secondLaunch = await launchS3IntegrationApp(userDataDir);
    secondApp = secondLaunch.app;
    const secondPage = secondLaunch.page;

    await expect(
      getTreeFileLocator(secondPage, "restart-dirty.md"),
    ).toBeVisible();
    const reopenedTree = flattenTreePaths(await listTree(secondPage));
    expect(reopenedTree).toContain("restart-dirty.md");

    const status = await getRepoStatus(secondPage);
    expect(status.provider).toBe("s3");
    expect(status.hasUncommitted).toBe(true);
  } finally {
    await closeAppIfOpen(firstApp);
    await closeAppIfOpen(secondApp);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) restart loads repository for active s3 profile", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let firstApp: ElectronApplication | null = null;
  let secondApp: ElectronApplication | null = null;
  try {
    const firstLaunch = await launchS3IntegrationApp(userDataDir);
    firstApp = firstLaunch.app;
    const firstPage = firstLaunch.page;
    await connectS3Repo(firstPage, { bucket: "lifecycle-default" });
    const initialRepoInfo = await getRepoInfo(firstPage);
    await createMarkdownFile(firstPage, "default-profile-only.md");

    const newProfile = await apiCreateProfile(
      firstPage,
      "Lifecycle S3 Profile B",
      {
        provider: "s3",
        bucket: "lifecycle-profile-b",
        region: "us-east-1",
        prefix: "workspace-b",
        accessKeyId: "token-lifecycle-b",
        secretAccessKey: "secret-lifecycle-b",
        sessionToken: "",
      },
    );
    await apiSetActiveProfile(firstPage, newProfile.id);

    await closeAppIfOpen(firstApp);
    firstApp = null;

    const secondLaunch = await launchS3IntegrationApp(userDataDir);
    secondApp = secondLaunch.app;
    const secondPage = secondLaunch.page;

    await expect(
      secondPage.getByTestId("status-bar-commit-push-action"),
    ).toBeVisible();
    await expect(secondPage.getByText("default-profile-only.md")).toHaveCount(
      0,
    );

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

test("(S3) same bucket with different prefixes remain isolated", async ({
  request: _request,
}) => {
  const userDataDirA = await fs.mkdtemp(
    path.join(os.tmpdir(), `notegit-s3-prefix-a-${Date.now()}-`),
  );
  const userDataDirB = await fs.mkdtemp(
    path.join(os.tmpdir(), `notegit-s3-prefix-b-${Date.now()}-`),
  );

  let appA: ElectronApplication | null = null;
  let appB: ElectronApplication | null = null;

  try {
    const launchA = await launchS3IntegrationApp(userDataDirA);
    appA = launchA.app;
    const pageA = launchA.page;
    await connectS3Repo(pageA, {
      bucket: "shared-bucket",
      prefix: "team-a",
    });
    await apiCreateFile(pageA, "", "team-a.md");
    await syncAll(pageA);

    const launchB = await launchS3IntegrationApp(userDataDirB);
    appB = launchB.app;
    const pageB = launchB.page;
    await connectS3Repo(pageB, {
      bucket: "shared-bucket",
      prefix: "team-b",
    });
    await apiCreateFile(pageB, "", "team-b.md");
    await syncAll(pageB);

    const pathsA = flattenTreePaths(await listTree(pageA));
    const pathsB = flattenTreePaths(await listTree(pageB));
    expect(pathsA).toContain("team-a.md");
    expect(pathsA).not.toContain("team-b.md");
    expect(pathsB).toContain("team-b.md");
    expect(pathsB).not.toContain("team-a.md");

    const statusA = await getRepoStatus(pageA);
    const statusB = await getRepoStatus(pageB);
    expect(statusA.branch).toContain("team-a");
    expect(statusB.branch).toContain("team-b");
  } finally {
    await closeAppIfOpen(appA);
    await closeAppIfOpen(appB);
    await cleanupUserDataDir(userDataDirA);
    await cleanupUserDataDir(userDataDirB);
  }
});
