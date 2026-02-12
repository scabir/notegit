import { IpcMain, dialog } from "electron";
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
}
