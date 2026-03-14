const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const REPO_ROOT = path.resolve(__dirname, "../..");
const APP_ROOT = path.join(REPO_ROOT, "app/desktop");
const appRequire = createRequire(path.join(APP_ROOT, "package.json"));
const { _electron: electron, expect } = appRequire("@playwright/test");

const SCENARIO_SLUG = "organize-files-rename-move-duplicate-favorite";
const SCENARIO_TITLE =
  "[Git] Organize Files: Rename, Move, Duplicate, Favorite";

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

const FOLDER_NAME = "archive";
const INITIAL_FILE_NAME = "organize.md";
const RENAMED_FILE_NAME = "organized-note.md";
const DUPLICATE_FILE_NAME = "organized-note(1).md";

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
    "This scenario starts from a connected Git workspace and shows common file organization actions in the tree.",
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

const openEmptyTreeContextMenu = async (page) => {
  const treeContainer = page.locator(".tree-container");
  await expect(treeContainer).toBeVisible();

  await treeContainer.evaluate((element) => {
    element.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: 18,
        clientY: 18,
      }),
    );
  });

  await expect(page.getByTestId("tree-context-menu-empty")).toBeVisible();
};

const openNodeContextMenu = async (page, nodeName) => {
  const node = page
    .locator(".tree-container")
    .getByText(nodeName, { exact: true })
    .first();
  await expect(node).toBeVisible();
  await node.click({ button: "right" });
  await expect(page.getByTestId("tree-context-menu")).toBeVisible();
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

const treeContainsPath = async (page, targetPath) => {
  return await page.evaluate(async (expectedPath) => {
    const response = await window.NoteBranchApi.files.listTree();
    if (!response?.ok || !Array.isArray(response.data)) {
      return false;
    }

    const walk = (nodes) => {
      for (const node of nodes) {
        if (node.path === expectedPath) {
          return true;
        }
        if (Array.isArray(node.children) && walk(node.children)) {
          return true;
        }
      }
      return false;
    };

    return walk(response.data);
  }, targetPath);
};

const run = async () => {
  await assertBuildExists();
  await fs.mkdir(OUTPUT_IMAGE_DIR, { recursive: true });

  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "NoteBranch-tutorial-git-organize-files-"),
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
        "Repository setup is complete. Begin from a connected workspace before organizing files.",
    });

    await openEmptyTreeContextMenu(page);
    await page.getByTestId("tree-context-new-folder").click();
    const createFolderDialog = page.getByTestId("create-folder-dialog");
    await expect(createFolderDialog).toBeVisible();
    await createFolderDialog.getByLabel("Folder Name").fill(FOLDER_NAME);
    await createFolderDialog.getByRole("button", { name: "Create" }).click();
    await expect(createFolderDialog).toHaveCount(0);

    await openEmptyTreeContextMenu(page);
    await page.getByTestId("tree-context-new-file").click();
    const createFileDialog = page.getByTestId("create-file-dialog");
    await expect(createFileDialog).toBeVisible();
    await createFileDialog.getByLabel("File Name").fill(INITIAL_FILE_NAME);
    await createFileDialog.getByRole("button", { name: "Create" }).click();
    await expect(createFileDialog).toBeHidden();

    await expect(
      page.locator(".tree-container").getByText(FOLDER_NAME, { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .locator(".tree-container")
        .getByText(INITIAL_FILE_NAME, { exact: true })
        .first(),
    ).toBeVisible();

    await captureStep({
      page,
      fileName: "step-02-create-file-and-folder.png",
      title: "Create initial file and destination folder",
      explanation:
        "Create one file and one folder first so you can apply rename and move actions.",
    });

    await openNodeContextMenu(page, INITIAL_FILE_NAME);
    await page.getByTestId("tree-context-rename").click();

    const renameDialog = page.getByTestId("rename-dialog");
    await expect(renameDialog).toBeVisible();
    await renameDialog.getByLabel("New Name").fill(RENAMED_FILE_NAME);

    await captureStep({
      page,
      fileName: "step-03-rename-file.png",
      title: "Rename file",
      explanation:
        "Use **Rename** from the file context menu and enter the new file name.",
    });

    await renameDialog.getByRole("button", { name: "Rename" }).click();
    await expect(renameDialog).toHaveCount(0);
    await expect(
      page
        .locator(".tree-container")
        .getByText(RENAMED_FILE_NAME, { exact: true })
        .first(),
    ).toBeVisible();

    await openNodeContextMenu(page, RENAMED_FILE_NAME);
    await page.getByTestId("tree-context-move").click();

    const moveDialog = page.getByRole("dialog", { name: "Move Item" });
    await expect(moveDialog).toBeVisible();
    await moveDialog.getByText(FOLDER_NAME, { exact: true }).click();

    await captureStep({
      page,
      fileName: "step-04-move-file.png",
      title: "Move file into folder",
      explanation:
        "Open **Move** from context menu, pick target folder, then confirm with **Move Here**.",
    });

    await moveDialog.getByRole("button", { name: "Move Here" }).click();
    await expect(moveDialog).toHaveCount(0);
    await expect
      .poll(
        async () =>
          await treeContainsPath(page, `${FOLDER_NAME}/${RENAMED_FILE_NAME}`),
      )
      .toBe(true);

    const folderNode = page
      .locator(".tree-container")
      .getByText(FOLDER_NAME, { exact: true })
      .first();
    await folderNode.click();

    await openNodeContextMenu(page, RENAMED_FILE_NAME);
    await page.getByTestId("tree-context-duplicate").click();

    await expect
      .poll(
        async () =>
          await treeContainsPath(page, `${FOLDER_NAME}/${DUPLICATE_FILE_NAME}`),
      )
      .toBe(true);

    await captureStep({
      page,
      fileName: "step-05-duplicate-file.png",
      title: "Duplicate file",
      explanation:
        "Use **Duplicate** from file context menu to create a numbered copy in the same folder.",
    });

    await openNodeContextMenu(page, DUPLICATE_FILE_NAME);
    await page.getByTestId("tree-context-favorite").click();

    const favoritesSection = page.getByTestId("favorites-section");
    await expect(favoritesSection).toBeVisible();
    await expect(favoritesSection.getByText(DUPLICATE_FILE_NAME)).toBeVisible();

    await captureStep({
      page,
      fileName: "step-06-add-favorite.png",
      title: "Add file to favorites",
      explanation:
        "Use **Add to favorites** from context menu to pin frequently used notes.",
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
