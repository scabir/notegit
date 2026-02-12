import { registerLogsHandlers } from "../../../backend/handlers/logsHandlers";

describe("logsHandlers", () => {
  const createIpcMain = () => {
    const handlers: Record<string, (...args: any[]) => any> = {};
    const ipcMain = {
      handle: jest.fn((channel: string, handler: (...args: any[]) => any) => {
        handlers[channel] = handler;
      }),
    } as any;

    return { ipcMain, handlers };
  };

  it("returns log content", async () => {
    const logsService = {
      getLogContent: jest.fn().mockResolvedValue("content"),
      exportLogs: jest.fn(),
      getLogsDirectory: jest.fn().mockReturnValue("/logs"),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerLogsHandlers(ipcMain, logsService);

    const response = await handlers["logs:getContent"](null, "combined");

    expect(response.ok).toBe(true);
    expect(response.data).toBe("content");
  });

  it("exports logs", async () => {
    const logsService = {
      getLogContent: jest.fn(),
      exportLogs: jest.fn().mockResolvedValue(undefined),
      getLogsDirectory: jest.fn().mockReturnValue("/logs"),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerLogsHandlers(ipcMain, logsService);

    const response = await handlers["logs:export"](
      null,
      "error",
      "/tmp/out.log",
    );

    expect(response.ok).toBe(true);
    expect(logsService.exportLogs).toHaveBeenCalledWith(
      "error",
      "/tmp/out.log",
    );
  });

  it("returns error when export fails", async () => {
    const logsService = {
      getLogContent: jest.fn(),
      exportLogs: jest.fn().mockRejectedValue(new Error("failed")),
      getLogsDirectory: jest.fn().mockReturnValue("/logs"),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerLogsHandlers(ipcMain, logsService);

    const response = await handlers["logs:export"](
      null,
      "error",
      "/tmp/out.log",
    );

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe("failed");
  });

  it("returns error when log fetch fails", async () => {
    const logsService = {
      getLogContent: jest.fn().mockRejectedValue(new Error("fail")),
      exportLogs: jest.fn(),
      getLogsDirectory: jest.fn().mockReturnValue("/logs"),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerLogsHandlers(ipcMain, logsService);

    const response = await handlers["logs:getContent"](null, "combined");

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe("fail");
  });

  it("returns logs folder", async () => {
    const logsService = {
      getLogContent: jest.fn(),
      exportLogs: jest.fn(),
      getLogsDirectory: jest.fn().mockReturnValue("/logs"),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerLogsHandlers(ipcMain, logsService);

    const response = await handlers["logs:getFolder"]();

    expect(response.ok).toBe(true);
    expect(response.data).toBe("/logs");
  });

  it("returns error when logs folder lookup fails", async () => {
    const logsService = {
      getLogContent: jest.fn(),
      exportLogs: jest.fn(),
      getLogsDirectory: jest.fn().mockImplementation(() => {
        throw new Error("folder missing");
      }),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerLogsHandlers(ipcMain, logsService);

    const response = await handlers["logs:getFolder"]();

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe("folder missing");
  });
});
