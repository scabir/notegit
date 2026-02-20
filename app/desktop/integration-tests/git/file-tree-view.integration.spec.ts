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
  flattenTreePaths,
  launchIntegrationApp,
  listTree,
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
  expectClose: boolean = true,
): Promise<void> => {
  const treeContainer = page.locator(".tree-container");
  await treeContainer.click({ button: "right" });
  await page.getByRole("menuitem", { name: "New File" }).click();
  const createDialog = page.getByTestId("create-file-dialog");
  await expect(createDialog).toBeVisible();
  await createDialog.getByLabel("File Name").fill(inputName);
  await createDialog.getByRole("button", { name: "Create" }).click();
  if (expectClose) {
    await expect(createDialog).toHaveCount(0);
  }
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
};

const openNodeContextMenu = async (
  page: Page,
  nodeName: string,
): Promise<void> => {
  const node = page
    .locator(".tree-container")
    .getByText(nodeName, { exact: true })
    .first();
  await expect(node).toBeVisible();
  await node.click({ button: "right" });
  await expect(page.getByTestId("tree-context-menu")).toBeVisible();
};

test("(git) create folder and file inside then commit+push", async ({
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

test("(git) create file without extension auto-adds .md", async ({
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

test("(git) rename file then commit+push", async ({
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

test("(git) rename folder with child files then commit+push", async ({
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

test("(git) delete file then commit+push", async ({
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

test("(git) delete folder recursively then commit+push", async ({
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

test("(git) duplicate file then commit+push", async ({
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

test("(git) import external file then commit+push", async ({
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

test("(git) create file dialog rejects invalid file name characters", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createFileViaDialog(page, "bad:name", false);
    const createDialog = page.getByTestId("create-file-dialog");
    await expect(createDialog).toBeVisible();
    await expect(createDialog).toContainText("contains invalid characters");
    await expectTreeNotToContainPath(page, "bad:name");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) creating an existing folder path is idempotent", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createFolderViaEmptyTreeContextMenu(page, "dupe-parent");
    await openNodeContextMenu(page, "dupe-parent");
    await page.getByTestId("tree-context-node-new-folder").click();
    const firstCreateDialog = page.getByTestId("create-folder-dialog");
    await expect(firstCreateDialog).toBeVisible();
    await firstCreateDialog.getByLabel("Folder Name").fill("dupe-child");
    await firstCreateDialog.getByRole("button", { name: "Create" }).click();
    await expect(firstCreateDialog).toHaveCount(0);
    await expectTreeToContainPath(page, "dupe-parent/dupe-child");

    await openNodeContextMenu(page, "dupe-parent");
    await page.getByTestId("tree-context-node-new-folder").click();
    const createDialog = page.getByTestId("create-folder-dialog");
    await expect(createDialog).toBeVisible();
    await createDialog.getByLabel("Folder Name").fill("dupe-child");
    await createDialog.getByRole("button", { name: "Create" }).click();

    await expect(createDialog).toHaveCount(0);
    const allPaths = flattenTreePaths(await listTree(page));
    const duplicateCount = allPaths.filter(
      (entry) => entry === "dupe-parent/dupe-child",
    ).length;
    expect(duplicateCount).toBe(1);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) rename dialog rejects invalid name characters", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createMarkdownFile(page, "rename-target.md");
    await openNodeContextMenu(page, "rename-target.md");
    await page.getByTestId("tree-context-rename").click();

    const renameDialog = page.getByTestId("rename-dialog");
    await expect(renameDialog).toBeVisible();
    await renameDialog.getByLabel("New Name").fill("bad:name.md");
    await renameDialog.getByRole("button", { name: "Rename" }).click();

    await expect(renameDialog).toContainText("contains invalid characters");
    await expectTreeToContainPath(page, "rename-target.md");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) move file into folder using context menu dialog", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createFolderViaEmptyTreeContextMenu(page, "move-target");
    await expectTreeToContainPath(page, "move-target");
    await createMarkdownFile(page, "move-me.md");

    await openNodeContextMenu(page, "move-me.md");
    await page.getByTestId("tree-context-move").click();
    const moveDialog = page.getByRole("dialog", { name: "Move Item" });
    await expect(moveDialog).toBeVisible();
    await moveDialog.getByText("move-target", { exact: true }).click();
    await moveDialog.getByRole("button", { name: "Move Here" }).click();

    await expectTreeToContainPath(page, "move-target/move-me.md");
    await expectTreeNotToContainPath(page, "move-me.md");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) favorite can be added and removed from context menus", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectGitRepo(page);

    await createMarkdownFile(page, "favorite-note.md");

    await openNodeContextMenu(page, "favorite-note.md");
    await page.getByTestId("tree-context-favorite").click();
    const favoritesSection = page.getByTestId("favorites-section");
    await expect(favoritesSection).toBeVisible();
    await expect(favoritesSection.getByText("favorite-note.md")).toBeVisible();

    await favoritesSection
      .getByRole("button", { name: "favorite-note.md" })
      .click({ button: "right" });
    await expect(
      page.getByTestId("favorite-context-menu-remove"),
    ).toBeVisible();
    await page.getByTestId("favorite-context-menu-remove").click();
    await expect(page.getByTestId("favorites-section")).toHaveCount(0);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(git) right click on tree background creates folder in root", async ({
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
    await expectTreeToContainPath(page, "ctx-parent");

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
