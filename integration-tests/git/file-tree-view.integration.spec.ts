import {
  apiCreateFile,
  apiCreateFolder,
  apiDeletePath,
  apiDuplicateFile,
  apiImportFile,
  apiRenamePath,
  cleanupUserDataDir,
  closeAppIfOpen,
  commitAndPushAll,
  connectGitRepo,
  createIsolatedUserDataDir,
  createMarkdownFile,
  expectTreeNotToContainPath,
  expectTreeToContainPath,
  launchIntegrationApp,
  selectFileFromTree,
} from "../helpers/gitIntegration";
import { expect, test } from "@playwright/test";
import type { ElectronApplication, Page } from "@playwright/test";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

const createFileViaDialog = async (
  page: Page,
  inputName: string,
): Promise<void> => {
  const treeContainer = page.locator(".tree-container");
  await treeContainer.click({ button: "right" });
  await page.getByRole("menuitem", { name: "New File" }).click();
  const createDialog = page.getByTestId("create-file-dialog");
  await expect(createDialog).toBeVisible();
  await createDialog.getByLabel("File Name").fill(inputName);
  await createDialog.getByRole("button", { name: "Create" }).click();
  await expect(createDialog).toHaveCount(0);
};

const createFolderViaEmptyTreeContextMenu = async (
  page: Page,
  folderName: string,
): Promise<void> => {
  const treeContainer = page.locator(".tree-container");
  await expect(treeContainer).toBeVisible();

  await treeContainer.evaluate((element) => {
    element.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: 16,
        clientY: 16,
      }),
    );
  });

  await expect(page.getByTestId("tree-context-menu-empty")).toBeVisible();
  await page.getByTestId("tree-context-new-folder").click();

  const createDialog = page.getByTestId("create-folder-dialog");
  await expect(createDialog).toBeVisible();
  await createDialog.getByLabel("Folder Name").fill(folderName);
  await createDialog.getByRole("button", { name: "Create" }).click();
  await expect(createDialog).toHaveCount(0);
};

test("create folder and file inside then commit+push", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await apiCreateFolder(page, "", "notes");
    await apiCreateFile(page, "notes", "inside.md");
    await commitAndPushAll(page);
    await expectTreeToContainPath(page, "notes/inside.md");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("create file without extension auto-adds .md", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createFileViaDialog(page, "noext");
    await expectTreeToContainPath(page, "noext.md");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("rename file then commit+push", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await apiCreateFile(page, "", "old-name.md");
    await apiRenamePath(page, "old-name.md", "new-name.md");
    await commitAndPushAll(page);

    await expectTreeToContainPath(page, "new-name.md");
    await expectTreeNotToContainPath(page, "old-name.md");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("rename folder with child files then commit+push", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await apiCreateFolder(page, "", "docs");
    await apiCreateFile(page, "docs", "a.md");
    await apiRenamePath(page, "docs", "docs-renamed");
    await commitAndPushAll(page);

    await expectTreeToContainPath(page, "docs-renamed/a.md");
    await expectTreeNotToContainPath(page, "docs/a.md");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("delete file then commit+push", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await apiCreateFile(page, "", "delete-me.md");
    await commitAndPushAll(page);
    await apiDeletePath(page, "delete-me.md");
    await commitAndPushAll(page);
    await expectTreeNotToContainPath(page, "delete-me.md");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("delete folder recursively then commit+push", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await apiCreateFolder(page, "", "delete-folder");
    await apiCreateFile(page, "delete-folder", "x.md");
    await commitAndPushAll(page);
    await apiDeletePath(page, "delete-folder");
    await commitAndPushAll(page);
    await expectTreeNotToContainPath(page, "delete-folder");
    await expectTreeNotToContainPath(page, "delete-folder/x.md");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("duplicate file then commit+push", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await apiCreateFile(page, "", "dup.md");
    const duplicatedPath = await apiDuplicateFile(page, "dup.md");
    await commitAndPushAll(page);

    await expectTreeToContainPath(page, "dup.md");
    await expectTreeToContainPath(page, duplicatedPath);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("import external file then commit+push", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  const importTmpDir = await fs.mkdtemp(
    path.join(os.tmpdir(), `notegit-import-${Date.now()}-`),
  );
  const sourcePath = path.join(importTmpDir, "external.txt");
  let app: ElectronApplication | null = null;
  try {
    await fs.writeFile(sourcePath, "imported content");
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await apiImportFile(page, sourcePath, "imported.txt");
    await commitAndPushAll(page);
    await expectTreeToContainPath(page, "imported.txt");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
    await fs.rm(importTmpDir, { recursive: true, force: true });
  }
});

test("right click on tree background creates folder in root", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createFolderViaEmptyTreeContextMenu(page, "ctx-parent");
    await selectFileFromTree(page, "ctx-parent");
    await createMarkdownFile(page, "ctx-child.md");
    await selectFileFromTree(page, "ctx-child.md");

    await createFolderViaEmptyTreeContextMenu(page, "root-from-context");

    await expectTreeToContainPath(page, "root-from-context");
    await expectTreeNotToContainPath(page, "ctx-parent/root-from-context");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});
