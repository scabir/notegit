import { expect, test } from "@playwright/test";
import type { ElectronApplication, Page } from "@playwright/test";
import {
  apiGetFrontendBundle,
  apiGetI18nMeta,
  apiGetFullConfig,
  buildLocaleSwitchSequence,
  cleanupUserDataDir,
  closeAppIfOpen,
  closeSettingsDialog,
  connectGitRepo,
  createIsolatedUserDataDir,
  getBundleString,
  launchIntegrationApp,
  openSettingsDialog,
  switchAppLanguageFromSettings,
} from "../helpers/gitIntegration";

const expectGitLocaleApplied = async (page: Page, expectedLocale: string) => {
  const bundle = await apiGetFrontendBundle(page);
  expect(bundle.locale).toBe(expectedLocale);

  const branchLabel = getBundleString(bundle, "statusBar.branchLabel");
  await expect(page.getByTestId("status-bar-branch-label")).toContainText(
    `${branchLabel}:`,
  );
  return bundle;
};

test("(git) language switch updates UI text across all supported locales", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectGitRepo(page);
    await expectGitLocaleApplied(page, "en-GB");

    const i18nMeta = await apiGetI18nMeta(page);
    const switchSequence = buildLocaleSwitchSequence(
      i18nMeta.supportedLocales,
      i18nMeta.fallbackLocale,
    );

    for (const locale of switchSequence) {
      await switchAppLanguageFromSettings(page, locale);
      const bundle = await expectGitLocaleApplied(page, locale);
      await expect(page.getByTestId("settings-dialog-title")).toHaveText(
        getBundleString(bundle, "settingsDialog.title"),
      );
      await closeSettingsDialog(page);

      const config = await apiGetFullConfig(page);
      expect(config.appSettings.language).toBe(locale);
    }
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) selected language persists across restart", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let firstApp: ElectronApplication | null = null;
  let secondApp: ElectronApplication | null = null;

  try {
    const firstLaunch = await launchIntegrationApp(userDataDir);
    firstApp = firstLaunch.app;
    const firstPage = firstLaunch.page;

    await connectGitRepo(firstPage);
    const i18nMeta = await apiGetI18nMeta(firstPage);
    const localeSwitchSequence = buildLocaleSwitchSequence(
      i18nMeta.supportedLocales,
      i18nMeta.fallbackLocale,
    );
    const targetLocale =
      localeSwitchSequence.find(
        (locale) => locale !== i18nMeta.fallbackLocale,
      ) || i18nMeta.fallbackLocale;
    await switchAppLanguageFromSettings(firstPage, targetLocale);
    await closeSettingsDialog(firstPage);

    const firstConfig = await apiGetFullConfig(firstPage);
    expect(firstConfig.appSettings.language).toBe(targetLocale);

    await closeAppIfOpen(firstApp);
    firstApp = null;

    const secondLaunch = await launchIntegrationApp(userDataDir);
    secondApp = secondLaunch.app;
    const secondPage = secondLaunch.page;

    await expect(
      secondPage.getByTestId("status-bar-settings-action"),
    ).toBeVisible();
    const secondBundle = await apiGetFrontendBundle(secondPage);
    expect(secondBundle.locale).toBe(targetLocale);
    await expect(
      secondPage.getByTestId("status-bar-branch-label"),
    ).toContainText(
      `${getBundleString(secondBundle, "statusBar.branchLabel")}:`,
    );

    await openSettingsDialog(secondPage);
    await expect(secondPage.getByTestId("settings-dialog-title")).toHaveText(
      getBundleString(secondBundle, "settingsDialog.title"),
    );
    await expect(
      secondPage.getByRole("tab", {
        name: getBundleString(secondBundle, "settingsDialog.tabs.appSettings"),
      }),
    ).toBeVisible();

    const secondConfig = await apiGetFullConfig(secondPage);
    expect(secondConfig.appSettings.language).toBe(targetLocale);
  } finally {
    await closeAppIfOpen(firstApp);
    await closeAppIfOpen(secondApp);
    await cleanupUserDataDir(userDataDir);
  }
});
