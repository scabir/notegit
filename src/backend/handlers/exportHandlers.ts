import { IpcMain } from "electron";
import { ExportService } from "../services/ExportService";
import { ApiResponse, ApiErrorCode } from "../../shared/types";
import { logger } from "../utils/logger";

export function registerExportHandlers(
  ipcMain: IpcMain,
  exportService: ExportService,
): void {
  ipcMain.handle(
    "export:note",
    async (
      _event,
      fileName: string,
      content: string,
      defaultExtension: "md" | "txt" = "md",
    ): Promise<ApiResponse<string>> => {
      try {
        const exportPath = await exportService.exportNote(
          fileName,
          content,
          defaultExtension,
        );
        return {
          ok: true,
          data: exportPath,
        };
      } catch (error: any) {
        if (error.message && error.message.includes("cancelled by user")) {
          return {
            ok: false,
            error: {
              code: ApiErrorCode.VALIDATION_ERROR,
              message: "Export cancelled",
              details: error,
            },
          };
        }

        logger.error("Failed to export note", { fileName, error });
        return {
          ok: false,
          error: error.code
            ? error
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: error.message || "Failed to export note",
                details: error,
              },
        };
      }
    },
  );

  ipcMain.handle("export:repoZip", async (): Promise<ApiResponse<string>> => {
    try {
      const zipPath = await exportService.exportRepoAsZip();
      return {
        ok: true,
        data: zipPath,
      };
    } catch (error: any) {
      if (error.message && error.message.includes("cancelled by user")) {
        return {
          ok: false,
          error: {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: "Export cancelled",
            details: error,
          },
        };
      }

      logger.error("Failed to export repository as zip", { error });
      return {
        ok: false,
        error: error.code
          ? error
          : {
              code: ApiErrorCode.UNKNOWN_ERROR,
              message: error.message || "Failed to export repository as zip",
              details: error,
            },
      };
    }
  });
}
