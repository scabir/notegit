import { expect, test } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";
import {
  apiGetFullConfig,
  cleanupUserDataDir,
  closeAppIfOpen,
  closeSettingsDialog,
  connectS3Repo,
  createIsolatedUserDataDir,
  launchS3IntegrationApp,
  switchAppLanguageFromSettings,
} from "../helpers/gitIntegration";

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
    await expect(page.getByTestId("status-bar-branch-label")).toContainText(
      "Bucket:",
    );

    await switchAppLanguageFromSettings(page, "tr-TR");
    await expect(
      page.getByRole("tab", { name: "Uygulama Ayarları" }),
    ).toBeVisible();
    await closeSettingsDialog(page);
    await expect(page.getByTestId("status-bar-branch-label")).toContainText(
      "Kova:",
    );
    const trConfig = await apiGetFullConfig(page);
    expect(trConfig.appSettings.language).toBe("tr-TR");

    await switchAppLanguageFromSettings(page, "en-GB");
    await expect(page.getByRole("tab", { name: "App Settings" })).toBeVisible();
    await closeSettingsDialog(page);
    await expect(page.getByTestId("status-bar-branch-label")).toContainText(
      "Bucket:",
    );
    const enConfig = await apiGetFullConfig(page);
    expect(enConfig.appSettings.language).toBe("en-GB");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});
