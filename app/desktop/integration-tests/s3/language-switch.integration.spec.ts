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
  connectS3Repo,
  createIsolatedUserDataDir,
  getBundleString,
  launchS3IntegrationApp,
  switchAppLanguageFromSettings,
} from "../helpers/gitIntegration";

const expectS3LocaleApplied = async (page: Page, expectedLocale: string) => {
  const bundle = await apiGetFrontendBundle(page);
  expect(bundle.locale).toBe(expectedLocale);

  const bucketLabel = getBundleString(bundle, "statusBar.bucketLabel");
  await expect(page.getByTestId("status-bar-branch-label")).toContainText(
    `${bucketLabel}:`,
  );
  return bundle;
};

test("(S3) language switch localizes bucket label and settings UI across supported locales", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectS3Repo(page);
    await expectS3LocaleApplied(page, "en-GB");

    const i18nMeta = await apiGetI18nMeta(page);
    const switchSequence = buildLocaleSwitchSequence(
      i18nMeta.supportedLocales,
      i18nMeta.fallbackLocale,
    );

    for (const locale of switchSequence) {
      await switchAppLanguageFromSettings(page, locale);
      const bundle = await expectS3LocaleApplied(page, locale);
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
