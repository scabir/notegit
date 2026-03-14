const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const REPO_ROOT = path.resolve(__dirname, "../..");
const APP_ROOT = path.join(REPO_ROOT, "app/desktop");
const appRequire = createRequire(path.join(APP_ROOT, "package.json"));
const { _electron: electron, expect } = appRequire("@playwright/test");

const SCENARIO_SLUG = "switch-language-and-verify-persistence";
const SCENARIO_TITLE = "[Global] Switch Language and Verify Persistence";
const TARGET_LOCALE = "es-ES";
const ENGLISH_LOCALE = "en-GB";

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
const SHOWCASE_FILE_NAME = "dark-mode-showcase.md";
const SHOWCASE_FILE_CONTENT = [
  "# Dark Mode Showcase",
  "",
  "This note is used to capture a clear dark-mode workspace screenshot.",
].join("\n");
const MOD_KEY = process.platform === "darwin" ? "Meta" : "Control";

const SETTINGS_DIALOG_TEST_ID = "settings-dialog";
const SETTINGS_APP_TAB_TEST_ID = "settings-tab-app-settings";
const SETTINGS_LANGUAGE_SELECT_TEST_ID = "settings-language-select";
const SETTINGS_SAVE_APP_BUTTON_TEST_ID = "settings-save-app-button";
const THEME_DARK_VALUE = "dark";

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
    "This scenario shows how to switch UI language in Settings and verify the selection persists after restart.",
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

const connectGitRepo = async (page) => {
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
};

const getI18nMeta = async (page) => {
  const response = await page.evaluate(async () => {
    return await window.NoteBranchApi.i18n.getMeta();
  });

  if (!response?.ok || !response.data) {
    throw new Error(response?.error?.message || "Failed to load i18n metadata");
  }

  return response.data;
};

const getCurrentLocale = async (page) => {
  const response = await page.evaluate(async () => {
    return await window.NoteBranchApi.i18n.getFrontendBundle();
  });

  if (!response?.ok || !response.data) {
    throw new Error(
      response?.error?.message || "Failed to load frontend bundle",
    );
  }

  return response.data.locale;
};

const pickTargetLocale = (meta) => {
  const uniqueLocales = Array.from(
    new Set(
      (meta.supportedLocales || []).map((locale) => String(locale).trim()),
    ),
  ).filter((locale) => locale.length > 0);

  const fallback = String(meta.fallbackLocale || "en-GB");
  if (uniqueLocales.includes(TARGET_LOCALE)) {
    return TARGET_LOCALE;
  }
  return uniqueLocales.find((locale) => locale !== fallback) || fallback;
};

const openAppSettings = async (page) => {
  const settingsDialog = page.getByTestId(SETTINGS_DIALOG_TEST_ID);
  const dialogAlreadyOpen = await settingsDialog.isVisible().catch(() => false);
  if (!dialogAlreadyOpen) {
    await page.getByTestId("status-bar-settings-action").click();
    await expect(settingsDialog).toBeVisible();
  }
  await settingsDialog.getByTestId(SETTINGS_APP_TAB_TEST_ID).click();
  return settingsDialog;
};

const selectLocaleInOpenSettings = async (page, locale) => {
  const settingsDialog = page.getByTestId(SETTINGS_DIALOG_TEST_ID);
  await expect(settingsDialog).toBeVisible();
  await settingsDialog.getByTestId(SETTINGS_APP_TAB_TEST_ID).click();

  const languageSelect = settingsDialog.getByTestId(
    SETTINGS_LANGUAGE_SELECT_TEST_ID,
  );
  await expect(languageSelect).toBeVisible();
  await languageSelect.click();

  const localeOption = page.locator(`[role='option'][data-value='${locale}']`).first();
  await expect(localeOption).toBeVisible();
  await localeOption.click();
};

const selectThemeInOpenSettings = async (page, themeValue) => {
  const settingsDialog = page.getByTestId(SETTINGS_DIALOG_TEST_ID);
  await expect(settingsDialog).toBeVisible();
  await settingsDialog.getByTestId(SETTINGS_APP_TAB_TEST_ID).click();

  const themeSelect = settingsDialog.locator("[role='combobox']").nth(1);
  await expect(themeSelect).toBeVisible();
  await themeSelect.click();

  const themeOption = page
    .locator(`[role='option'][data-value='${themeValue}']`)
    .first();
  await expect(themeOption).toBeVisible();
  await themeOption.click();
};

const saveAppSettingsAndWaitLocale = async (page, locale) => {
  const settingsDialog = page.getByTestId(SETTINGS_DIALOG_TEST_ID);
  await expect(settingsDialog).toBeVisible();
  await settingsDialog.getByTestId(SETTINGS_SAVE_APP_BUTTON_TEST_ID).click();

  await expect
    .poll(async () => await getCurrentLocale(page))
    .toBe(locale);
};

const switchLanguageFromSettings = async (page, targetLocale) => {
  await openAppSettings(page);
  await selectLocaleInOpenSettings(page, targetLocale);
  await saveAppSettingsAndWaitLocale(page, targetLocale);
};

const switchThemeToDarkFromSettings = async (page, expectedLocale) => {
  await selectThemeInOpenSettings(page, THEME_DARK_VALUE);
  await saveAppSettingsAndWaitLocale(page, expectedLocale);
  await page.waitForTimeout(600);
};

const createShowcaseFile = async (page) => {
  const treeContainer = page.locator(".tree-container");
  await expect(treeContainer).toBeVisible();

  await treeContainer.click({ button: "right" });
  await page.getByRole("menuitem", { name: "New File" }).click();

  const createDialog = page.getByTestId("create-file-dialog");
  await expect(createDialog).toBeVisible();
  await createDialog.getByLabel("File Name").fill(SHOWCASE_FILE_NAME);
  await createDialog.getByRole("button", { name: "Create" }).click();
  await expect(createDialog).toBeHidden();

  const fileInTree = treeContainer
    .getByText(SHOWCASE_FILE_NAME, { exact: true })
    .first();
  await expect(fileInTree).toBeVisible();
  await fileInTree.click();

  const editor = page.locator(".cm-content").first();
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.type(SHOWCASE_FILE_CONTENT);
  await page.keyboard.press(`${MOD_KEY}+S`);
  await expect(page.getByTestId("status-bar-save-status-saved")).toBeVisible();
};

const captureDarkWorkspaceStep = async (page) => {
  const settingsDialog = page.getByTestId(SETTINGS_DIALOG_TEST_ID);
  await expect(settingsDialog).toBeVisible();
  await settingsDialog.getByTestId("settings-close-button").click();
  await expect(settingsDialog).toBeHidden();

  const treeContainer = page.locator(".tree-container");
  const fileInTree = treeContainer
    .getByText(SHOWCASE_FILE_NAME, { exact: true })
    .first();
  await expect(fileInTree).toBeVisible();
  await fileInTree.click();

  const editor = page.locator(".cm-content").first();
  await expect(editor).toBeVisible();
  await expect(editor).toContainText("Dark Mode Showcase");
};

const run = async () => {
  await assertBuildExists();
  await fs.mkdir(OUTPUT_IMAGE_DIR, { recursive: true });

  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "NoteBranch-tutorial-global-language-"),
  );

  let firstApp = null;
  let secondApp = null;

  try {
    const firstLaunch = await launchApp(userDataDir);
    firstApp = firstLaunch.app;
    const firstPage = firstLaunch.page;

    await connectGitRepo(firstPage);

    await captureStep({
      page: firstPage,
      fileName: "step-01-connected-workspace-default-language.png",
      title: "Open connected workspace in default language",
      explanation:
        "Start from a connected workspace before changing language preferences.",
    });

    await createShowcaseFile(firstPage);

    const i18nMeta = await getI18nMeta(firstPage);
    const targetLocale = pickTargetLocale(i18nMeta);

    const settingsDialog = await openAppSettings(firstPage);
    await captureStep({
      page: firstPage,
      fileName: "step-02-open-app-language-settings.png",
      title: "Open app language settings",
      explanation:
        "Open Settings and App Settings tab to access the language dropdown.",
    });

    const languageSelect = settingsDialog.getByTestId(
      SETTINGS_LANGUAGE_SELECT_TEST_ID,
    );
    await expect(languageSelect).toBeVisible();
    await languageSelect.click();
    const localeOption = firstPage
      .locator(`[role='option'][data-value='${targetLocale}']`)
      .first();
    await expect(localeOption).toBeVisible();
    await localeOption.click();

    await settingsDialog.getByTestId(SETTINGS_SAVE_APP_BUTTON_TEST_ID).click();
    await expect
      .poll(async () => await getCurrentLocale(firstPage))
      .toBe(targetLocale);

    await captureStep({
      page: firstPage,
      fileName: "step-03-save-new-language.png",
      title: "Save language selection",
      explanation:
        "Select Spanish (`es-ES`) and save app settings to apply localization.",
    });

    await openAppSettings(firstPage);
    await selectLocaleInOpenSettings(firstPage, ENGLISH_LOCALE);
    await switchThemeToDarkFromSettings(firstPage, ENGLISH_LOCALE);
    await captureDarkWorkspaceStep(firstPage);
    await captureStep({
      page: firstPage,
      fileName: "step-04-dark-mode-workspace.png",
      title: "Work in dark mode",
      explanation:
        "Use **Dark** theme and continue working in a low-light workspace (shown here in English UI).",
    });

    await switchLanguageFromSettings(firstPage, targetLocale);

    await firstApp.close();
    firstApp = null;

    const secondLaunch = await launchApp(userDataDir);
    secondApp = secondLaunch.app;
    const secondPage = secondLaunch.page;

    await expect(
      secondPage.getByTestId("status-bar-settings-action"),
    ).toBeVisible();
    await expect
      .poll(async () => await getCurrentLocale(secondPage))
      .toBe(targetLocale);

    await captureStep({
      page: secondPage,
      fileName: "step-05-restart-and-verify-language-persistence.png",
      title: "Restart and verify language persistence",
      explanation:
        "After reopening the app, the previously selected language remains active.",
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
