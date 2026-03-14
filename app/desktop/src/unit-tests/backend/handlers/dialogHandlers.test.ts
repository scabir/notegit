import { registerDialogHandlers } from "../../../backend/handlers/dialogHandlers";
import { ApiErrorCode } from "../../../shared/types";
import { dialog, shell } from "electron";

jest.mock("electron", () => ({
  dialog: {
    showOpenDialog: jest.fn(),
    showSaveDialog: jest.fn(),
  },
  shell: {
    openPath: jest.fn(),
  },
  app: {
    getPath: jest.fn(() => "/tmp/NoteBranch-test"),
  },
}));

describe("dialogHandlers", () => {
  const createIpcMain = () => {
    const handlers: Record<string, (...args: any[]) => any> = {};
    const ipcMain = {
      handle: jest.fn((channel: string, handler: (...args: any[]) => any) => {
        handlers[channel] = handler;
      }),
    } as any;

    return { ipcMain, handlers };
  };

  it("returns open dialog result", async () => {
    (dialog.showOpenDialog as jest.Mock).mockResolvedValue({
      canceled: false,
      filePaths: ["/tmp/a"],
    });
    const { ipcMain, handlers } = createIpcMain();

    registerDialogHandlers(ipcMain);

    const result = await handlers["dialog:showOpenDialog"](null, {
      title: "Open",
    });

    expect(result.canceled).toBe(false);
    expect(dialog.showOpenDialog).toHaveBeenCalled();
  });

  it("returns fallback when open dialog fails", async () => {
    (dialog.showOpenDialog as jest.Mock).mockRejectedValue(new Error("boom"));
    const { ipcMain, handlers } = createIpcMain();

    registerDialogHandlers(ipcMain);

    const result = await handlers["dialog:showOpenDialog"](null, {
      title: "Open",
    });

    expect(result).toEqual({ canceled: true, filePaths: [] });
  });

  it("returns save dialog result", async () => {
    (dialog.showSaveDialog as jest.Mock).mockResolvedValue({
      canceled: false,
      filePath: "/tmp/out.md",
    });
    const { ipcMain, handlers } = createIpcMain();

    registerDialogHandlers(ipcMain);

    const result = await handlers["dialog:showSaveDialog"](null, {
      title: "Save",
    });

    expect(result.filePath).toBe("/tmp/out.md");
  });

  it("returns fallback when save dialog fails", async () => {
    (dialog.showSaveDialog as jest.Mock).mockRejectedValue(new Error("boom"));
    const { ipcMain, handlers } = createIpcMain();

    registerDialogHandlers(ipcMain);

    const result = await handlers["dialog:showSaveDialog"](null, {
      title: "Save",
    });

    expect(result).toEqual({ canceled: true, filePath: undefined });
  });

  it("opens folder path through shell", async () => {
    (shell.openPath as jest.Mock).mockResolvedValue("");
    const { ipcMain, handlers } = createIpcMain();

    registerDialogHandlers(ipcMain);

    const result = await handlers["dialog:openFolder"](null, "/tmp/NoteBranch");

    expect(result).toEqual({ ok: true });
    expect(shell.openPath).toHaveBeenCalledWith("/tmp/NoteBranch");
  });

  it("returns failure when shell openPath reports an error", async () => {
    (shell.openPath as jest.Mock).mockResolvedValue("cannot open");
    const { ipcMain, handlers } = createIpcMain();

    registerDialogHandlers(ipcMain);

    const result = await handlers["dialog:openFolder"](null, "/tmp/NoteBranch");

    expect(result.ok).toBe(false);
    expect(result.error?.message).toBe("cannot open");
  });

  it("localizes coded open-folder errors", async () => {
    (shell.openPath as jest.Mock).mockRejectedValue({
      code: ApiErrorCode.FS_NOT_FOUND,
      message: "File not found: /tmp/NoteBranch",
      details: {
        messageKey: "dialog.errors.failedOpenFolder",
      },
    });
    const translate = jest.fn(async () => "Localized open folder error");
    const { ipcMain, handlers } = createIpcMain();

    registerDialogHandlers(ipcMain, translate);

    const result = await handlers["dialog:openFolder"](null, "/tmp/NoteBranch");

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe(ApiErrorCode.FS_NOT_FOUND);
    expect(result.error?.message).toBe("Localized open folder error");
  });

  it("uses translated fallback when uncoded open-folder errors have no message", async () => {
    (shell.openPath as jest.Mock).mockRejectedValue({});
    const translate = jest.fn(async () => "Failed to open folder");
    const { ipcMain, handlers } = createIpcMain();

    registerDialogHandlers(ipcMain, translate);

    const result = await handlers["dialog:openFolder"](null, "/tmp/NoteBranch");

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe(ApiErrorCode.UNKNOWN_ERROR);
    expect(result.error?.message).toBe("Failed to open folder");
  });
});
