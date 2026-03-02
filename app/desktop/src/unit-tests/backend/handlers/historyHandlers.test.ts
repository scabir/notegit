import { registerHistoryHandlers } from "../../../backend/handlers/historyHandlers";
import { ApiErrorCode } from "../../../shared/types";

describe("historyHandlers", () => {
  const createIpcMain = () => {
    const handlers: Record<string, (...args: any[]) => any> = {};
    const ipcMain = {
      handle: jest.fn((channel: string, handler: (...args: any[]) => any) => {
        handlers[channel] = handler;
      }),
    } as any;

    return { ipcMain, handlers };
  };

  it("returns file history", async () => {
    const historyService = {
      getForFile: jest.fn().mockResolvedValue([{ hash: "abc" }]),
      getVersion: jest.fn(),
      getDiff: jest.fn(),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerHistoryHandlers(ipcMain, historyService);

    const response = await handlers["history:getForFile"](null, "notes/a.md");

    expect(response.ok).toBe(true);
    expect(response.data).toEqual([{ hash: "abc" }]);
  });

  it("returns version content", async () => {
    const historyService = {
      getForFile: jest.fn(),
      getVersion: jest.fn().mockResolvedValue("content"),
      getDiff: jest.fn(),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerHistoryHandlers(ipcMain, historyService);

    const response = await handlers["history:getVersion"](
      null,
      "hash",
      "notes/a.md",
    );

    expect(response.ok).toBe(true);
    expect(response.data).toBe("content");
  });

  it("returns diff hunks", async () => {
    const historyService = {
      getForFile: jest.fn(),
      getVersion: jest.fn(),
      getDiff: jest.fn().mockResolvedValue([{ header: "@@" }]),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerHistoryHandlers(ipcMain, historyService);

    const response = await handlers["history:getDiff"](
      null,
      "a",
      "b",
      "notes/a.md",
    );

    expect(response.ok).toBe(true);
    expect(response.data).toEqual([{ header: "@@" }]);
  });

  it("returns error when history fails", async () => {
    const historyService = {
      getForFile: jest.fn().mockRejectedValue(new Error("fail")),
      getVersion: jest.fn(),
      getDiff: jest.fn(),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerHistoryHandlers(ipcMain, historyService);

    const response = await handlers["history:getForFile"](null, "notes/a.md");

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe("fail");
  });

  it("returns error when version lookup fails", async () => {
    const historyService = {
      getForFile: jest.fn(),
      getVersion: jest.fn().mockRejectedValue(new Error("version fail")),
      getDiff: jest.fn(),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerHistoryHandlers(ipcMain, historyService);

    const response = await handlers["history:getVersion"](
      null,
      "hash",
      "notes/a.md",
    );

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe("version fail");
  });

  it("returns error when diff lookup fails", async () => {
    const historyService = {
      getForFile: jest.fn(),
      getVersion: jest.fn(),
      getDiff: jest.fn().mockRejectedValue(new Error("diff fail")),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerHistoryHandlers(ipcMain, historyService);

    const response = await handlers["history:getDiff"](
      null,
      "a",
      "b",
      "notes/a.md",
    );

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe("diff fail");
  });

  it("localizes coded errors for history operations", async () => {
    const codedError = {
      code: ApiErrorCode.REPO_NOT_INITIALIZED,
      message: "Repository not initialized",
      details: {
        messageKey: "history.errors.failedGetDiff",
      },
    };
    const historyService = {
      getForFile: jest.fn().mockRejectedValueOnce(codedError),
      getVersion: jest.fn().mockRejectedValueOnce(codedError),
      getDiff: jest.fn().mockRejectedValueOnce(codedError),
    } as any;
    const translate = jest.fn(async () => "Localized history error");

    const { ipcMain, handlers } = createIpcMain();
    registerHistoryHandlers(ipcMain, historyService, translate);

    const historyResponse = await handlers["history:getForFile"](
      null,
      "notes/a.md",
    );
    const versionResponse = await handlers["history:getVersion"](
      null,
      "hash",
      "notes/a.md",
    );
    const diffResponse = await handlers["history:getDiff"](
      null,
      "a",
      "b",
      "notes/a.md",
    );

    expect(historyResponse.error?.message).toBe("Localized history error");
    expect(versionResponse.error?.message).toBe("Localized history error");
    expect(diffResponse.error?.message).toBe("Localized history error");
  });

  it("uses translated fallbacks when uncoded errors have no message", async () => {
    const historyService = {
      getForFile: jest.fn().mockRejectedValueOnce({}),
      getVersion: jest.fn().mockRejectedValueOnce({}),
      getDiff: jest.fn().mockRejectedValueOnce({}),
    } as any;
    const translate = jest
      .fn()
      .mockResolvedValueOnce("Failed to get file history")
      .mockResolvedValueOnce("Failed to get file version")
      .mockResolvedValueOnce("Failed to get diff");

    const { ipcMain, handlers } = createIpcMain();
    registerHistoryHandlers(ipcMain, historyService, translate);

    const historyResponse = await handlers["history:getForFile"](
      null,
      "notes/a.md",
    );
    const versionResponse = await handlers["history:getVersion"](
      null,
      "hash",
      "notes/a.md",
    );
    const diffResponse = await handlers["history:getDiff"](
      null,
      "a",
      "b",
      "notes/a.md",
    );

    expect(historyResponse.error?.message).toBe("Failed to get file history");
    expect(versionResponse.error?.message).toBe("Failed to get file version");
    expect(diffResponse.error?.message).toBe("Failed to get diff");
  });
});
