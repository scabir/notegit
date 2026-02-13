import {
  appendToCurrentEditor,
  cleanupUserDataDir,
  closeAppIfOpen,
  connectGitRepo,
  createIsolatedUserDataDir,
  createMarkdownFile,
  launchIntegrationApp,
  saveCurrentFile,
} from "../helpers/gitIntegration";
import { expect, test } from "@playwright/test";
import type { ElectronApplication, Page } from "@playwright/test";

const getModKey = () => (process.platform === "darwin" ? "Meta" : "Control");

const readEditorContent = async (page: Page): Promise<string> => {
  return await page.locator(".cm-content").first().innerText();
};

test("keyboard back/forward navigates between previously opened files", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createMarkdownFile(page, "nav-a.md");
    await appendToCurrentEditor(page, "\nAAA_NAV\n");
    await saveCurrentFile(page);

    await createMarkdownFile(page, "nav-b.md");
    await appendToCurrentEditor(page, "\nBBB_NAV\n");
    await saveCurrentFile(page);

    await page.getByTestId("status-bar-header-title").click();
    await page.keyboard.press(`${getModKey()}+ArrowLeft`);
    await expect
      .poll(async () => (await readEditorContent(page)).includes("AAA_NAV"))
      .toBe(true);

    await page.getByTestId("status-bar-header-title").click();
    await page.keyboard.press(`${getModKey()}+ArrowRight`);
    await expect
      .poll(async () => (await readEditorContent(page)).includes("BBB_NAV"))
      .toBe(true);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});
