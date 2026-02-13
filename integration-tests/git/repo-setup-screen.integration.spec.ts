import {
  DEFAULT_BRANCH,
  DEFAULT_PAT,
  DEFAULT_REMOTE_URL,
  apiCreateProfile,
  apiGetActiveProfileId,
  apiGetFullConfig,
  apiGetProfiles,
  apiSetActiveProfile,
  apiUpdateRepoSettings,
  cleanupUserDataDir,
  closeAppIfOpen,
  connectGitRepo,
  createIsolatedUserDataDir,
  expectConnectScreen,
  expectTreeToContainPath,
  getRepoInfo,
  getRepoStatus,
  launchIntegrationApp,
} from "../helpers/gitIntegration";
import { expect, test } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";
import * as path from "path";

const fillAndSubmitConnectForm = async (
  page: any,
  {
    remoteUrl = DEFAULT_REMOTE_URL,
    branch = DEFAULT_BRANCH,
    pat = DEFAULT_PAT,
  }: { remoteUrl?: string; branch?: string; pat?: string } = {},
) => {
  await page.getByRole("button", { name: "Connect to Repository" }).click();
  await page.getByLabel("Remote URL").fill(remoteUrl);
  await page.getByLabel("Branch").fill(branch);
  await page.getByLabel("Personal Access Token").fill(pat);
  await page.getByRole("button", { name: "Connect" }).click();
};

test("(git) connect to git repo (happy path)", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectGitRepo(page);

    const repoInfo = await getRepoInfo(page);
    expect(repoInfo.provider).toBe("git");
    expect(
      path.resolve(repoInfo.localPath).startsWith(path.resolve(userDataDir)),
    ).toBe(true);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) connect using non-default branch", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectGitRepo(page, { branch: "develop" });
    const status = await getRepoStatus(page);
    expect(status.branch).toBe("develop");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) connect dialog validates required git fields", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await page.getByRole("button", { name: "Connect to Repository" }).click();
    await page.getByRole("button", { name: "Connect" }).click();

    await expect(page.getByText("Please fill in all Git fields")).toBeVisible();
    await expect(page.getByLabel("Remote URL")).toBeVisible();
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) canceling setup dialog keeps app on welcome screen", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await page.getByRole("button", { name: "Connect to Repository" }).click();
    await expect(page.getByLabel("Remote URL")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByLabel("Remote URL")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Connect to Repository" }),
    ).toBeVisible();
    await expect(
      page.getByTestId("status-bar-commit-push-action"),
    ).toHaveCount(0);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) invalid URL connect shows error and stays on setup", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await fillAndSubmitConnectForm(page, {
      remoteUrl: "https://github.com/mock/invalid-url.git",
    });

    await expect(page.getByText("Invalid repository URL")).toBeVisible();
    await expectConnectScreen(page);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) active profile id persists across restart", async ({
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

    const firstRepoInfo = await getRepoInfo(firstPage);
    const profile = await apiCreateProfile(firstPage, "Profile Switch B", {
      provider: "git",
      remoteUrl: "https://github.com/mock/profile-switch-b.git",
      branch: "main",
      pat: "token-switch-b",
      authMethod: "pat",
    });
    await apiSetActiveProfile(firstPage, profile.id);

    await closeAppIfOpen(firstApp);
    firstApp = null;

    const secondLaunch = await launchIntegrationApp(userDataDir);
    secondApp = secondLaunch.app;
    const secondPage = secondLaunch.page;

    await expect(
      secondPage.getByTestId("status-bar-commit-push-action"),
    ).toBeVisible();
    await expect(
      secondPage.getByRole("button", { name: "Connect to Repository" }),
    ).toHaveCount(0);

    const activeProfileId = await apiGetActiveProfileId(secondPage);
    expect(activeProfileId).toBe(profile.id);

    const secondRepoInfo = await getRepoInfo(secondPage);
    expect(secondRepoInfo.localPath).not.toBe(firstRepoInfo.localPath);
  } finally {
    await closeAppIfOpen(firstApp);
    await closeAppIfOpen(secondApp);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) invalid active profile id still allows workspace to load", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let firstApp: ElectronApplication | null = null;
  let secondApp: ElectronApplication | null = null;
  try {
    const firstLaunch = await launchIntegrationApp(userDataDir);
    firstApp = firstLaunch.app;
    await connectGitRepo(firstLaunch.page);
    await apiSetActiveProfile(firstLaunch.page, "profile-missing-integration");

    await closeAppIfOpen(firstApp);
    firstApp = null;

    const secondLaunch = await launchIntegrationApp(userDataDir);
    secondApp = secondLaunch.app;
    const secondPage = secondLaunch.page;

    await expect(
      secondPage.getByTestId("status-bar-commit-push-action"),
    ).toBeVisible();
    await expect(
      secondPage.getByRole("button", { name: "Connect to Repository" }),
    ).toHaveCount(0);

    const repoInfo = await getRepoInfo(secondPage);
    expect(repoInfo.provider).toBe("git");
  } finally {
    await closeAppIfOpen(firstApp);
    await closeAppIfOpen(secondApp);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) auth failure on clone shows error and keeps setup open", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir, {
      env: { NOTEGIT_MOCK_GIT_FAIL_CLONE_AUTH: "1" },
    });
    app = launched.app;
    const page = launched.page;

    await fillAndSubmitConnectForm(page);

    await expect(page.getByText("Authentication failed")).toBeVisible();
    await expectConnectScreen(page);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) empty remote branch bootstrap succeeds", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectGitRepo(page, {
      remoteUrl: "https://github.com/mock/empty-remote.git",
    });

    await expectTreeToContainPath(page, "README.md");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) re-open app with existing repo skips setup", async ({
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

    const secondLaunch = await launchIntegrationApp(userDataDir);
    secondApp = secondLaunch.app;

    await expect(
      secondLaunch.page.getByRole("button", { name: "Connect to Repository" }),
    ).toHaveCount(0);
    await expect(
      secondLaunch.page.getByTestId("status-bar-commit-push-action"),
    ).toBeVisible();
  } finally {
    await closeAppIfOpen(firstApp);
    await closeAppIfOpen(secondApp);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) provider lock rejects switching from git to local", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    const result = await apiUpdateRepoSettings(page, {
      provider: "local",
      localPath: "local-test-repo",
    });

    expect(result.ok).toBe(false);
    expect(result.error?.message || "").toContain(
      "Repository provider cannot be changed",
    );
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) create profile and activate it", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    const profile = await apiCreateProfile(page, "Git Profile B", {
      provider: "git",
      remoteUrl: "https://github.com/mock/profile-b.git",
      branch: "main",
      pat: "token-b",
      authMethod: "pat",
    });

    await apiSetActiveProfile(page, profile.id);

    const fullConfig = await apiGetFullConfig(page);
    expect(fullConfig.activeProfileId).toBe(profile.id);

    const profiles = await apiGetProfiles(page);
    const matched = profiles.find((item: any) => item.id === profile.id);
    expect(Boolean(matched)).toBe(true);

    const repoInfo = await getRepoInfo(page);
    expect(repoInfo.provider).toBe("git");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});
