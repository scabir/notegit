import { IpcMain, dialog, shell } from "electron";
import { ApiErrorCode, ApiResponse } from "../../shared/types";
import { logger } from "../utils/logger";
import {
  BackendTranslate,
  createFallbackBackendTranslator,
} from "../i18n/backendTranslator";
import { localizeApiError } from "../i18n/localizeApiError";

export function registerDialogHandlers(
  ipcMain: IpcMain,
  translate: BackendTranslate = createFallbackBackendTranslator(),
) {
  const t = (
    key: string,
    fallback?: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<string> => translate(key, { fallback, params });

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
              details: {
                messageKey: "dialog.errors.failedOpenFolder",
                openError,
              },
            },
          };
        }
        return { ok: true };
      } catch (error: any) {
        logger.error("Failed to open folder path", { error, folderPath });
        if (error?.code) {
          return {
            ok: false,
            error: await localizeApiError(error, translate),
          };
        }

        return {
          ok: false,
          error: {
            code: error.code || ApiErrorCode.UNKNOWN_ERROR,
            message:
              error.message ||
              (await t(
                "dialog.errors.failedOpenFolder",
                "Failed to open folder",
              )),
            details: error,
          },
        };
      }
    },
  );
}
