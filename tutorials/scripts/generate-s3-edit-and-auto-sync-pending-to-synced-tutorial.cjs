const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const REPO_ROOT = path.resolve(__dirname, "../..");
const APP_ROOT = path.join(REPO_ROOT, "app/desktop");
const appRequire = createRequire(path.join(APP_ROOT, "package.json"));
const { _electron: electron, expect } = appRequire("@playwright/test");

const SCENARIO_SLUG = "edit-and-auto-sync-pending-to-synced";
const SCENARIO_TITLE = "[S3] Edit and Auto Sync (Pending to Synced)";

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

const FILE_NAME = "s3-auto-sync-demo.md";

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
    "This scenario shows the S3 sync status transition from pending local changes to synced state.",
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

  lines.push("## Manual Notes");
  lines.push("");
  lines.push("- S3 auto sync also runs on interval from App Settings.");
  lines.push(
    "- Use the status bar sync action when you need immediate upload.",
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

const createFileViaApi = async (page, fileName) => {
  const response = await page.evaluate(async (name) => {
    return await window.NoteBranchApi.files.create("", name);
  }, fileName);

  if (!response?.ok) {
    throw new Error(response?.error?.message || "Failed to create file");
  }
};

const run = async () => {
  await assertBuildExists();
  await fs.mkdir(OUTPUT_IMAGE_DIR, { recursive: true });

  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "NoteBranch-tutorial-s3-auto-sync-"),
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
        "Connect to S3 first so status bar sync actions and pending counters become available.",
    });

    await createFileViaApi(page, FILE_NAME);
    await expect(
      page.locator(".tree-container").getByText(FILE_NAME, { exact: true }),
    ).toBeVisible();

    await captureStep({
      page,
      fileName: "step-02-edit-and-save-note.png",
      title: "Create local S3 changes",
      explanation:
        "Create local note changes first so S3 sync chip can transition from pending to synced.",
    });

    await expect(page.getByTestId("status-bar-sync-chip")).toContainText(
      "changes waiting",
    );

    await captureStep({
      page,
      fileName: "step-03-pending-sync-state.png",
      title: "Observe pending sync state",
      explanation:
        "Before upload completes, sync chip shows pending local changes waiting to be synced.",
    });

    await page.getByTestId("status-bar-commit-push-action").click();
    await expect(page.getByTestId("status-bar-sync-chip")).toContainText(
      "Synced",
    );

    await captureStep({
      page,
      fileName: "step-04-trigger-sync-from-status-bar.png",
      title: "Trigger immediate sync from status bar",
      explanation:
        "Use the status bar sync action to upload pending changes immediately.",
    });

    await captureStep({
      page,
      fileName: "step-05-synced-state.png",
      title: "Confirm synced state",
      explanation:
        "After upload finishes, the sync chip returns to **Synced**.",
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
