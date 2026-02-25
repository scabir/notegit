import { expect, test } from "@playwright/test";
import type { ElectronApplication, Page } from "@playwright/test";
import {
  apiGetFrontendBundle,
  apiGetFullConfig,
  cleanupUserDataDir,
  closeAppIfOpen,
  closeSettingsDialog,
  connectS3Repo,
  createIsolatedUserDataDir,
  getBundleString,
  launchS3IntegrationApp,
  switchAppLanguageFromSettings,
} from "../helpers/gitIntegration";

const SWITCH_SEQUENCE = ["tr-TR", "es-ES", "en-GB"] as const;

const expectS3LocaleApplied = async (page: Page, expectedLocale: string) => {
  const bundle = await apiGetFrontendBundle(page);
  expect(bundle.locale).toBe(expectedLocale);

  const bucketLabel = getBundleString(bundle, "statusBar.bucketLabel");
  await expect(page.getByTestId("status-bar-branch-label")).toContainText(
    `${bucketLabel}:`,
  );
  return bundle;
};

test("(S3) language switch localizes bucket label and settings UI", async ({
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

    for (const locale of SWITCH_SEQUENCE) {
      await switchAppLanguageFromSettings(page, locale);
      const bundle = await expectS3LocaleApplied(page, locale);
      await expect(
        page.getByRole("heading", {
          name: getBundleString(bundle, "settingsDialog.title"),
        }),
      ).toBeVisible();
      await closeSettingsDialog(page);

      const config = await apiGetFullConfig(page);
      expect(config.appSettings.language).toBe(locale);
    }
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});
