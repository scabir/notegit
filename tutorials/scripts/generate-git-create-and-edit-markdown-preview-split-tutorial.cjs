const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const REPO_ROOT = path.resolve(__dirname, "../..");
const APP_ROOT = path.join(REPO_ROOT, "app/desktop");
const appRequire = createRequire(path.join(APP_ROOT, "package.json"));
const { _electron: electron, expect } = appRequire("@playwright/test");

const SCENARIO_SLUG = "create-and-edit-markdown-preview-split";
const SCENARIO_TITLE = "[Git] Create and Edit Markdown in Preview + Split";

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
const FILE_NAME = "markdown-preview-demo.md";

const MARKDOWN_CONTENT = [
  "# Markdown Preview Demo",
  "",
  "## Section: Formatting",
  "",
  "This line has **bold**, *italic*, and `inline code`.",
  "",
  "> This is a blockquote used for preview testing.",
  "",
  "- Bullet item one",
  "- Bullet item two",
  "",
  "1. Ordered item one",
  "2. Ordered item two",
  "",
  "[Open NoteBranch docs](https://example.com)",
  "",
  "| Syntax | Example |",
  "| --- | --- |",
  "| Bold | **text** |",
].join("\n");

const stepEntries = [];
const PREVIEW_ONLY_SELECTOR = 'button[aria-label="preview only"]';
const SPLIT_VIEW_SELECTOR = 'button[aria-label="split view"]';

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
    "This scenario starts from a connected Git workspace and focuses on markdown creation, editing, and preview modes.",
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

const createFileWithContextMenu = async (page, fileName) => {
  const treeContainer = page.locator(".tree-container");
  await expect(treeContainer).toBeVisible();

  await treeContainer.click({ button: "right" });
  await page.getByRole("menuitem", { name: "New File" }).click();

  const createDialog = page.getByTestId("create-file-dialog");
  await expect(createDialog).toBeVisible();
  await createDialog.getByLabel("File Name").fill(fileName);
  return createDialog;
};

const run = async () => {
  await assertBuildExists();
  await fs.mkdir(OUTPUT_IMAGE_DIR, { recursive: true });

  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "NoteBranch-tutorial-git-markdown-preview-"),
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
      fileName: "step-01-workspace-ready.png",
      title: "Start from connected Git workspace",
      explanation:
        "Repository setup is complete. Begin from a connected workspace before creating your markdown note.",
    });

    const createDialog = await createFileWithContextMenu(page, FILE_NAME);
    await captureStep({
      page,
      fileName: "step-02-create-markdown-file.png",
      title: "Create a new markdown file",
      explanation:
        "Open the file tree context menu, choose **New File**, and enter a markdown filename.",
    });

    await createDialog.getByRole("button", { name: "Create" }).click();
    await expect(createDialog).toBeHidden();

    const fileInTree = page
      .locator(".tree-container")
      .getByText(FILE_NAME, { exact: true })
      .first();
    await expect(fileInTree).toBeVisible();
    await fileInTree.click();

    const editor = page.locator(".cm-content").first();
    await expect(editor).toBeVisible();
    await editor.click();
    await page.keyboard.type(MARKDOWN_CONTENT);

    await captureStep({
      page,
      fileName: "step-03-edit-markdown-content.png",
      title: "Edit markdown content",
      explanation:
        "Add headings, emphasis, inline code, quote, lists, link, and table content in the editor.",
    });

    await page.locator(PREVIEW_ONLY_SELECTOR).click();
    await expect(page.locator(SPLIT_VIEW_SELECTOR)).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Markdown Preview Demo" }),
    ).toBeVisible();

    await captureStep({
      page,
      fileName: "step-04-preview-only.png",
      title: "Review in preview-only mode",
      explanation:
        "Switch to **Preview Only** to validate rendered markdown output without editor pane.",
    });

    await page.locator(SPLIT_VIEW_SELECTOR).click();
    await expect(page.locator(".cm-content").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Markdown Preview Demo" }),
    ).toBeVisible();

    await captureStep({
      page,
      fileName: "step-05-split-view.png",
      title: "Compare source and render in split view",
      explanation:
        "Switch to **Split View** to see raw markdown and rendered output side by side.",
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
