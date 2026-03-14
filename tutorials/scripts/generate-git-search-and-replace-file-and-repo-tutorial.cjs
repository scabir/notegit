const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const REPO_ROOT = path.resolve(__dirname, "../..");
const APP_ROOT = path.join(REPO_ROOT, "app/desktop");
const appRequire = createRequire(path.join(APP_ROOT, "package.json"));
const { _electron: electron, expect } = appRequire("@playwright/test");

const SCENARIO_SLUG = "search-and-replace-file-and-repo";
const SCENARIO_TITLE = "[Git] Search and Replace (File and Repository)";

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

const FIND_TEXT = "todo";
const REPLACE_TEXT = "done";

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
    "This scenario demonstrates repository-wide search plus targeted file replacement and full replace-all.",
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
  await expect(page.locator(".tree-container")).toBeVisible();
  await expect
    .poll(async () => {
      const response = await page.evaluate(async () => {
        return await window.NoteBranchApi.repo.getStatus();
      });
      return response?.ok === true;
    })
    .toBe(true);
};

const MOD_KEY = process.platform === "darwin" ? "Meta" : "Control";

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

const apiReadFile = async (page, filePath) => {
  const response = await page.evaluate(async (pathValue) => {
    return await window.NoteBranchApi.files.read(pathValue);
  }, filePath);

  if (!response?.ok || typeof response.data !== "string") {
    throw new Error(response?.error?.message || `Failed to read ${filePath}`);
  }

  return response.data;
};

const apiRepoWideSearch = async (page, query) => {
  const response = await page.evaluate(async (q) => {
    return await window.NoteBranchApi.search.repoWide(q, {
      caseSensitive: false,
      useRegex: false,
    });
  }, query);

  if (!response?.ok || !Array.isArray(response.data)) {
    throw new Error(response?.error?.message || "Repository search failed");
  }

  return response.data;
};

const apiReplaceInRepo = async (page, query, replacement, filePaths) => {
  const response = await page.evaluate(
    async ({ q, r, files }) => {
      return await window.NoteBranchApi.search.replaceInRepo(q, r, {
        caseSensitive: false,
        useRegex: false,
        filePaths: files,
      });
    },
    {
      q: query,
      r: replacement,
      files: filePaths,
    },
  );

  if (!response?.ok) {
    throw new Error(response?.error?.message || "Repository replace failed");
  }

  return response.data;
};

const openRepoSearchDialog = async (page) => {
  const isMac = process.platform === "darwin";
  await page.evaluate((mac) => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "f",
        shiftKey: true,
        metaKey: mac,
        ctrlKey: !mac,
        bubbles: true,
        cancelable: true,
      }),
    );
  }, isMac);
  await expect(page.getByText("Find and Replace in Repository")).toBeVisible();
};

const run = async () => {
  await assertBuildExists();
  await fs.mkdir(OUTPUT_IMAGE_DIR, { recursive: true });

  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "NoteBranch-tutorial-git-search-replace-"),
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
        "Connect to your repository before running repository-wide search and replace workflows.",
    });

    const firstFilePath = "search-one.md";
    const secondFilePath = "search-two.md";

    await createMarkdownFileViaContextMenu(page, firstFilePath);
    await replaceEditorContent(
      page,
      "# Search One\n\n- todo: update intro\n- todo: verify links\n",
    );

    await createMarkdownFileViaContextMenu(page, secondFilePath);
    await replaceEditorContent(page, "# Search Two\n\n- todo: add examples\n");

    await captureStep({
      page,
      fileName: "step-02-prepare-files-with-matches.png",
      title: "Prepare files with repeated search text",
      explanation:
        "Create multiple notes containing the same text so both file-level and repo-level replace are visible.",
    });

    await openRepoSearchDialog(page);
    await page.getByRole("textbox", { name: "Find" }).fill(FIND_TEXT);
    await page.getByRole("button", { name: "Search Repository" }).click();

    const initialMatches = await apiRepoWideSearch(page, FIND_TEXT);
    if (initialMatches.length === 0) {
      throw new Error("Expected repository-wide matches before replace");
    }

    await captureStep({
      page,
      fileName: "step-03-run-repository-search.png",
      title: "Run repository-wide search",
      explanation:
        "Search across markdown files to review all matches and affected files.",
    });

    await page
      .getByRole("textbox", { name: "Replace (optional)" })
      .fill(REPLACE_TEXT);
    await apiReplaceInRepo(page, FIND_TEXT, REPLACE_TEXT, [firstFilePath]);

    await captureStep({
      page,
      fileName: "step-04-replace-in-single-file.png",
      title: "Replace in one file",
      explanation:
        "Use **Replace in file** to update only one selected file from the result list.",
    });

    await apiReplaceInRepo(page, FIND_TEXT, REPLACE_TEXT);

    const oneContent = await apiReadFile(page, firstFilePath);
    const twoContent = await apiReadFile(page, secondFilePath);

    if (oneContent.includes(FIND_TEXT) || twoContent.includes(FIND_TEXT)) {
      throw new Error("Expected all repository matches to be replaced");
    }

    await captureStep({
      page,
      fileName: "step-05-replace-all-in-repository.png",
      title: "Replace all remaining matches in repository",
      explanation:
        "Use **Replace All in Repo** to update every remaining occurrence across all matched files.",
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
