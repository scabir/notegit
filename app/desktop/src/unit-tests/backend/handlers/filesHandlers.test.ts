import { registerFilesHandlers } from "../../../backend/handlers/filesHandlers";
import { REPO_PROVIDERS } from "../../../shared/types";

describe("filesHandlers", () => {
  const createIpcMain = () => {
    const handlers: Record<string, (...args: any[]) => any> = {};
    const ipcMain = {
      handle: jest.fn((channel: string, handler: (...args: any[]) => any) => {
        handlers[channel] = handler;
      }),
    } as any;

    return { ipcMain, handlers };
  };

  it("returns ok for delete even when s3 queueing fails", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      deletePath: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {
      queueS3Delete: jest.fn().mockRejectedValue(new Error("offline")),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers["files:delete"](null, "note.md");

    expect(response.ok).toBe(true);
    expect(filesService.deletePath).toHaveBeenCalledWith("note.md");
    expect(repoService.queueS3Delete).toHaveBeenCalledWith("note.md");
  });

  it("returns ok for rename even when s3 queueing fails", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      renamePath: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {
      queueS3Move: jest.fn().mockRejectedValue(new Error("offline")),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers["files:rename"](null, "old.md", "new.md");

    expect(response.ok).toBe(true);
    expect(filesService.renamePath).toHaveBeenCalledWith("old.md", "new.md");
    expect(repoService.queueS3Move).toHaveBeenCalledWith("old.md", "new.md");
  });

  it("returns ok for save even when s3 queueing fails", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      saveFile: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {
      queueS3Upload: jest.fn().mockRejectedValue(new Error("offline")),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers["files:save"](null, "note.md", "# content");

    expect(response.ok).toBe(true);
    expect(filesService.saveFile).toHaveBeenCalledWith("note.md", "# content");
    expect(repoService.queueS3Upload).toHaveBeenCalledWith("note.md");
  });

  it("returns ok for saveWithGitWorkflow", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      saveWithGitWorkflow: jest.fn().mockResolvedValue({ pullFailed: true }),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers["files:saveWithGitWorkflow"](
      null,
      "note.md",
      "body",
      true,
    );

    expect(response.ok).toBe(true);
    expect(response.data).toEqual({ pullFailed: true });
    expect(filesService.saveWithGitWorkflow).toHaveBeenCalledWith(
      "note.md",
      "body",
      true,
    );
  });

  it("returns error for saveWithGitWorkflow failures", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      saveWithGitWorkflow: jest.fn().mockRejectedValue(new Error("fail")),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers["files:saveWithGitWorkflow"](
      null,
      "note.md",
      "body",
      false,
    );

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe("fail");
  });

  it("returns ok for commit", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitFile: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers["files:commit"](null, "note.md", "message");

    expect(response.ok).toBe(true);
    expect(filesService.commitFile).toHaveBeenCalledWith("note.md", "message");
  });

  it("returns error for commit failures", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitFile: jest.fn().mockRejectedValue(new Error("commit failed")),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers["files:commit"](null, "note.md", "message");

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe("commit failed");
  });

  it("returns ok for commitAll", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitAll: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers["files:commitAll"](null, "message");

    expect(response.ok).toBe(true);
    expect(filesService.commitAll).toHaveBeenCalledWith("message");
  });

  it("returns error for commitAll failures", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitAll: jest.fn().mockRejectedValue(new Error("commit all failed")),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers["files:commitAll"](null, "message");

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe("commit all failed");
  });

  it("returns synced message for s3 commitAndPushAll", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitAll: jest.fn(),
      getGitStatus: jest.fn(),
    } as any;
    const repoService = {
      getStatus: jest.fn().mockResolvedValue({
        provider: REPO_PROVIDERS.s3,
        hasUncommitted: true,
      }),
      push: jest.fn().mockResolvedValue(undefined),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers["files:commitAndPushAll"](null);

    expect(response.ok).toBe(true);
    expect(response.data?.message).toBe("Synced successfully");
    expect(repoService.push).toHaveBeenCalled();
    expect(filesService.commitAll).not.toHaveBeenCalled();
  });

  it("returns error for local commitAndPushAll", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitAll: jest.fn(),
      getGitStatus: jest.fn(),
    } as any;
    const repoService = {
      getStatus: jest.fn().mockResolvedValue({
        provider: REPO_PROVIDERS.local,
        hasUncommitted: true,
      }),
      push: jest.fn(),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers["files:commitAndPushAll"](null);

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe(
      "Local repositories do not support sync",
    );
    expect(repoService.push).not.toHaveBeenCalled();
    expect(filesService.commitAll).not.toHaveBeenCalled();
  });

  it("returns nothing-to-commit message when clean", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitAll: jest.fn(),
      getGitStatus: jest.fn(),
    } as any;
    const repoService = {
      getStatus: jest.fn().mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        hasUncommitted: false,
      }),
      push: jest.fn(),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers["files:commitAndPushAll"](null);

    expect(response.ok).toBe(true);
    expect(response.data?.message).toBe("Nothing to commit");
    expect(filesService.commitAll).not.toHaveBeenCalled();
    expect(repoService.push).not.toHaveBeenCalled();
  });

  it("commits and pushes with summary message when changes exist", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitAll: jest.fn().mockResolvedValue(undefined),
      getGitStatus: jest.fn().mockResolvedValue({
        modified: ["a.md"],
        added: ["b.md"],
        deleted: [],
      }),
    } as any;
    const repoService = {
      getStatus: jest.fn().mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        hasUncommitted: true,
      }),
      push: jest.fn().mockResolvedValue(undefined),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers["files:commitAndPushAll"](null);

    expect(filesService.commitAll).toHaveBeenCalledWith("Update: a.md, b.md");
    expect(repoService.push).toHaveBeenCalled();
    expect(response.data?.message).toBe(
      "Changes committed and pushed successfully",
    );
  });

  it("returns error for commitAndPushAll failures", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitAll: jest.fn(),
      getGitStatus: jest.fn(),
    } as any;
    const repoService = {
      getStatus: jest.fn().mockRejectedValue(new Error("status failed")),
      push: jest.fn(),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers["files:commitAndPushAll"](null);

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe("status failed");
  });

  it("returns file tree from listTree", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      listTree: jest.fn().mockResolvedValue([{ id: "root" }]),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers["files:listTree"]();

    expect(response.ok).toBe(true);
    expect(response.data).toHaveLength(1);
  });

  it("returns error when listTree fails", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      listTree: jest.fn().mockRejectedValue(new Error("list fail")),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers["files:listTree"]();

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe("list fail");
  });

  it("reads files and handles read errors", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      readFile: jest.fn().mockResolvedValue({
        path: "note.md",
        content: "hi",
        type: "markdown",
      }),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const okResponse = await handlers["files:read"](null, "note.md");
    expect(okResponse.ok).toBe(true);
    expect(okResponse.data?.path).toBe("note.md");

    filesService.readFile.mockRejectedValueOnce(new Error("read fail"));
    const errResponse = await handlers["files:read"](null, "note.md");
    expect(errResponse.ok).toBe(false);
    expect(errResponse.error?.message).toBe("read fail");
  });

  it("creates files and folders and returns errors", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      createFile: jest.fn().mockResolvedValue(undefined),
      createFolder: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const createResponse = await handlers["files:create"](null, "", "note.md");
    const folderResponse = await handlers["files:createFolder"](
      null,
      "",
      "docs",
    );

    expect(createResponse.ok).toBe(true);
    expect(folderResponse.ok).toBe(true);

    filesService.createFile.mockRejectedValueOnce(new Error("create fail"));
    const createError = await handlers["files:create"](null, "", "note.md");
    expect(createError.ok).toBe(false);
    expect(createError.error?.message).toBe("create fail");
  });

  it("returns error when save fails", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      saveFile: jest.fn().mockRejectedValue(new Error("save fail")),
    } as any;
    const repoService = {
      queueS3Upload: jest.fn(),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers["files:save"](null, "note.md", "body");

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe("save fail");
  });

  it("returns error when delete or rename fails", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      deletePath: jest.fn().mockRejectedValue(new Error("delete fail")),
      renamePath: jest.fn().mockRejectedValue(new Error("rename fail")),
    } as any;
    const repoService = {
      queueS3Delete: jest.fn(),
      queueS3Move: jest.fn(),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const deleteResponse = await handlers["files:delete"](null, "note.md");
    const renameResponse = await handlers["files:rename"](
      null,
      "note.md",
      "new.md",
    );

    expect(deleteResponse.ok).toBe(false);
    expect(deleteResponse.error?.message).toBe("delete fail");
    expect(renameResponse.ok).toBe(false);
    expect(renameResponse.error?.message).toBe("rename fail");
  });

  it("handles saveAs and import success/error", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      saveFileAs: jest.fn().mockResolvedValue(undefined),
      importFile: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const saveAsResponse = await handlers["files:saveAs"](
      null,
      "/repo",
      "/tmp/out.md",
    );
    const importResponse = await handlers["files:import"](
      null,
      "/tmp/in.md",
      "in.md",
    );

    expect(saveAsResponse.ok).toBe(true);
    expect(importResponse.ok).toBe(true);

    filesService.saveFileAs.mockRejectedValueOnce(new Error("saveAs fail"));
    filesService.importFile.mockRejectedValueOnce(new Error("import fail"));

    const saveAsError = await handlers["files:saveAs"](
      null,
      "/repo",
      "/tmp/out.md",
    );
    const importError = await handlers["files:import"](
      null,
      "/tmp/in.md",
      "in.md",
    );

    expect(saveAsError.ok).toBe(false);
    expect(saveAsError.error?.message).toBe("saveAs fail");
    expect(importError.ok).toBe(false);
    expect(importError.error?.message).toBe("import fail");
  });

  it("duplicates files", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      saveFileAs: jest.fn(),
      importFile: jest.fn(),
      duplicateFile: jest.fn().mockResolvedValue("note(1).md"),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const duplicateResponse = await handlers["files:duplicate"](
      null,
      "note.md",
    );
    expect(filesService.duplicateFile).toHaveBeenCalledWith("note.md");
    expect(duplicateResponse.ok).toBe(true);
    expect(duplicateResponse.data).toBe("note(1).md");
  });

  it("adds extra file count to commit message when more than five changes", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitAll: jest.fn().mockResolvedValue(undefined),
      getGitStatus: jest.fn().mockResolvedValue({
        modified: ["a.md", "b.md", "c.md", "d.md", "e.md", "f.md"],
        added: [],
        deleted: [],
      }),
    } as any;
    const repoService = {
      getStatus: jest.fn().mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        hasUncommitted: true,
      }),
      push: jest.fn().mockResolvedValue(undefined),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    await handlers["files:commitAndPushAll"](null);

    expect(filesService.commitAll).toHaveBeenCalledWith(
      "Update: a.md, b.md, c.md, d.md, e.md and 1 more",
    );
  });

  it("uses fallback message when no changed files are listed", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitAll: jest.fn().mockResolvedValue(undefined),
      getGitStatus: jest.fn().mockResolvedValue({
        modified: [],
        added: [],
        deleted: [],
      }),
    } as any;
    const repoService = {
      getStatus: jest.fn().mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        hasUncommitted: true,
      }),
      push: jest.fn().mockResolvedValue(undefined),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    await handlers["files:commitAndPushAll"](null);

    expect(filesService.commitAll).toHaveBeenCalledWith(
      "Update: multiple files",
    );
  });
});
