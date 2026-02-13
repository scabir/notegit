import { IpcMain } from "electron";
import { LogsService } from "../services/LogsService";
import { ApiResponse } from "../../shared/types";
import { logger } from "../utils/logger";

export function registerLogsHandlers(
  ipcMain: IpcMain,
  logsService: LogsService,
): void {
  ipcMain.handle(
    "logs:getContent",
    async (_, logType: "combined" | "error"): Promise<ApiResponse<string>> => {
      try {
        const content = await logsService.getLogContent(logType);
        return { ok: true, data: content };
      } catch (error: any) {
        logger.error("Failed to get log content", { error });
        return {
          ok: false,
          error: {
            code: error.code || "UNKNOWN_ERROR",
            message: error.message || "Failed to get log content",
            details: error,
          },
        };
      }
    },
  );

  ipcMain.handle(
    "logs:export",
    async (
      _,
      logType: "combined" | "error",
      destPath: string,
    ): Promise<ApiResponse<void>> => {
      try {
        await logsService.exportLogs(logType, destPath);
        return { ok: true };
      } catch (error: any) {
        logger.error("Failed to export logs", { error });
        return {
          ok: false,
          error: {
            code: error.code || "UNKNOWN_ERROR",
            message: error.message || "Failed to export logs",
            details: error,
          },
        };
      }
    },
  );

  ipcMain.handle("logs:getFolder", async (): Promise<ApiResponse<string>> => {
    try {
      return { ok: true, data: logsService.getLogsDirectory() };
    } catch (error: any) {
      logger.error("Failed to get logs folder", { error });
      return {
        ok: false,
        error: {
          code: error.code || "UNKNOWN_ERROR",
          message: error.message || "Failed to get logs folder",
          details: error,
        },
      };
    }
  });
}
