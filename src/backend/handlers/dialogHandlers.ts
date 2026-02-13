import { IpcMain, dialog, shell } from "electron";
import { ApiErrorCode, ApiResponse } from "../../shared/types";
import { logger } from "../utils/logger";

export function registerDialogHandlers(ipcMain: IpcMain) {
  ipcMain.handle("dialog:showOpenDialog", async (_event, options: any) => {
    try {
      const result = await dialog.showOpenDialog(options);
      return result;
    } catch (error: any) {
      logger.error("Failed to show open dialog", { error });
      return { canceled: true, filePaths: [] };
    }
  });

  ipcMain.handle("dialog:showSaveDialog", async (_event, options: any) => {
    try {
      const result = await dialog.showSaveDialog(options);
      return result;
    } catch (error: any) {
      logger.error("Failed to show save dialog", { error });
      return { canceled: true, filePath: undefined };
    }
  });

  ipcMain.handle(
    "dialog:openFolder",
    async (_event, folderPath: string): Promise<ApiResponse<void>> => {
      try {
        const openError = await shell.openPath(folderPath);
        if (openError) {
          logger.error("Failed to open folder path", {
            folderPath,
            openError,
          });
          return {
            ok: false,
            error: {
              code: ApiErrorCode.UNKNOWN_ERROR,
              message: openError,
            },
          };
        }
        return { ok: true };
      } catch (error: any) {
        logger.error("Failed to open folder path", { error, folderPath });
        return {
          ok: false,
          error: {
            code: error.code || ApiErrorCode.UNKNOWN_ERROR,
            message: error.message || "Failed to open folder",
            details: error,
          },
        };
      }
    },
  );
}
