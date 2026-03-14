const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const REPO_ROOT = path.resolve(__dirname, "../..");
const APP_ROOT = path.join(REPO_ROOT, "app/desktop");
const appRequire = createRequire(path.join(APP_ROOT, "package.json"));
const { _electron: electron, expect } = appRequire("@playwright/test");

const SCENARIO_SLUG = "view-history-and-restore-reference";
const SCENARIO_TITLE = "[Git] View History and Restore Reference";

const OUTPUT_SCENARIO_DIR = path.join(
  REPO_ROOT,
  "tutorials",
  "scenarios",
  SCENARIO_SLUG,
);
const OUTPUT_MARKDOWN_PATH = path.join(OUTPUT_SCENARIO_DIR, "README.md");
const OUTPUT_IMAGE_DIR = path.join(OUTPUT_SCENARIO_DIR, "images");

const DEFAULT_REMOTE_URL = "https://github.com/mock/NoteBranch-integration.git";
const DEFAULT_BRANCH = "main";
const DEFAULT_PAT = "integration-token";

const FILE_NAME = "history-restore-demo.md";
const VERSION_ONE = "# Release Notes\n\n## v1\n\nInitial version.";
const VERSION_TWO =
  "# Release Notes\n\n## v2\n\nUpdated summary and additional details.";

const MOD_KEY = process.platform === "darwin" ? "Meta" : "Control";
const stepEntries = [];

const assertBuildExists = async () => {
  const electronEntry = path.join(APP_ROOT, "dist/electron/electron/main.js");

  try {
    await fs.access(electronEntry);
  } catch {
    throw new Error(
      "Build output not found at app/desktop/dist/electron/electron/main.js. Run 'cd app/desktop && pnpm run build' first.",
    );
  }
};

const captureStep = async ({ page, fileName, title, explanation }) => {
  const screenshotPath = path.join(OUTPUT_IMAGE_DIR, fileName);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  stepEntries.push({
    title,
    explanation,
    imagePath: `images/${fileName}`,
  });
};

const createMarkdownDoc = () => {
  const lines = [
    `# ${SCENARIO_TITLE}`,
    "",
    "This scenario demonstrates how to inspect older versions from file history and restore older content as the new reference.",
    "",
  ];

  stepEntries.forEach((entry, index) => {
    lines.push(`## Step ${index + 1}: ${entry.title}`);
    lines.push("");
    lines.push(entry.explanation);
    lines.push("");
    lines.push(`![${entry.title}](${entry.imagePath})`);
    lines.push("");
  });

  lines.push("## Manual Restore Notes");
  lines.push("");
  lines.push(
    "1. In the history viewer, click **Copy Content** on the version you want.",
  );
  lines.push("2. Close the viewer and paste into the editor.");
  lines.push(
    "3. Save and commit to make that version the new current reference.",
  );

  return `${lines.join("\n")}\n`;
};

const connectRepoWithoutScreenshots = async (page) => {
  await page.getByRole("button", { name: "Connect to Repository" }).click();
  await page.getByLabel("Remote URL").fill(DEFAULT_REMOTE_URL);
  await page.getByLabel("Branch").fill(DEFAULT_BRANCH);
  await page.getByLabel("Personal Access Token").fill(DEFAULT_PAT);
  await page.getByRole("button", { name: "Connect" }).click();

  await expect(page.getByTestId("status-bar-commit-push-action")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("status-bar-branch-label")).toContainText(
    `Branch: ${DEFAULT_BRANCH}`,
  );
  await expect(page.locator(".tree-container")).toBeVisible();
};

const createMarkdownFileViaContextMenu = async (page, fileName) => {
  const treeContainer = page.locator(".tree-container");
  await expect(treeContainer).toBeVisible();
  await treeContainer.click({ button: "right" });
  await page.getByRole("menuitem", { name: "New File" }).click();

  const createDialog = page.getByTestId("create-file-dialog");
  await expect(createDialog).toBeVisible();
  await createDialog.getByLabel("File Name").fill(fileName);
  await createDialog.getByRole("button", { name: "Create" }).click();
  await expect(createDialog).toBeHidden();

  const fileNode = page
    .locator(".tree-container")
    .getByText(fileName, { exact: true })
    .first();
  await expect(fileNode).toBeVisible();
  await fileNode.click();
};

const replaceEditorContent = async (page, content) => {
  const editor = page.locator(".cm-content").first();
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.press(`${MOD_KEY}+A`);
  await page.keyboard.press("Backspace");
  await page.keyboard.type(content);
  await page.keyboard.press(`${MOD_KEY}+S`);
  await expect(page.getByTestId("status-bar-save-status-saved")).toBeVisible();
};

const commitAndPushAll = async (page) => {
  await page.getByTestId("status-bar-commit-push-action").click();
  await expect(
    page
      .getByTestId("status-bar-save-status")
      .getByText("Committed and pushed successfully", { exact: true }),
  ).toBeVisible();
};

const getFileHistory = async (page, filePath) => {
  const response = await page.evaluate(async (pathValue) => {
    return await window.NoteBranchApi.history.getForFile(pathValue);
  }, filePath);

  if (!response?.ok || !Array.isArray(response.data)) {
    throw new Error(response?.error?.message || "Failed to get file history");
  }

  return response.data;
};

const getVersionContent = async (page, hash, filePath) => {
  const response = await page.evaluate(
    async ({ commitHash, pathValue }) => {
      return await window.NoteBranchApi.history.getVersion(commitHash, pathValue);
    },
    {
      commitHash: hash,
      pathValue: filePath,
    },
  );

  if (!response?.ok || typeof response.data !== "string") {
    throw new Error(
      response?.error?.message || "Failed to get version content",
    );
  }

  return response.data;
};

const run = async () => {
  await assertBuildExists();
  await fs.mkdir(OUTPUT_IMAGE_DIR, { recursive: true });

  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "NoteBranch-tutorial-git-history-restore-"),
  );

  /** @type {import('@playwright/test').ElectronApplication | null} */
  let app = null;

  try {
    const launchEnv = {
      ...process.env,
      NODE_ENV: "test",
      NOTEBRANCH_INTEGRATION_TEST: "1",
      NOTEBRANCH_INTEGRATION_GIT_MOCK: "1",
      NOTEBRANCH_INTEGRATION_USER_DATA_DIR: userDataDir,
    };
    delete launchEnv.ELECTRON_RUN_AS_NODE;

    app = await electron.launch({
      args: [APP_ROOT],
      env: launchEnv,
    });

    const page = await app.firstWindow();
    await page.waitForLoadState("domcontentloaded");

    await connectRepoWithoutScreenshots(page);

    await captureStep({
      page,
      fileName: "step-01-connected-workspace.png",
      title: "Start from connected Git workspace",
      explanation:
        "Connect to your Git repository and open the workspace before creating version history.",
    });

    await createMarkdownFileViaContextMenu(page, FILE_NAME);
    await replaceEditorContent(page, VERSION_ONE);
    await commitAndPushAll(page);

    await replaceEditorContent(page, VERSION_TWO);
    await commitAndPushAll(page);

    await captureStep({
      page,
      fileName: "step-02-create-multiple-versions.png",
      title: "Create multiple committed versions",
      explanation:
        "Save and commit at least two different versions so the history panel has entries to review.",
    });

    await page.getByTestId("status-bar-history-action").click();
    await expect(
      page.getByRole("heading", { name: "File History" }),
    ).toBeVisible();

    await captureStep({
      page,
      fileName: "step-03-open-file-history-panel.png",
      title: "Open file history panel",
      explanation:
        "Use the status bar history action to list commits for the currently selected file.",
    });

    const history = await getFileHistory(page, FILE_NAME);
    if (history.length < 2) {
      throw new Error(
        "Expected at least two history entries for restore scenario",
      );
    }

    const olderEntry = history[1];
    const olderShortHash = String(olderEntry.hash).slice(0, 7);
    await page.getByText(olderShortHash, { exact: true }).click();

    await expect(page.getByText("READ ONLY")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy Content" }),
    ).toBeVisible();

    await captureStep({
      page,
      fileName: "step-04-open-older-version-viewer.png",
      title: "Open older version in read-only viewer",
      explanation:
        "Click a commit entry to inspect historical content safely in the read-only history viewer.",
    });

    const olderContent = await getVersionContent(
      page,
      olderEntry.hash,
      FILE_NAME,
    );

    await page.getByLabel("Close", { exact: true }).click();
    await expect(page.getByText("READ ONLY")).toHaveCount(0);

    await replaceEditorContent(page, olderContent);

    await captureStep({
      page,
      fileName: "step-05-restore-older-content-reference.png",
      title: "Restore older content as reference",
      explanation:
        "Apply the older version content back into the editor, then save it as the new current reference.",
    });

    await fs.writeFile(OUTPUT_MARKDOWN_PATH, createMarkdownDoc(), "utf8");

    process.stdout.write(
      `Scenario generated:\n- ${OUTPUT_MARKDOWN_PATH}\n- ${OUTPUT_IMAGE_DIR}\n`,
    );
  } finally {
    if (app) {
      await app.close();
    }
    await fs.rm(userDataDir, { recursive: true, force: true });
  }
};

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Failed to generate scenario: ${message}\n`);
  process.exitCode = 1;
});
