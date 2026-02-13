import {
  DEFAULT_S3_ACCESS_KEY_ID,
  DEFAULT_S3_BUCKET,
  DEFAULT_S3_REGION,
  DEFAULT_S3_SECRET_ACCESS_KEY,
  apiCreateProfile,
  apiGetActiveProfileId,
  apiGetFullConfig,
  apiGetProfiles,
  apiSetActiveProfile,
  apiUpdateRepoSettings,
  cleanupUserDataDir,
  closeAppIfOpen,
  connectS3Repo,
  createIsolatedUserDataDir,
  expectConnectScreen,
  getRepoInfo,
  getRepoStatus,
  launchS3IntegrationApp,
} from "../helpers/gitIntegration";
import { expect, test } from "@playwright/test";
import type { ElectronApplication, Page } from "@playwright/test";
import * as path from "path";

const fillAndSubmitS3ConnectForm = async (
  page: Page,
  {
    bucket = DEFAULT_S3_BUCKET,
    region = DEFAULT_S3_REGION,
    accessKeyId = DEFAULT_S3_ACCESS_KEY_ID,
    secretAccessKey = DEFAULT_S3_SECRET_ACCESS_KEY,
    prefix = "",
  }: {
    bucket?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    prefix?: string;
  } = {},
) => {
  await page.getByRole("button", { name: "Connect to Repository" }).click();
  await page.getByRole("button", { name: "S3" }).click();
  await page.getByLabel("Bucket").fill(bucket);
  await page.getByLabel("Region").fill(region);
  await page.getByLabel("Access Key ID").fill(accessKeyId);
  await page.getByLabel("Secret Access Key").fill(secretAccessKey);
  if (prefix) {
    await page.getByLabel("Prefix (optional)").fill(prefix);
  }
  await page.getByRole("button", { name: "Connect" }).click();
};

test("(S3) connect to s3 repo (happy path)", async ({ request: _request }, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectS3Repo(page);

    const repoInfo = await getRepoInfo(page);
    expect(repoInfo.provider).toBe("s3");
    expect(
      path.resolve(repoInfo.localPath).startsWith(path.resolve(userDataDir)),
    ).toBe(true);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) connect dialog validates required s3 fields", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await page.getByRole("button", { name: "Connect to Repository" }).click();
    await page.getByRole("button", { name: "S3" }).click();
    await page.getByRole("button", { name: "Connect" }).click();

    await expect(page.getByText("Please fill in all required S3 fields")).toBeVisible();
    await expect(page.getByLabel("Bucket")).toBeVisible();
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) canceling setup dialog keeps app on welcome screen", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await page.getByRole("button", { name: "Connect to Repository" }).click();
    await page.getByRole("button", { name: "S3" }).click();
    await expect(page.getByLabel("Bucket")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByLabel("Bucket")).toHaveCount(0);
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

test("(S3) bucket versioning disabled blocks setup and stays on setup", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir, {
      env: { NOTEGIT_MOCK_S3_VERSIONING_STATUS: "Suspended" },
    });
    app = launched.app;
    const page = launched.page;

    await fillAndSubmitS3ConnectForm(page);

    await expect(
      page.getByText("S3 bucket versioning must be enabled to use history"),
    ).toBeVisible();
    await expectConnectScreen(page);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) connect with prefix succeeds and reflects prefixed bucket label", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectS3Repo(page, { prefix: "team/notes" });

    const status = await getRepoStatus(page);
    expect(status.provider).toBe("s3");
    expect(status.branch).toContain("team/notes");
    await expect(page.getByTestId("status-bar-branch-label")).toContainText(
      "Bucket:",
    );
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) re-open app with existing s3 repo skips setup", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let firstApp: ElectronApplication | null = null;
  let secondApp: ElectronApplication | null = null;
  try {
    const firstLaunch = await launchS3IntegrationApp(userDataDir);
    firstApp = firstLaunch.app;
    await connectS3Repo(firstLaunch.page);
    await closeAppIfOpen(firstApp);
    firstApp = null;

    const secondLaunch = await launchS3IntegrationApp(userDataDir);
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

test("(S3) provider lock rejects switching from s3 to git", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

    const result = await apiUpdateRepoSettings(page, {
      provider: "git",
      remoteUrl: "https://github.com/mock/should-fail.git",
      branch: "main",
      pat: "token",
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

test("(S3) provider lock rejects switching from s3 to local", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

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

test("(S3) create s3 profile and activate it", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

    const profile = await apiCreateProfile(page, "S3 Profile B", {
      provider: "s3",
      bucket: "s3-profile-b-bucket",
      region: "us-east-1",
      prefix: "archive",
      accessKeyId: "profile-b-key",
      secretAccessKey: "profile-b-secret",
      sessionToken: "",
    });

    await apiSetActiveProfile(page, profile.id);

    const fullConfig = await apiGetFullConfig(page);
    expect(fullConfig.activeProfileId).toBe(profile.id);

    const profiles = await apiGetProfiles(page);
    const matched = profiles.find((item: any) => item.id === profile.id);
    expect(Boolean(matched)).toBe(true);

    const repoInfo = await getRepoInfo(page);
    expect(repoInfo.provider).toBe("s3");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) active profile id persists across restart", async ({
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

    const firstRepoInfo = await getRepoInfo(firstPage);
    const profile = await apiCreateProfile(firstPage, "S3 Profile Switch B", {
      provider: "s3",
      bucket: "s3-profile-switch-b",
      region: "us-east-1",
      prefix: "workspace-b",
      accessKeyId: "switch-b-key",
      secretAccessKey: "switch-b-secret",
      sessionToken: "",
    });
    await apiSetActiveProfile(firstPage, profile.id);

    await closeAppIfOpen(firstApp);
    firstApp = null;

    const secondLaunch = await launchS3IntegrationApp(userDataDir);
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

test("(S3) invalid active profile id still allows workspace to load", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let firstApp: ElectronApplication | null = null;
  let secondApp: ElectronApplication | null = null;
  try {
    const firstLaunch = await launchS3IntegrationApp(userDataDir);
    firstApp = firstLaunch.app;
    await connectS3Repo(firstLaunch.page);
    await apiSetActiveProfile(firstLaunch.page, "profile-missing-integration");

    await closeAppIfOpen(firstApp);
    firstApp = null;

    const secondLaunch = await launchS3IntegrationApp(userDataDir);
    secondApp = secondLaunch.app;
    const secondPage = secondLaunch.page;

    await expect(
      secondPage.getByTestId("status-bar-commit-push-action"),
    ).toBeVisible();
    await expect(
      secondPage.getByRole("button", { name: "Connect to Repository" }),
    ).toHaveCount(0);

    const repoInfo = await getRepoInfo(secondPage);
    expect(repoInfo.provider).toBe("s3");
  } finally {
    await closeAppIfOpen(firstApp);
    await closeAppIfOpen(secondApp);
    await cleanupUserDataDir(userDataDir);
  }
});
