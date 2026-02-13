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

test("(git) keyboard back/forward navigates between previously opened files", async ({
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

test("(git) navigation shortcuts are ignored while dialog input is focused", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createMarkdownFile(page, "nav-focus-a.md");
    await appendToCurrentEditor(page, "\nAAA_FOCUS_NAV\n");
    await saveCurrentFile(page);

    await createMarkdownFile(page, "nav-focus-b.md");
    await appendToCurrentEditor(page, "\nBBB_FOCUS_NAV\n");
    await saveCurrentFile(page);

    await page.locator(".tree-container").click({ button: "right" });
    await page.getByRole("menuitem", { name: "New File" }).click();
    const createDialog = page.getByTestId("create-file-dialog");
    await expect(createDialog).toBeVisible();
    await createDialog.getByLabel("File Name").click();

    await page.keyboard.press(`${getModKey()}+ArrowLeft`);
    await expect(
      createDialog.getByLabel("File Name"),
    ).toBeFocused();
    await expect
      .poll(async () => (await readEditorContent(page)).includes("BBB_FOCUS_NAV"))
      .toBe(true);

    await createDialog.getByRole("button", { name: "Cancel" }).click();
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) back navigation with a single entry is a no-op", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createMarkdownFile(page, "nav-single.md");
    await appendToCurrentEditor(page, "\nSINGLE_NAV_ENTRY\n");
    await saveCurrentFile(page);

    await page.getByTestId("status-bar-header-title").click();
    await page.keyboard.press(`${getModKey()}+ArrowLeft`);

    await expect
      .poll(async () => (await readEditorContent(page)).includes("SINGLE_NAV_ENTRY"))
      .toBe(true);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});
