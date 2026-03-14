const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const REPO_ROOT = path.resolve(__dirname, "../..");
const APP_ROOT = path.join(REPO_ROOT, "app/desktop");
const appRequire = createRequire(path.join(APP_ROOT, "package.json"));
const { _electron: electron, expect } = appRequire("@playwright/test");

const SCENARIO_SLUG = "connect-s3-bucket-with-prefix";
const SCENARIO_TITLE = "[S3] Connect S3 Bucket with Prefix";

const OUTPUT_SCENARIO_DIR = path.join(
  REPO_ROOT,
  "tutorials",
  "scenarios",
  SCENARIO_SLUG,
);
const OUTPUT_MARKDOWN_PATH = path.join(OUTPUT_SCENARIO_DIR, "README.md");
const OUTPUT_IMAGE_DIR = path.join(OUTPUT_SCENARIO_DIR, "images");

const DEFAULT_BUCKET = "NoteBranch-integration-bucket";
const DEFAULT_REGION = "us-east-1";
const DEFAULT_PREFIX = "team/notes";
const DEFAULT_ACCESS_KEY_ID = "mock-access-key";
const DEFAULT_SECRET_ACCESS_KEY = "mock-secret-key";

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
    "This tutorial is generated with Playwright against the local NoteBranch app in mock S3 mode.",
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
  lines.push("### AWS and S3 checklist");
  lines.push("");
  lines.push("1. Open AWS S3 and verify bucket versioning is enabled.");
  lines.push(
    "2. Create or use IAM credentials with S3 read/write permissions for the target bucket.",
  );
  lines.push("3. Copy Access Key ID and Secret Access Key.");
  lines.push(
    "4. In NoteBranch, enter bucket, region, optional prefix, and credentials.",
  );
  lines.push(
    "5. If your organization rotates credentials, update them in Settings when sync fails.",
  );

  return `${lines.join("\n")}\n`;
};

const assertS3PrefixConnected = async (page) => {
  await expect(page.getByTestId("status-bar-commit-push-action")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("status-bar-branch-label")).toContainText(
    "Bucket:",
  );
  await expect(page.locator(".tree-container")).toBeVisible();

  await expect
    .poll(async () => {
      const response = await page.evaluate(async () => {
        return await window.NoteBranchApi.repo.getStatus();
      });
      if (!response?.ok || !response.data) {
        throw new Error(
          response?.error?.message || "Failed to load repo status",
        );
      }
      return String(response.data.branch || "");
    })
    .toContain(DEFAULT_PREFIX);
};

const run = async () => {
  await assertBuildExists();
  await fs.mkdir(OUTPUT_IMAGE_DIR, { recursive: true });

  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "NoteBranch-tutorial-connect-s3-"),
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

    await expect(
      page.getByRole("button", { name: "Connect to Repository" }),
    ).toBeVisible();
    await captureStep({
      page,
      fileName: "step-01-welcome-screen.png",
      title: "Open NoteBranch and start repository setup",
      explanation:
        "From the first launch screen, click **Connect to Repository** to configure S3 access.",
    });

    await page.getByRole("button", { name: "Connect to Repository" }).click();
    await page.getByRole("button", { name: "S3" }).click();
    await expect(page.getByLabel("Bucket")).toBeVisible();

    await captureStep({
      page,
      fileName: "step-02-switch-to-s3-tab.png",
      title: "Switch repository type to S3",
      explanation:
        "In the connect dialog, choose **S3** so bucket and credential fields are shown.",
    });

    await page.getByLabel("Bucket").fill(DEFAULT_BUCKET);
    await page.getByLabel("Region").fill(DEFAULT_REGION);
    await page.getByLabel("Prefix (optional)").fill(DEFAULT_PREFIX);

    await captureStep({
      page,
      fileName: "step-03-fill-bucket-region-prefix.png",
      title: "Fill bucket, region, and prefix",
      explanation:
        "Set a prefix to scope notes to a folder-like path inside the bucket.",
    });

    await page.getByLabel("Access Key ID").fill(DEFAULT_ACCESS_KEY_ID);
    await page.getByLabel("Secret Access Key").fill(DEFAULT_SECRET_ACCESS_KEY);

    await captureStep({
      page,
      fileName: "step-04-fill-s3-credentials.png",
      title: "Enter AWS credentials",
      explanation:
        "Add Access Key ID and Secret Access Key, then verify all fields before connecting.",
    });

    await page.getByRole("button", { name: "Connect" }).click();

    await assertS3PrefixConnected(page);

    await captureStep({
      page,
      fileName: "step-05-verify-s3-connected.png",
      title: "Verify S3 repository connected",
      explanation:
        "After connect, workspace loads and repository status confirms S3 connection with prefix scope.",
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
