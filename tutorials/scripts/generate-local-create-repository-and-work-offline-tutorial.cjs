const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const REPO_ROOT = path.resolve(__dirname, "../..");
const APP_ROOT = path.join(REPO_ROOT, "app/desktop");
const appRequire = createRequire(path.join(APP_ROOT, "package.json"));
const { _electron: electron, expect } = appRequire("@playwright/test");

const SCENARIO_SLUG = "create-local-repository-and-work-offline";
const SCENARIO_TITLE = "[Local] Create Local Repository and Work Offline";

const OUTPUT_SCENARIO_DIR = path.join(
  REPO_ROOT,
  "tutorials",
  "scenarios",
  SCENARIO_SLUG,
);
const OUTPUT_MARKDOWN_PATH = path.join(OUTPUT_SCENARIO_DIR, "README.md");
const OUTPUT_IMAGE_DIR = path.join(OUTPUT_SCENARIO_DIR, "images");

const LOCAL_REPO_NAME = "Offline Notes";
const FILE_NAME = "offline-note.md";
const FILE_CONTENT =
  "# Offline Note\n\nThis note is stored locally without remote sync.";
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
    "This scenario demonstrates local-only workflow with no remote network sync operations.",
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

  lines.push("## Offline Notes");
  lines.push("");
  lines.push("- Local repositories keep files on your device only.");
  lines.push("- Fetch/Pull/Push actions are not shown for local provider.");

  return `${lines.join("\n")}\n`;
};

const connectLocalRepoWithoutScreenshots = async (page) => {
  await page.getByRole("button", { name: "Connect to Repository" }).click();
  await page.getByRole("button", { name: "Local" }).click();
  await page.getByLabel("Local Repository Name").fill(LOCAL_REPO_NAME);
  await page.getByRole("button", { name: "Connect" }).click();

  await expect(page.locator(".tree-container")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("status-bar-fetch-action")).toHaveCount(0);
  await expect(page.getByTestId("status-bar-pull-action")).toHaveCount(0);
  await expect(page.getByTestId("status-bar-push-action")).toHaveCount(0);
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

const run = async () => {
  await assertBuildExists();
  await fs.mkdir(OUTPUT_IMAGE_DIR, { recursive: true });

  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "NoteBranch-tutorial-local-offline-"),
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

    await captureStep({
      page,
      fileName: "step-01-welcome-screen.png",
      title: "Open NoteBranch and start repository setup",
      explanation:
        "From first launch, click **Connect to Repository** to choose local provider.",
    });

    await connectLocalRepoWithoutScreenshots(page);

    await captureStep({
      page,
      fileName: "step-02-connected-local-workspace.png",
      title: "Connect a local repository",
      explanation:
        "Select **Local**, enter a repository name, and connect. Remote sync actions are hidden in local mode.",
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
      fileName: "step-03-create-and-edit-offline-note.png",
      title: "Create and edit note offline",
      explanation:
        "Create a markdown note and save it locally without any remote Git or S3 synchronization.",
    });

    await captureStep({
      page,
      fileName: "step-04-continue-working-offline.png",
      title: "Continue working offline",
      explanation:
        "You can keep organizing and editing notes locally while disconnected from the network.",
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
