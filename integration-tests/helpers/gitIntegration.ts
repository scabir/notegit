import { expect, _electron as electron } from "@playwright/test";
import type { ElectronApplication, Page, TestInfo } from "@playwright/test";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

export const DEFAULT_BRANCH = "main";
export const DEFAULT_REMOTE_URL =
  "https://github.com/mock/notegit-integration.git";
export const DEFAULT_PAT = "integration-token";
export const DEFAULT_S3_BUCKET = "notegit-integration-bucket";
export const DEFAULT_S3_REGION = "us-east-1";
export const DEFAULT_S3_ACCESS_KEY_ID = "mock-access-key";
export const DEFAULT_S3_SECRET_ACCESS_KEY = "mock-secret-key";

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

export type LaunchOptions = {
  env?: Record<string, string>;
};

type ApiErrorPayload = {
  message?: string;
};

type ApiResponsePayload<T> = {
  ok: boolean;
  data?: T;
  error?: ApiErrorPayload;
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
  options: LaunchOptions = {},
): Promise<LaunchResult> => {
  const launchEnv: Record<string, string> = {
    ...(process.env as Record<string, string>),
    NODE_ENV: "test",
    NOTEGIT_INTEGRATION_TEST: "1",
    NOTEGIT_INTEGRATION_GIT_MOCK: "1",
    NOTEGIT_INTEGRATION_USER_DATA_DIR: userDataDir,
    ...(options.env || {}),
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

export const connectS3Repo = async (
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
): Promise<void> => {
  await page.getByRole("button", { name: "Connect to Repository" }).click();
  await page.getByRole("button", { name: "S3" }).click();
  await page.getByLabel("Bucket").fill(bucket);
  await page.getByLabel("Region").fill(region);
  if (prefix) {
    await page.getByLabel("Prefix (optional)").fill(prefix);
  }
  await page.getByLabel("Access Key ID").fill(accessKeyId);
  await page.getByLabel("Secret Access Key").fill(secretAccessKey);
  await page.getByRole("button", { name: "Connect" }).click();

  await expect(page.getByTestId("status-bar-commit-push-action")).toBeVisible();
  await expect(page.getByTestId("status-bar-branch-label")).toContainText(
    `Bucket: ${bucket}`,
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

export const clickFetch = async (page: Page): Promise<void> => {
  await page.getByTestId("status-bar-fetch-action").click();
};

export const clickPull = async (page: Page): Promise<void> => {
  await page.getByTestId("status-bar-pull-action").click();
};

export const clickPush = async (page: Page): Promise<void> => {
  await page.getByTestId("status-bar-push-action").click();
};

export const expectSavedStatus = async (page: Page): Promise<void> => {
  await expect(page.getByTestId("status-bar-save-status-saved")).toBeVisible();
};

export const expectErrorStatus = async (
  page: Page,
  containsText?: string,
): Promise<void> => {
  const status = page.getByTestId("status-bar-save-status");
  await expect(status).toBeVisible();
  await expect(page.getByTestId("status-bar-save-status-error")).toBeVisible();
  if (containsText) {
    await expect(status).toContainText(containsText);
  }
};

export const expectSyncChipText = async (
  page: Page,
  containsText: string,
): Promise<void> => {
  await expect(page.getByTestId("status-bar-sync-chip")).toContainText(
    containsText,
  );
};

export const readEditorPathLabel = async (page: Page): Promise<string> => {
  return await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll("p, span, div"));
    const match = candidates.find((node) => {
      const text = node.textContent || "";
      return text.endsWith(".md") || text.endsWith(".txt");
    });
    return (match?.textContent || "").trim();
  });
};

export const listTree = async (page: Page): Promise<any[]> => {
  const response = await page.evaluate(async () => {
    const res = await window.notegitApi.files.listTree();
    return res;
  });
  if (!response.ok || !response.data) {
    throw new Error(response.error?.message || "Failed to list tree");
  }
  return response.data;
};

export const flattenTreePaths = (nodes: any[]): string[] => {
  const result: string[] = [];
  const walk = (entries: any[]) => {
    for (const entry of entries) {
      result.push(entry.path);
      if (Array.isArray(entry.children)) {
        walk(entry.children);
      }
    }
  };
  walk(nodes);
  return result;
};

export const expectTreeToContainPath = async (
  page: Page,
  expectedPath: string,
): Promise<void> => {
  const tree = await listTree(page);
  const paths = flattenTreePaths(tree);
  expect(paths).toContain(expectedPath);
};

export const expectTreeNotToContainPath = async (
  page: Page,
  expectedPath: string,
): Promise<void> => {
  const tree = await listTree(page);
  const paths = flattenTreePaths(tree);
  expect(paths).not.toContain(expectedPath);
};

export const apiCreateFile = async (
  page: Page,
  parentPath: string,
  name: string,
): Promise<void> => {
  const response = await page.evaluate(
    async ({ parentPath: p, name: n }) => {
      return await window.notegitApi.files.create(p, n);
    },
    { parentPath, name },
  );
  if (!response.ok) {
    throw new Error(response.error?.message || "Failed to create file");
  }
};

export const apiCreateFolder = async (
  page: Page,
  parentPath: string,
  name: string,
): Promise<void> => {
  const response = await page.evaluate(
    async ({ parentPath: p, name: n }) => {
      return await window.notegitApi.files.createFolder(p, n);
    },
    { parentPath, name },
  );
  if (!response.ok) {
    throw new Error(response.error?.message || "Failed to create folder");
  }
};

export const apiRenamePath = async (
  page: Page,
  oldPath: string,
  newPath: string,
): Promise<void> => {
  const response = await page.evaluate(
    async ({ oldPath: oldValue, newPath: newValue }) => {
      return await window.notegitApi.files.rename(oldValue, newValue);
    },
    { oldPath, newPath },
  );
  if (!response.ok) {
    throw new Error(response.error?.message || "Failed to rename path");
  }
};

export const apiDeletePath = async (
  page: Page,
  targetPath: string,
): Promise<void> => {
  const response = await page.evaluate(async (pathValue) => {
    return await window.notegitApi.files.delete(pathValue);
  }, targetPath);
  if (!response.ok) {
    throw new Error(response.error?.message || "Failed to delete path");
  }
};

export const apiDuplicateFile = async (
  page: Page,
  targetPath: string,
): Promise<string> => {
  const response = await page.evaluate(async (pathValue) => {
    return await window.notegitApi.files.duplicate(pathValue);
  }, targetPath);
  if (!response.ok || !response.data) {
    throw new Error(response.error?.message || "Failed to duplicate file");
  }
  return response.data;
};

export const apiImportFile = async (
  page: Page,
  sourcePath: string,
  targetPath: string,
): Promise<void> => {
  const response = await page.evaluate(
    async ({ source, target }) => {
      return await window.notegitApi.files.import(source, target);
    },
    { source: sourcePath, target: targetPath },
  );
  if (!response.ok) {
    throw new Error(response.error?.message || "Failed to import file");
  }
};

export const apiCommitAll = async (
  page: Page,
  message: string,
): Promise<void> => {
  const response = await page.evaluate(async (msg) => {
    return await window.notegitApi.files.commitAll(msg);
  }, message);
  if (!response.ok) {
    throw new Error(response.error?.message || "Failed to commit all");
  }
};

export const apiCommitAndPushAll = async (page: Page): Promise<string> => {
  const response = await page.evaluate(async () => {
    return await window.notegitApi.files.commitAndPushAll();
  });
  if (!response.ok || !response.data) {
    throw new Error(response.error?.message || "Failed to commit and push all");
  }
  return response.data.message;
};

export const apiPush = async (page: Page): Promise<void> => {
  const response = await page.evaluate(async () => {
    return await window.notegitApi.repo.push();
  });
  if (!response.ok) {
    throw new Error(response.error?.message || "Failed to push");
  }
};

export const apiFetch = async (page: Page): Promise<void> => {
  const response = await page.evaluate(async () => {
    return await window.notegitApi.repo.fetch();
  });
  if (!response.ok) {
    throw new Error(response.error?.message || "Failed to fetch");
  }
};

export const apiPull = async (page: Page): Promise<void> => {
  const response = await page.evaluate(async () => {
    return await window.notegitApi.repo.pull();
  });
  if (!response.ok) {
    throw new Error(response.error?.message || "Failed to pull");
  }
};

export const apiReadFile = async (
  page: Page,
  filePath: string,
): Promise<string> => {
  const response = await page.evaluate(async (pathValue) => {
    return await window.notegitApi.files.read(pathValue);
  }, filePath);
  if (!response.ok || !response.data) {
    throw new Error(response.error?.message || "Failed to read file");
  }
  return response.data.content;
};

export const apiSaveFile = async (
  page: Page,
  filePath: string,
  content: string,
): Promise<void> => {
  const response = await page.evaluate(
    async ({ pathValue, contentValue }) => {
      return await window.notegitApi.files.save(pathValue, contentValue);
    },
    { pathValue: filePath, contentValue: content },
  );
  if (!response.ok) {
    throw new Error(response.error?.message || "Failed to save file");
  }
};

export const apiGetHistory = async (
  page: Page,
  filePath: string,
): Promise<any[]> => {
  const response = await page.evaluate(async (pathValue) => {
    return await window.notegitApi.history.getForFile(pathValue);
  }, filePath);
  if (!response.ok || !response.data) {
    throw new Error(response.error?.message || "Failed to get history");
  }
  return response.data;
};

export const apiGetVersion = async (
  page: Page,
  commitHash: string,
  filePath: string,
): Promise<string> => {
  const response = await page.evaluate(
    async ({ hash, pathValue }) => {
      return await window.notegitApi.history.getVersion(hash, pathValue);
    },
    { hash: commitHash, pathValue: filePath },
  );
  if (!response.ok || response.data === undefined) {
    throw new Error(response.error?.message || "Failed to get version");
  }
  return response.data;
};

export const apiGetDiff = async (
  page: Page,
  hashA: string,
  hashB: string,
  filePath: string,
): Promise<any[]> => {
  const response = await page.evaluate(
    async ({ a, b, pathValue }) => {
      return await window.notegitApi.history.getDiff(a, b, pathValue);
    },
    { a: hashA, b: hashB, pathValue: filePath },
  );
  if (!response.ok || !response.data) {
    throw new Error(response.error?.message || "Failed to get diff");
  }
  return response.data;
};

export const apiCreateProfile = async (
  page: Page,
  name: string,
  repoSettings: Record<string, unknown>,
): Promise<any> => {
  const response = await page.evaluate(
    async ({ profileName, settings }) => {
      return await window.notegitApi.config.createProfile(
        profileName,
        settings as any,
      );
    },
    { profileName: name, settings: repoSettings },
  );
  if (!response.ok || !response.data) {
    throw new Error(response.error?.message || "Failed to create profile");
  }
  return response.data;
};

export const apiSetActiveProfile = async (
  page: Page,
  profileId: string,
): Promise<void> => {
  const response = await page.evaluate(async (targetId) => {
    return await window.notegitApi.config.setActiveProfile(targetId);
  }, profileId);
  if (!response.ok) {
    throw new Error(response.error?.message || "Failed to set active profile");
  }
};

export const apiGetProfiles = async (page: Page): Promise<any[]> => {
  const response = await page.evaluate(async () => {
    return await window.notegitApi.config.getProfiles();
  });
  if (!response.ok || !response.data) {
    throw new Error(response.error?.message || "Failed to get profiles");
  }
  return response.data;
};

export const apiGetActiveProfileId = async (
  page: Page,
): Promise<string | null> => {
  const response = await page.evaluate(async () => {
    return await window.notegitApi.config.getActiveProfileId();
  });
  if (!response.ok) {
    throw new Error(response.error?.message || "Failed to get active profile");
  }
  return response.data ?? null;
};

export const apiGetFullConfig = async (page: Page): Promise<any> => {
  const response = await page.evaluate(async () => {
    return await window.notegitApi.config.getFull();
  });
  if (!response.ok || !response.data) {
    throw new Error(response.error?.message || "Failed to get full config");
  }
  return response.data;
};

export const apiUpdateRepoSettings = async (
  page: Page,
  settings: Record<string, unknown>,
): Promise<ApiResponsePayload<void>> => {
  return await page.evaluate(async (newSettings) => {
    return await window.notegitApi.config.updateRepoSettings(
      newSettings as any,
    );
  }, settings);
};

export const apiCheckGitInstalled = async (page: Page): Promise<boolean> => {
  const response = await page.evaluate(async () => {
    return await window.notegitApi.config.checkGitInstalled();
  });
  if (!response.ok || response.data === undefined) {
    throw new Error(response.error?.message || "Failed to check Git");
  }
  return Boolean(response.data);
};

export const expectConnectScreen = async (page: Page): Promise<void> => {
  const setupDialogRemoteUrlField = page.getByLabel("Remote URL");
  if ((await setupDialogRemoteUrlField.count()) > 0) {
    await expect(setupDialogRemoteUrlField).toBeVisible();
    return;
  }

  await expect(
    page.getByRole("button", { name: "Connect to Repository" }),
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
