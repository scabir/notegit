import { expect, _electron as electron } from "@playwright/test";
import type { ElectronApplication, Page, TestInfo } from "@playwright/test";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

export const DEFAULT_BRANCH = "main";
export const DEFAULT_REMOTE_URL =
  "https://github.com/mock/notegit-integration.git";
export const DEFAULT_PAT = "integration-token";

export type RepoStatus = {
  provider: string;
  branch: string;
  ahead: number;
  behind: number;
  hasUncommitted: boolean;
  pendingPushCount: number;
  needsPull: boolean;
};

export type RepoInfo = {
  provider: string;
  localPath: string;
};

export type LaunchResult = {
  app: ElectronApplication;
  page: Page;
};

const getModKey = () => (process.platform === "darwin" ? "Meta" : "Control");

export const createIsolatedUserDataDir = async (
  testInfo: TestInfo,
): Promise<string> =>
  await fs.mkdtemp(
    path.join(
      os.tmpdir(),
      `notegit-integration-${testInfo.parallelIndex}-${Date.now()}-`,
    ),
  );

export const cleanupUserDataDir = async (
  userDataDir: string,
): Promise<void> => {
  await fs.rm(userDataDir, { recursive: true, force: true });
};

export const launchIntegrationApp = async (
  userDataDir: string,
): Promise<LaunchResult> => {
  const launchEnv: Record<string, string> = {
    ...(process.env as Record<string, string>),
    NODE_ENV: "test",
    NOTEGIT_INTEGRATION_TEST: "1",
    NOTEGIT_INTEGRATION_GIT_MOCK: "1",
    NOTEGIT_INTEGRATION_USER_DATA_DIR: userDataDir,
  };
  delete launchEnv.ELECTRON_RUN_AS_NODE;

  const app = await electron.launch({
    args: ["."],
    env: launchEnv,
  });

  const page = await app.firstWindow();
  await page.waitForLoadState("domcontentloaded");
  return { app, page };
};

export const closeAppIfOpen = async (
  app: ElectronApplication | null,
): Promise<void> => {
  if (!app) {
    return;
  }
  await app.close();
};

export const connectGitRepo = async (
  page: Page,
  {
    remoteUrl = DEFAULT_REMOTE_URL,
    branch = DEFAULT_BRANCH,
    pat = DEFAULT_PAT,
  }: {
    remoteUrl?: string;
    branch?: string;
    pat?: string;
  } = {},
): Promise<void> => {
  await page.getByRole("button", { name: "Connect to Repository" }).click();
  await page.getByLabel("Remote URL").fill(remoteUrl);
  await page.getByLabel("Branch").fill(branch);
  await page.getByLabel("Personal Access Token").fill(pat);
  await page.getByRole("button", { name: "Connect" }).click();

  await expect(page.getByTestId("status-bar-commit-push-action")).toBeVisible();
  await expect(page.getByTestId("status-bar-branch-label")).toContainText(
    `Branch: ${branch}`,
  );
  await expect(page.locator(".tree-container")).toBeVisible();
};

export const getTreeFileLocator = (page: Page, fileName: string) =>
  page.locator(".tree-container").getByText(fileName, { exact: true }).first();

export const selectFileFromTree = async (
  page: Page,
  fileName: string,
): Promise<void> => {
  const fileNode = getTreeFileLocator(page, fileName);
  await expect(fileNode).toBeVisible();
  await fileNode.click();
};

export const createMarkdownFile = async (
  page: Page,
  fileName: string,
): Promise<void> => {
  const treeContainer = page.locator(".tree-container");
  await expect(treeContainer).toBeVisible();
  await treeContainer.click({ button: "right" });
  await page.getByRole("menuitem", { name: "New File" }).click();

  const createDialog = page.getByTestId("create-file-dialog");
  await expect(createDialog).toBeVisible();
  await createDialog.getByLabel("File Name").fill(fileName);
  await createDialog.getByRole("button", { name: "Create" }).click();

  await expect(createDialog).toHaveCount(0);
  await expect(getTreeFileLocator(page, fileName)).toBeVisible();
};

export const appendToCurrentEditor = async (
  page: Page,
  content: string,
): Promise<void> => {
  const editor = page.locator(".cm-content").first();
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.type(content);
};

export const saveCurrentFile = async (page: Page): Promise<void> => {
  await page.keyboard.press(`${getModKey()}+S`);
  await expect(page.getByTestId("status-bar-save-status")).toBeVisible();
  await expect(page.getByTestId("status-bar-save-status-saved")).toBeVisible();
};

export const commitAndPushAll = async (page: Page): Promise<void> => {
  await page.getByTestId("status-bar-commit-push-action").click();
  const saveStatus = page.getByTestId("status-bar-save-status");
  await expect(saveStatus).toBeVisible();
  await expect(page.getByTestId("status-bar-save-status-saved")).toBeVisible();
  await expect(
    saveStatus.getByText("Committed and pushed successfully", {
      exact: true,
    }),
  ).toBeVisible();
};

export const getRepoStatus = async (page: Page): Promise<RepoStatus> => {
  return await page.evaluate(async () => {
    const response = await window.notegitApi.repo.getStatus();
    if (!response.ok || !response.data) {
      throw new Error(response.error?.message || "Failed to load repo status");
    }
    return response.data;
  });
};

export const getRepoInfo = async (page: Page): Promise<RepoInfo> => {
  return await page.evaluate(async () => {
    const response = await window.notegitApi.config.getFull();
    if (!response.ok || !response.data?.repoSettings) {
      throw new Error(
        response.error?.message || "Failed to load repository settings",
      );
    }

    return {
      provider: response.data.repoSettings.provider,
      localPath: response.data.repoSettings.localPath || "",
    };
  });
};

export const getLatestCommitMessageForFile = async (
  page: Page,
  filePath: string,
): Promise<string> => {
  return await page.evaluate(async (targetPath) => {
    const response = await window.notegitApi.history.getForFile(targetPath);
    if (!response.ok || !response.data || response.data.length === 0) {
      throw new Error(
        response.error?.message || "Failed to load commit history for file",
      );
    }
    return response.data[0].message;
  }, filePath);
};
