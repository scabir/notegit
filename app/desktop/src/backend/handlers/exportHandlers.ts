import { IpcMain } from "electron";
import { ExportService } from "../services/ExportService";
import {
  ApiResponse,
  ApiErrorCode,
  EXPORT_CANCELLED_REASON,
} from "../../shared/types";
import { logger } from "../utils/logger";
import {
  BackendTranslate,
  createFallbackBackendTranslator,
} from "../i18n/backendTranslator";
import { localizeApiError } from "../i18n/localizeApiError";

const isExportCancelledError = (error: any): boolean =>
  error?.code === ApiErrorCode.VALIDATION_ERROR &&
  error?.details?.reason === EXPORT_CANCELLED_REASON;

export function registerExportHandlers(
  ipcMain: IpcMain,
  exportService: ExportService,
  translate: BackendTranslate = createFallbackBackendTranslator(),
): void {
  const t = (
    key: string,
    fallback?: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<string> => translate(key, { fallback, params });

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
        if (isExportCancelledError(error)) {
          const cancelledMessage = await t(
            "export.errors.cancelled",
            "Export cancelled",
          );
          return {
            ok: false,
            error: {
              code: ApiErrorCode.VALIDATION_ERROR,
              message: cancelledMessage,
              details: error.details,
            },
          };
        }

        logger.error("Failed to export note", { fileName, error });
        return {
          ok: false,
          error: error.code
            ? await localizeApiError(error, translate)
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message:
                  error.message ||
                  (await t(
                    "export.errors.failedExportNote",
                    "Failed to export note",
                  )),
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
      if (isExportCancelledError(error)) {
        const cancelledMessage = await t(
          "export.errors.cancelled",
          "Export cancelled",
        );
        return {
          ok: false,
          error: {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: cancelledMessage,
            details: error.details,
          },
        };
      }

      logger.error("Failed to export repository as zip", { error });
      return {
        ok: false,
        error: error.code
          ? await localizeApiError(error, translate)
          : {
              code: ApiErrorCode.UNKNOWN_ERROR,
              message:
                error.message ||
                (await t(
                  "export.errors.failedExportRepositoryZip",
                  "Failed to export repository as zip",
                )),
              details: error,
            },
      };
    }
  });
}
