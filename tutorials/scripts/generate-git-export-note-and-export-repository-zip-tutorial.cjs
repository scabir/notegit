const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const REPO_ROOT = path.resolve(__dirname, "../..");
const APP_ROOT = path.join(REPO_ROOT, "app/desktop");
const appRequire = createRequire(path.join(APP_ROOT, "package.json"));
const { _electron: electron, expect } = appRequire("@playwright/test");

const SCENARIO_SLUG = "export-note-and-export-repository-zip";
const SCENARIO_TITLE = "[Git] Export Note and Export Repository ZIP";

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
const FILE_NAME = "export-demo.md";
const FILE_CONTENT =
  "# Export Demo\n\nThis note is ready for markdown and text export.";
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
    "This scenario walks through exporting a single note and exporting the full repository ZIP from Settings.",
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

  lines.push("## Manual Steps Not Captured in Screenshots");
  lines.push("");
  lines.push("### Save dialog flow");
  lines.push("");
  lines.push(
    "1. Click **Export as Markdown (.md)** or **Export as Text (.txt)**.",
  );
  lines.push(
    "2. In the system Save dialog, choose destination and file name, then confirm.",
  );
  lines.push(
    "3. Click **Export Repository as ZIP** and confirm destination in the Save dialog.",
  );
  lines.push("4. Wait for completion message in Settings.");

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

const run = async () => {
  await assertBuildExists();
  await fs.mkdir(OUTPUT_IMAGE_DIR, { recursive: true });

  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "NoteBranch-tutorial-git-export-"),
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
        "Connect to your repository and open the workspace before exporting notes or repository backups.",
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
      fileName: "step-02-open-note-for-export.png",
      title: "Create and open the note to export",
      explanation:
        "Open a note in the editor first, because note export requires current note content.",
    });

    await page.getByTestId("status-bar-settings-action").click();
    const settingsDialog = page.getByTestId("settings-dialog");
    await expect(settingsDialog).toBeVisible();

    await settingsDialog.getByRole("tab", { name: "Export" }).click();
    await expect(
      settingsDialog.getByRole("heading", { name: "Export Current Note" }),
    ).toBeVisible();

    await captureStep({
      page,
      fileName: "step-03-open-export-tab.png",
      title: "Open Settings export tab",
      explanation:
        "Open Settings from the status bar and switch to the **Export** tab.",
    });

    await expect(
      settingsDialog.getByRole("button", { name: "Export as Markdown (.md)" }),
    ).toBeVisible();
    await expect(
      settingsDialog.getByRole("button", { name: "Export as Text (.txt)" }),
    ).toBeVisible();

    await captureStep({
      page,
      fileName: "step-04-export-current-note-actions.png",
      title: "Choose note export format",
      explanation:
        "Use markdown or text export buttons to save the current note in your preferred format.",
    });

    await expect(
      settingsDialog.getByRole("button", { name: "Export Repository as ZIP" }),
    ).toBeVisible();

    await captureStep({
      page,
      fileName: "step-05-export-repository-zip-action.png",
      title: "Export full repository as ZIP",
      explanation:
        "Use **Export Repository as ZIP** to create a backup/archive of all repository files.",
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
