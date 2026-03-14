const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const REPO_ROOT = path.resolve(__dirname, "../..");
const APP_ROOT = path.join(REPO_ROOT, "app/desktop");
const appRequire = createRequire(path.join(APP_ROOT, "package.json"));
const { _electron: electron, expect } = appRequire("@playwright/test");

const SCENARIO_SLUG = "connect-git-repository";
const SCENARIO_TITLE = "[Git] Connect Git Repository";

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
    "This tutorial is generated with Playwright against the local NoteBranch app in mock Git mode.",
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
  lines.push("### Git authentication checklist");
  lines.push("");
  lines.push(
    "1. Create a Personal Access Token (PAT) in your Git provider account.",
  );
  lines.push("2. Grant repository read/write scope required by your remote.");
  lines.push(
    "3. Copy token securely and paste it in the **Personal Access Token** field.",
  );
  lines.push(
    "4. If your organization enforces SSO, authorize the token before connecting.",
  );
  lines.push("");
  lines.push("### S3 checklist (for S3 connection scenarios)");
  lines.push("");
  lines.push("1. Enable bucket versioning in AWS S3.");
  lines.push(
    "2. Prepare Access Key ID and Secret Access Key with S3 read/write permissions.",
  );
  lines.push(
    "3. Enter bucket, region, optional prefix, and credentials in NoteBranch.",
  );

  return `${lines.join("\n")}\n`;
};

const run = async () => {
  await assertBuildExists();
  await fs.mkdir(OUTPUT_IMAGE_DIR, { recursive: true });

  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "NoteBranch-tutorial-connect-git-"),
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

    await expect(
      page.getByRole("button", { name: "Connect to Repository" }),
    ).toBeVisible();
    await captureStep({
      page,
      fileName: "step-01-welcome-screen.png",
      title: "Open NoteBranch and start repository setup",
      explanation:
        "From the first launch screen, click **Connect to Repository** to start linking your Git remote.",
    });

    await page.getByRole("button", { name: "Connect to Repository" }).click();
    await expect(page.getByLabel("Remote URL")).toBeVisible();

    await captureStep({
      page,
      fileName: "step-02-open-git-connect-dialog.png",
      title: "Open the Git connection dialog",
      explanation:
        "Keep **Repository Type** on Git, then prepare remote URL, branch, and credentials.",
    });

    await page.getByLabel("Remote URL").fill(DEFAULT_REMOTE_URL);
    await page.getByLabel("Branch").fill(DEFAULT_BRANCH);
    await page.getByLabel("Personal Access Token").fill(DEFAULT_PAT);

    await captureStep({
      page,
      fileName: "step-03-fill-git-details.png",
      title: "Enter remote URL, branch, and token",
      explanation:
        "Fill the Git details and review them before you click **Connect**.",
    });

    await page.getByRole("button", { name: "Connect" }).click();

    await expect(page.getByTestId("status-bar-commit-push-action")).toBeVisible(
      {
        timeout: 15_000,
      },
    );
    await expect(page.getByTestId("status-bar-branch-label")).toContainText(
      `Branch: ${DEFAULT_BRANCH}`,
    );
    await expect(page.locator(".tree-container")).toBeVisible();

    await captureStep({
      page,
      fileName: "step-04-verify-connected-workspace.png",
      title: "Verify repository connected successfully",
      explanation:
        "After connecting, the workspace loads with the file tree and branch status visible.",
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
