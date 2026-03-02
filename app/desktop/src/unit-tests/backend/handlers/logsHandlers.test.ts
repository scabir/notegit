import { registerLogsHandlers } from "../../../backend/handlers/logsHandlers";
import { ApiErrorCode } from "../../../shared/types";

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

  it("localizes special log info messages", async () => {
    const logsService = {
      getLogContent: jest
        .fn()
        .mockResolvedValueOnce("No combined logs yet.")
        .mockResolvedValueOnce("Log file is empty."),
      exportLogs: jest.fn(),
      getLogsDirectory: jest.fn().mockReturnValue("/logs"),
    } as any;
    const translate = jest
      .fn()
      .mockResolvedValueOnce("No combined logs yet.")
      .mockResolvedValueOnce("The log file is empty.");

    const { ipcMain, handlers } = createIpcMain();
    registerLogsHandlers(ipcMain, logsService, translate);

    const noLogsResponse = await handlers["logs:getContent"](null, "combined");
    const emptyResponse = await handlers["logs:getContent"](null, "combined");

    expect(noLogsResponse.data).toBe("No combined logs yet.");
    expect(emptyResponse.data).toBe("The log file is empty.");
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

  it("localizes coded errors for export, fetch, and folder access", async () => {
    const codedError = {
      code: ApiErrorCode.FS_NOT_FOUND,
      message: "Log file not found: combined",
      details: {
        messageKey: "logs.errors.logFileNotFound",
      },
    };
    const logsService = {
      getLogContent: jest.fn().mockRejectedValueOnce(codedError),
      exportLogs: jest.fn().mockRejectedValueOnce(codedError),
      getLogsDirectory: jest.fn().mockImplementationOnce(() => {
        throw codedError;
      }),
    } as any;
    const translate = jest.fn(async () => "Localized log error");

    const { ipcMain, handlers } = createIpcMain();
    registerLogsHandlers(ipcMain, logsService, translate);

    const contentResponse = await handlers["logs:getContent"](null, "combined");
    const exportResponse = await handlers["logs:export"](
      null,
      "combined",
      "/tmp/out.log",
    );
    const folderResponse = await handlers["logs:getFolder"]();

    expect(contentResponse.error?.message).toBe("Localized log error");
    expect(exportResponse.error?.message).toBe("Localized log error");
    expect(folderResponse.error?.message).toBe("Localized log error");
  });

  it("uses translated fallbacks for uncoded errors without messages", async () => {
    const logsService = {
      getLogContent: jest.fn().mockRejectedValueOnce({}),
      exportLogs: jest.fn().mockRejectedValueOnce({}),
      getLogsDirectory: jest.fn().mockImplementationOnce(() => {
        throw {};
      }),
    } as any;
    const translate = jest
      .fn()
      .mockResolvedValueOnce("Failed to get log content")
      .mockResolvedValueOnce("Failed to export logs")
      .mockResolvedValueOnce("Failed to get logs folder");

    const { ipcMain, handlers } = createIpcMain();
    registerLogsHandlers(ipcMain, logsService, translate);

    const contentResponse = await handlers["logs:getContent"](null, "combined");
    const exportResponse = await handlers["logs:export"](
      null,
      "combined",
      "/tmp/out.log",
    );
    const folderResponse = await handlers["logs:getFolder"]();

    expect(contentResponse.error?.message).toBe("Failed to get log content");
    expect(exportResponse.error?.message).toBe("Failed to export logs");
    expect(folderResponse.error?.message).toBe("Failed to get logs folder");
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
