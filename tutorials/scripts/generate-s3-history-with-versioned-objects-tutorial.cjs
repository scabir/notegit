const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const REPO_ROOT = path.resolve(__dirname, "../..");
const APP_ROOT = path.join(REPO_ROOT, "app/desktop");
const appRequire = createRequire(path.join(APP_ROOT, "package.json"));
const { _electron: electron, expect } = appRequire("@playwright/test");

const SCENARIO_SLUG = "s3-history-with-versioned-objects";
const SCENARIO_TITLE = "[S3] History with Versioned Objects";

const OUTPUT_SCENARIO_DIR = path.join(
  REPO_ROOT,
  "tutorials",
  "scenarios",
  SCENARIO_SLUG,
);
const OUTPUT_MARKDOWN_PATH = path.join(OUTPUT_SCENARIO_DIR, "README.md");
const OUTPUT_IMAGE_DIR = path.join(OUTPUT_SCENARIO_DIR, "images");

const S3_BUCKET = "NoteBranch-integration-bucket";
const S3_REGION = "us-east-1";
const S3_ACCESS_KEY_ID = "mock-access-key";
const S3_SECRET_ACCESS_KEY = "mock-secret-key";

const FILE_NAME = "s3-history-demo.md";
const VERSION_ONE = "# S3 History Demo\n\n## v1\n\nInitial body.";
const VERSION_TWO =
  "# S3 History Demo\n\n## v2\n\nUpdated body with extra lines.";
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
    "This scenario shows how S3 object versions appear in history after multiple syncs.",
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

  lines.push("## Versioning Notes");
  lines.push("");
  lines.push(
    "- S3 bucket versioning must be enabled to retain object history.",
  );
  lines.push(
    "- S3 history viewer supports version inspection but not diff rendering.",
  );

  return `${lines.join("\n")}\n`;
};

const connectS3RepoWithoutScreenshots = async (page) => {
  await page.getByRole("button", { name: "Connect to Repository" }).click();
  await page.getByRole("button", { name: "S3" }).click();
  await page.getByLabel("Bucket").fill(S3_BUCKET);
  await page.getByLabel("Region").fill(S3_REGION);
  await page.getByLabel("Access Key ID").fill(S3_ACCESS_KEY_ID);
  await page.getByLabel("Secret Access Key").fill(S3_SECRET_ACCESS_KEY);
  await page.getByRole("button", { name: "Connect" }).click();

  await expect(page.getByTestId("status-bar-commit-push-action")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("status-bar-branch-label")).toContainText(
    "Bucket:",
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

const syncNow = async (page) => {
  await page.getByTestId("status-bar-commit-push-action").click();
  await expect(page.getByTestId("status-bar-sync-chip")).toContainText(
    "Synced",
  );
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

const run = async () => {
  await assertBuildExists();
  await fs.mkdir(OUTPUT_IMAGE_DIR, { recursive: true });

  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "NoteBranch-tutorial-s3-history-"),
  );

  /** @type {import('@playwright/test').ElectronApplication | null} */
  let app = null;

  try {
    const launchEnv = {
      ...process.env,
      NODE_ENV: "test",
      NOTEBRANCH_INTEGRATION_TEST: "1",
      NOTEBRANCH_INTEGRATION_GIT_MOCK: "1",
      NOTEBRANCH_INTEGRATION_S3_MOCK: "1",
      NOTEBRANCH_INTEGRATION_USER_DATA_DIR: userDataDir,
    };
    delete launchEnv.ELECTRON_RUN_AS_NODE;

    app = await electron.launch({
      args: [APP_ROOT],
      env: launchEnv,
    });

    const page = await app.firstWindow();
    await page.waitForLoadState("domcontentloaded");

    await connectS3RepoWithoutScreenshots(page);

    await captureStep({
      page,
      fileName: "step-01-connected-s3-workspace.png",
      title: "Start from connected S3 workspace",
      explanation:
        "Connect to a versioned S3 bucket before creating multiple historical versions.",
    });

    await createMarkdownFileViaContextMenu(page, FILE_NAME);
    await replaceEditorContent(page, VERSION_ONE);
    await syncNow(page);

    await replaceEditorContent(page, VERSION_TWO);
    await syncNow(page);

    await captureStep({
      page,
      fileName: "step-02-create-and-sync-multiple-versions.png",
      title: "Create and sync multiple versions",
      explanation:
        "Save and sync two revisions so S3 object version history is available.",
    });

    await page.getByTestId("status-bar-history-action").click();
    await expect(
      page.getByRole("heading", { name: "File History" }),
    ).toBeVisible();

    await captureStep({
      page,
      fileName: "step-03-open-s3-history-panel.png",
      title: "Open S3 history panel",
      explanation:
        "Use the history action to view available S3 object versions for the selected file.",
    });

    const history = await getFileHistory(page, FILE_NAME);
    if (history.length < 2) {
      throw new Error("Expected at least two S3 history entries");
    }

    await page
      .getByRole("button", { name: /S3 version/i })
      .first()
      .click();

    await expect(page.getByText("READ ONLY")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy Content" }),
    ).toBeVisible();

    await captureStep({
      page,
      fileName: "step-04-open-versioned-object-viewer.png",
      title: "Open versioned object content",
      explanation:
        "Open a history entry to inspect that S3 object version in the read-only viewer.",
    });

    await page.getByLabel("Close", { exact: true }).click();
    await expect(page.getByText("READ ONLY")).toHaveCount(0);

    await captureStep({
      page,
      fileName: "step-05-return-to-current-version.png",
      title: "Return to current working version",
      explanation:
        "Close the history viewer and continue working on the current file version in the editor.",
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
