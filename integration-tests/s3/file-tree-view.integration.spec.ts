import {
  apiCreateFile,
  apiCreateFolder,
  apiRenamePath,
  cleanupUserDataDir,
  closeAppIfOpen,
  connectS3Repo,
  createIsolatedUserDataDir,
  createMarkdownFile,
  expectTreeNotToContainPath,
  expectTreeToContainPath,
  flattenTreePaths,
  launchS3IntegrationApp,
  listTree,
  syncAll,
} from "../helpers/gitIntegration";
import { expect, test } from "@playwright/test";
import type { ElectronApplication, Page } from "@playwright/test";

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
  await expect(createDialog).toHaveCount(0);
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

test("(S3) create folder and file inside then sync", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

    await apiCreateFolder(page, "", "notes");
    await apiCreateFile(page, "notes", "inside.md");
    await syncAll(page);
    await expectTreeToContainPath(page, "notes/inside.md");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) create file without extension auto-adds .md", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

    await createFileViaDialog(page, "noext");
    await expectTreeToContainPath(page, "noext.md");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) rename file then sync", async ({ request: _request }, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

    await apiCreateFile(page, "", "old-name.md");
    await apiRenamePath(page, "old-name.md", "new-name.md");
    await syncAll(page);

    await expectTreeToContainPath(page, "new-name.md");
    await expectTreeNotToContainPath(page, "old-name.md");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) rename folder with child files then sync", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

    await apiCreateFolder(page, "", "docs");
    await apiCreateFile(page, "docs", "a.md");
    await apiRenamePath(page, "docs", "docs-renamed");
    await syncAll(page);

    await expectTreeToContainPath(page, "docs-renamed/a.md");
    await expectTreeNotToContainPath(page, "docs/a.md");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) create file dialog rejects invalid file name characters", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

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

test("(S3) creating an existing folder path is idempotent", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

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

test("(S3) rename dialog rejects invalid name characters", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

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

test("(S3) move file into folder using context menu dialog", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

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

test("(S3) favorite can be added and removed from context menus", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

    await createMarkdownFile(page, "favorite-note.md");

    await openNodeContextMenu(page, "favorite-note.md");
    await page.getByTestId("tree-context-favorite").click();
    const favoritesSection = page.getByTestId("favorites-section");
    await expect(favoritesSection).toBeVisible();
    await expect(favoritesSection.getByText("favorite-note.md")).toBeVisible();

    await favoritesSection
      .getByRole("button", { name: "favorite-note.md" })
      .click({ button: "right" });
    await expect(page.getByTestId("favorite-context-menu-remove")).toBeVisible();
    await page.getByTestId("favorite-context-menu-remove").click();
    await expect(page.getByTestId("favorites-section")).toHaveCount(0);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) right click on tree background creates folder in root", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

    await createFolderViaEmptyTreeContextMenu(page, "ctx-parent");
    await expectTreeToContainPath(page, "ctx-parent");
    await apiCreateFile(page, "ctx-parent", "ctx-child.md");

    await page
      .locator(".tree-container")
      .getByText("ctx-parent", { exact: true })
      .first()
      .click();

    await createFolderViaEmptyTreeContextMenu(page, "root-from-context");

    await expectTreeToContainPath(page, "root-from-context");
    await expectTreeNotToContainPath(page, "ctx-parent/root-from-context");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) naming normalization replaces spaces with dashes on create", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

    await createFileViaDialog(page, "space file");
    await expectTreeToContainPath(page, "space-file.md");
    await expectTreeNotToContainPath(page, "space file.md");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});

test("(S3) naming normalization applies on rename", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;
  try {
    const launched = await launchS3IntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;
    await connectS3Repo(page);

    await createMarkdownFile(page, "rename-space.md");
    await openNodeContextMenu(page, "rename-space.md");
    await page.getByTestId("tree-context-rename").click();

    const renameDialog = page.getByTestId("rename-dialog");
    await expect(renameDialog).toBeVisible();
    await renameDialog.getByLabel("New Name").fill("renamed file.md");
    await renameDialog.getByRole("button", { name: "Rename" }).click();

    await expectTreeToContainPath(page, "renamed-file.md");
    await expectTreeNotToContainPath(page, "renamed file.md");
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});
