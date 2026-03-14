const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const REPO_ROOT = path.resolve(__dirname, "../..");
const APP_ROOT = path.join(REPO_ROOT, "app/desktop");
const appRequire = createRequire(path.join(APP_ROOT, "package.json"));
const { _electron: electron, expect } = appRequire("@playwright/test");

const SCENARIO_SLUG = "commit-pull-push-from-status-bar";
const SCENARIO_TITLE = "[Git] Commit, Pull, Push from Status Bar";

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
const FILE_NAME = "status-bar-sync-demo.md";
const FILE_CONTENT =
  "# Sync demo\n\nThis file is used to demonstrate status bar Git actions.";

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
    "This scenario shows a practical status bar workflow: save changes, commit+push, fetch remote updates, then pull.",
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

const getRepoStatus = async (page) => {
  const response = await page.evaluate(async () => {
    return await window.NoteBranchApi.repo.getStatus();
  });
  if (!response?.ok || !response.data) {
    throw new Error(response?.error?.message || "Failed to load repo status");
  }
  return response.data;
};

const run = async () => {
  await assertBuildExists();
  await fs.mkdir(OUTPUT_IMAGE_DIR, { recursive: true });

  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "NoteBranch-tutorial-git-status-bar-"),
  );

  /** @type {import('@playwright/test').ElectronApplication | null} */
  let app = null;

  try {
    const launchEnv = {
      ...process.env,
      NODE_ENV: "test",
      NOTEBRANCH_INTEGRATION_TEST: "1",
      NOTEBRANCH_INTEGRATION_GIT_MOCK: "1",
      NOTEBRANCH_MOCK_GIT_FETCH_SETS_BEHIND: "2",
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
        "Connect to your repository first, then use status bar actions for sync operations.",
    });

    await createMarkdownFileViaContextMenu(page, FILE_NAME);

    const editor = page.locator(".cm-content").first();
    await expect(editor).toBeVisible();
    await editor.click();
    await page.keyboard.type(FILE_CONTENT);
    await page.keyboard.press(`${MOD_KEY}+S`);
    await expect(
      page.getByTestId("status-bar-save-status-saved"),
    ).toBeVisible();

    await captureStep({
      page,
      fileName: "step-02-save-local-change.png",
      title: "Create and save a local change",
      explanation:
        "Create a note and save it so the status bar shows changes ready to commit.",
    });

    await page.getByTestId("status-bar-commit-push-action").click();
    await expect(
      page
        .getByTestId("status-bar-save-status")
        .getByText("Committed and pushed successfully", { exact: true }),
    ).toBeVisible();

    await captureStep({
      page,
      fileName: "step-03-commit-and-push.png",
      title: "Commit and push from status bar",
      explanation:
        "Use **Commit + Push** to publish your local changes to the remote branch.",
    });

    await page.getByTestId("status-bar-fetch-action").click();
    await expect.poll(async () => (await getRepoStatus(page)).behind).toBe(2);
    await expect(page.getByTestId("status-bar-pull-action")).toBeEnabled();

    await captureStep({
      page,
      fileName: "step-04-fetch-remote-updates.png",
      title: "Fetch remote updates",
      explanation:
        "Use **Fetch** to refresh remote state and detect incoming commits before pulling.",
    });

    await page.getByTestId("status-bar-pull-action").click();
    await expect(
      page.getByTestId("status-bar-save-status-saved"),
    ).toBeVisible();
    await expect.poll(async () => (await getRepoStatus(page)).behind).toBe(0);

    await captureStep({
      page,
      fileName: "step-05-pull-to-sync.png",
      title: "Pull to sync local branch",
      explanation:
        "Use **Pull** when behind to bring local branch up to date with remote commits.",
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
