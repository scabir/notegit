import { registerExportHandlers } from "../../../backend/handlers/exportHandlers";
import { ApiErrorCode } from "../../../shared/types";

describe("exportHandlers", () => {
  const createIpcMain = () => {
    const handlers: Record<string, (...args: any[]) => any> = {};
    const ipcMain = {
      handle: jest.fn((channel: string, handler: (...args: any[]) => any) => {
        handlers[channel] = handler;
      }),
    } as any;

    return { ipcMain, handlers };
  };

  it("exports note successfully", async () => {
    const exportService = {
      exportNote: jest.fn().mockResolvedValue("/tmp/note.md"),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerExportHandlers(ipcMain, exportService);

    const response = await handlers["export:note"](
      null,
      "note.md",
      "content",
      "md",
    );

    expect(response.ok).toBe(true);
    expect(response.data).toBe("/tmp/note.md");
  });

  it("returns cancelled error for note export cancellation", async () => {
    const exportService = {
      exportNote: jest.fn().mockRejectedValue(new Error("cancelled by user")),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerExportHandlers(ipcMain, exportService);

    const response = await handlers["export:note"](
      null,
      "note.md",
      "content",
      "md",
    );

    expect(response.ok).toBe(false);
    expect(response.error?.code).toBe(ApiErrorCode.VALIDATION_ERROR);
  });

  it("returns error for note export failures", async () => {
    const exportService = {
      exportNote: jest.fn().mockRejectedValue(new Error("disk full")),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerExportHandlers(ipcMain, exportService);

    const response = await handlers["export:note"](
      null,
      "note.md",
      "content",
      "md",
    );

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe("disk full");
  });

  it("exports repo zip successfully", async () => {
    const exportService = {
      exportRepoAsZip: jest.fn().mockResolvedValue("/tmp/repo.zip"),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerExportHandlers(ipcMain, exportService);

    const response = await handlers["export:repoZip"](null);

    expect(response.ok).toBe(true);
    expect(response.data).toBe("/tmp/repo.zip");
  });

  it("returns cancelled error for repo export cancellation", async () => {
    const exportService = {
      exportRepoAsZip: jest
        .fn()
        .mockRejectedValue(new Error("cancelled by user")),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerExportHandlers(ipcMain, exportService);

    const response = await handlers["export:repoZip"](null);

    expect(response.ok).toBe(false);
    expect(response.error?.code).toBe(ApiErrorCode.VALIDATION_ERROR);
  });

  it("returns error for repo export failures", async () => {
    const exportService = {
      exportRepoAsZip: jest.fn().mockRejectedValue(new Error("no space")),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerExportHandlers(ipcMain, exportService);

    const response = await handlers["export:repoZip"](null);

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe("no space");
  });
});
