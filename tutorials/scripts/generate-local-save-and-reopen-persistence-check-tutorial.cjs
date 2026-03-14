const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const REPO_ROOT = path.resolve(__dirname, "../..");
const APP_ROOT = path.join(REPO_ROOT, "app/desktop");
const appRequire = createRequire(path.join(APP_ROOT, "package.json"));
const { _electron: electron, expect } = appRequire("@playwright/test");

const SCENARIO_SLUG = "local-save-and-reopen-persistence-check";
const SCENARIO_TITLE = "[Local] Save and Reopen Persistence Check";

const OUTPUT_SCENARIO_DIR = path.join(
  REPO_ROOT,
  "tutorials",
  "scenarios",
  SCENARIO_SLUG,
);
const OUTPUT_MARKDOWN_PATH = path.join(OUTPUT_SCENARIO_DIR, "README.md");
const OUTPUT_IMAGE_DIR = path.join(OUTPUT_SCENARIO_DIR, "images");

const LOCAL_REPO_NAME = "Persistence Notes";
const FILE_NAME = "persistence-note.md";
const FILE_CONTENT =
  "# Persistence Check\n\nThis content should still be available after restart.";
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
    "This scenario verifies local notes are persisted and restored after closing and reopening NoteBranch.",
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

const launchEnvForUserDataDir = (userDataDir) => {
  const launchEnv = {
    ...process.env,
    NODE_ENV: "test",
    NOTEBRANCH_INTEGRATION_TEST: "1",
    NOTEBRANCH_INTEGRATION_GIT_MOCK: "1",
    NOTEBRANCH_INTEGRATION_USER_DATA_DIR: userDataDir,
  };
  delete launchEnv.ELECTRON_RUN_AS_NODE;
  return launchEnv;
};

const launchApp = async (userDataDir) => {
  const app = await electron.launch({
    args: [APP_ROOT],
    env: launchEnvForUserDataDir(userDataDir),
  });
  const page = await app.firstWindow();
  await page.waitForLoadState("domcontentloaded");
  return { app, page };
};

const connectLocalRepo = async (page) => {
  await page.getByRole("button", { name: "Connect to Repository" }).click();
  await page.getByRole("button", { name: "Local" }).click();
  await page.getByLabel("Local Repository Name").fill(LOCAL_REPO_NAME);
  await page.getByRole("button", { name: "Connect" }).click();
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
    path.join(os.tmpdir(), "NoteBranch-tutorial-local-persistence-"),
  );

  let firstApp = null;
  let secondApp = null;

  try {
    const firstLaunch = await launchApp(userDataDir);
    firstApp = firstLaunch.app;
    const firstPage = firstLaunch.page;

    await connectLocalRepo(firstPage);

    await captureStep({
      page: firstPage,
      fileName: "step-01-connect-local-repository.png",
      title: "Connect local repository",
      explanation:
        "Connect using Local provider so data is stored on this device for persistence checks.",
    });

    await createMarkdownFileViaContextMenu(firstPage, FILE_NAME);

    const editor = firstPage.locator(".cm-content").first();
    await expect(editor).toBeVisible();
    await editor.click();
    await firstPage.keyboard.type(FILE_CONTENT);
    await firstPage.keyboard.press(`${MOD_KEY}+S`);
    await expect(
      firstPage.getByTestId("status-bar-save-status-saved"),
    ).toBeVisible();

    await captureStep({
      page: firstPage,
      fileName: "step-02-save-local-note.png",
      title: "Save local note",
      explanation: "Create and save local note content before closing the app.",
    });

    await firstApp.close();
    firstApp = null;

    const secondLaunch = await launchApp(userDataDir);
    secondApp = secondLaunch.app;
    const secondPage = secondLaunch.page;

    await expect(
      secondPage.getByRole("button", { name: "Connect to Repository" }),
    ).toHaveCount(0);

    const reopenedNode = secondPage
      .locator(".tree-container")
      .getByText(FILE_NAME, { exact: true })
      .first();
    await expect(reopenedNode).toBeVisible();
    await reopenedNode.click();

    await captureStep({
      page: secondPage,
      fileName: "step-03-reopen-and-verify-file-list.png",
      title: "Reopen app and verify file exists",
      explanation:
        "After restart, local repository opens directly and previously saved files remain in the tree.",
    });

    const reopenedEditor = secondPage.locator(".cm-content").first();
    await expect(reopenedEditor).toBeVisible();
    await expect(reopenedEditor).toContainText("Persistence Check");

    await captureStep({
      page: secondPage,
      fileName: "step-04-confirm-content-persistence.png",
      title: "Confirm content persistence",
      explanation:
        "Open the note after restart and confirm saved content is still available.",
    });

    await fs.writeFile(OUTPUT_MARKDOWN_PATH, createMarkdownDoc(), "utf8");

    process.stdout.write(
      `Scenario generated:\n- ${OUTPUT_MARKDOWN_PATH}\n- ${OUTPUT_IMAGE_DIR}\n`,
    );
  } finally {
    if (firstApp) {
      await firstApp.close();
    }
    if (secondApp) {
      await secondApp.close();
    }
    await fs.rm(userDataDir, { recursive: true, force: true });
  }
};

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Failed to generate scenario: ${message}\n`);
  process.exitCode = 1;
});
