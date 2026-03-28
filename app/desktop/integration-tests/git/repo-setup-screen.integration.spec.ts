import {
  DEFAULT_BRANCH,
  DEFAULT_PAT,
  DEFAULT_REMOTE_URL,
  apiCreateProfile,
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
import * as fs from "fs/promises";
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

const getProfilesPath = (userDataDir: string): string =>
  path.join(userDataDir, "config", "profiles.json");

const readProfilesFromDisk = async (userDataDir: string): Promise<any[]> => {
  const profilesPath = getProfilesPath(userDataDir);
  const content = await fs.readFile(profilesPath, "utf8");
  return JSON.parse(content);
};

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
    await expect(page.getByTestId("status-bar-commit-push-action")).toHaveCount(
      0,
    );
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
      env: { NOTEBRANCH_MOCK_GIT_FAIL_CLONE_AUTH: "1" },
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

test("(git) fresh PAT persists encrypted as v2.0", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  const freshPat = "fresh-integration-pat-token";

  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectGitRepo(page, { pat: freshPat });

    const rawProfilesContent = await fs.readFile(getProfilesPath(userDataDir), {
      encoding: "utf8",
    });
    const profiles = JSON.parse(rawProfilesContent) as any[];
    const gitProfile = profiles.find(
      (profile) => profile?.repoSettings?.provider === "git",
    );

    expect(gitProfile).toBeDefined();
    expect(gitProfile.repoSettings.version).toBe("2.0");
    expect(gitProfile.repoSettings.authMethod).toBe("pat");
    expect(gitProfile.repoSettings.pat).not.toBe(freshPat);
    expect(rawProfilesContent.includes(freshPat)).toBe(false);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) non-2.0 plaintext PAT profile migrates to encrypted v2.0", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let firstApp: ElectronApplication | null = null;
  let secondApp: ElectronApplication | null = null;
  const legacyPat = "legacy-plaintext-pat";

  try {
    const firstLaunch = await launchIntegrationApp(userDataDir);
    firstApp = firstLaunch.app;
    const firstPage = firstLaunch.page;

    await connectGitRepo(firstPage, { pat: "initial-token" });

    await closeAppIfOpen(firstApp);
    firstApp = null;

    const seededProfiles = await readProfilesFromDisk(userDataDir);
    const gitProfile = seededProfiles.find(
      (profile) => profile?.repoSettings?.provider === "git",
    );
    expect(gitProfile).toBeDefined();

    gitProfile.repoSettings.version = "1.0";
    gitProfile.repoSettings.pat = legacyPat;
    await fs.writeFile(
      getProfilesPath(userDataDir),
      JSON.stringify(seededProfiles, null, 2),
      "utf8",
    );

    const secondLaunch = await launchIntegrationApp(userDataDir);
    secondApp = secondLaunch.app;
    const secondPage = secondLaunch.page;

    await apiGetProfiles(secondPage);

    const migratedRawProfilesContent = await fs.readFile(
      getProfilesPath(userDataDir),
      {
        encoding: "utf8",
      },
    );
    const migratedProfiles = JSON.parse(migratedRawProfilesContent) as any[];
    const migratedGitProfile = migratedProfiles.find(
      (profile) => profile?.repoSettings?.provider === "git",
    );

    expect(migratedGitProfile).toBeDefined();
    expect(migratedGitProfile.repoSettings.version).toBe("2.0");
    expect(migratedGitProfile.repoSettings.pat).not.toBe(legacyPat);
    expect(migratedRawProfilesContent.includes(legacyPat)).toBe(false);
  } finally {
    await closeAppIfOpen(firstApp);
    await closeAppIfOpen(secondApp);
    await cleanupUserDataDir(userDataDir);
  }
});
