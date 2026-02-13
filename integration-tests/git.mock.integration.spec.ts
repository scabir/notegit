import { test, expect, _electron as electron } from "@playwright/test";
import type { ElectronApplication, Page } from "@playwright/test";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

const launchIntegrationApp = async (
  userDataDir: string,
): Promise<{ app: ElectronApplication; page: Page }> => {
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

// Playwright requires an object-destructuring first argument for test callbacks.
// eslint-disable-next-line no-empty-pattern
test("mock git integration: create file, commit and push", async ({}, testInfo) => {
  const userDataDir = await fs.mkdtemp(
    path.join(
      os.tmpdir(),
      `notegit-integration-${testInfo.parallelIndex}-${Date.now()}-`,
    ),
  );

  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await page.getByRole("button", { name: "Connect to Repository" }).click();
    await page
      .getByLabel("Remote URL")
      .fill("https://github.com/mock/notegit-integration.git");
    await page.getByLabel("Personal Access Token").fill("integration-token");
    await page.getByRole("button", { name: "Connect" }).click();

    await expect(
      page.getByTestId("status-bar-commit-push-action"),
    ).toBeVisible();

    const treeContainer = page.locator(".tree-container");
    await expect(treeContainer).toBeVisible();
    await treeContainer.click({ button: "right" });
    await page.getByRole("menuitem", { name: "New File" }).click();

    const createDialog = page.getByTestId("create-file-dialog");
    await expect(createDialog).toBeVisible();
    await createDialog.getByLabel("File Name").fill("integration-note.md");
    await createDialog.getByRole("button", { name: "Create" }).click();

    await expect(page.getByText("integration-note.md")).toBeVisible();

    const editor = page.locator(".cm-content").first();
    await editor.click();
    await page.keyboard.type("\nIntegration test content\n");

    await page.getByTestId("status-bar-commit-push-action").click();
    const saveStatus = page.getByTestId("status-bar-save-status");
    await expect(saveStatus).toBeVisible();
    await expect(
      page.getByTestId("status-bar-save-status-saved"),
    ).toBeVisible();
    await expect(
      saveStatus.getByText("Committed and pushed successfully", {
        exact: true,
      }),
    ).toBeVisible();

    const repoInfo = await page.evaluate(async () => {
      const response = await window.notegitApi.config.getFull();
      return {
        ok: response.ok,
        localPath: response.data?.repoSettings?.localPath || "",
      };
    });

    expect(repoInfo.ok).toBe(true);
    expect(
      path.resolve(repoInfo.localPath).startsWith(path.resolve(userDataDir)),
    ).toBe(true);
    await fs.access(path.join(repoInfo.localPath, "integration-note.md"));
  } finally {
    if (app) {
      await app.close();
    }
    await fs.rm(userDataDir, { recursive: true, force: true });
  }
});
