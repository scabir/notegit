import { IpcMain } from "electron";
import { LogsService } from "../services/LogsService";
import { ApiResponse, ApiErrorCode } from "../../shared/types";
import { logger } from "../utils/logger";
import {
  BackendTranslate,
  createFallbackBackendTranslator,
} from "../i18n/backendTranslator";
import { localizeApiError } from "../i18n/localizeApiError";

export function registerLogsHandlers(
  ipcMain: IpcMain,
  logsService: LogsService,
  translate: BackendTranslate = createFallbackBackendTranslator(),
): void {
  const t = (
    key: string,
    fallback?: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<string> => translate(key, { fallback, params });

  const localizeLogContent = async (
    content: string,
    logType: "combined" | "error",
  ): Promise<string> => {
    if (content === `No ${logType} logs yet.`) {
      return t("logs.info.noLogsYet", "No {logType} logs yet.", { logType });
    }

    if (content === "Log file is empty.") {
      return t("logs.info.logFileEmpty");
    }

    return content;
  };

  ipcMain.handle(
    "logs:getContent",
    async (_, logType: "combined" | "error"): Promise<ApiResponse<string>> => {
      try {
        const content = await logsService.getLogContent(logType);
        return { ok: true, data: await localizeLogContent(content, logType) };
      } catch (error: any) {
        logger.error("Failed to get log content", { error });
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
                "logs.errors.failedGetContent",
                "Failed to get log content",
              )),
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
            message: error.message || (await t("logs.errors.failedExport")),
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
              "logs.errors.failedGetFolder",
              "Failed to get logs folder",
            )),
          details: error,
        },
      };
    }
  });
}
