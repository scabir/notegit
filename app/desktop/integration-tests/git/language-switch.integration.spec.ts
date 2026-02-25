import { expect, test } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";
import {
  apiGetFullConfig,
  cleanupUserDataDir,
  closeAppIfOpen,
  closeSettingsDialog,
  connectGitRepo,
  createIsolatedUserDataDir,
  launchIntegrationApp,
  openSettingsDialog,
  switchAppLanguageFromSettings,
} from "../helpers/gitIntegration";

test("(git) language switch updates UI text between English and Turkish", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectGitRepo(page);

    await openSettingsDialog(page);
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await closeSettingsDialog(page);

    await switchAppLanguageFromSettings(page, "tr-TR");
    await expect(
      page.getByRole("tab", { name: "Uygulama Ayarları" }),
    ).toBeVisible();
    await closeSettingsDialog(page);
    await expect(page.getByTestId("status-bar-branch-label")).toContainText(
      "Dal:",
    );
    const trConfig = await apiGetFullConfig(page);
    expect(trConfig.appSettings.language).toBe("tr-TR");

    await switchAppLanguageFromSettings(page, "en-GB");
    await expect(page.getByRole("tab", { name: "App Settings" })).toBeVisible();
    await closeSettingsDialog(page);
    await expect(page.getByTestId("status-bar-branch-label")).toContainText(
      "Branch:",
    );
    const enConfig = await apiGetFullConfig(page);
    expect(enConfig.appSettings.language).toBe("en-GB");
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
    await switchAppLanguageFromSettings(firstPage, "tr-TR");
    await closeSettingsDialog(firstPage);

    const firstConfig = await apiGetFullConfig(firstPage);
    expect(firstConfig.appSettings.language).toBe("tr-TR");

    await closeAppIfOpen(firstApp);
    firstApp = null;

    const secondLaunch = await launchIntegrationApp(userDataDir);
    secondApp = secondLaunch.app;
    const secondPage = secondLaunch.page;

    await expect(
      secondPage.getByTestId("status-bar-settings-action"),
    ).toBeVisible();
    await expect(
      secondPage.getByTestId("status-bar-branch-label"),
    ).toContainText("Dal:");

    await openSettingsDialog(secondPage);
    await expect(
      secondPage.getByRole("heading", { name: "Ayarlar" }),
    ).toBeVisible();
    await expect(
      secondPage.getByRole("tab", { name: "Uygulama Ayarları" }),
    ).toBeVisible();

    const secondConfig = await apiGetFullConfig(secondPage);
    expect(secondConfig.appSettings.language).toBe("tr-TR");
  } finally {
    await closeAppIfOpen(firstApp);
    await closeAppIfOpen(secondApp);
    await cleanupUserDataDir(userDataDir);
  }
});
