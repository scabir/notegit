import * as fs from "fs/promises";
import * as path from "path";
import { app } from "electron";
import { ApiError, ApiErrorCode } from "../../shared/types";
import { logger } from "../utils/logger";

const LOGS_DIR_NAME = "logs";
const LOG_TYPE_COMBINED = "combined";
const LOG_TYPE_ERROR = "error";
const LOG_FILE_EXTENSION = ".log";
const LOG_PREFIX_COMBINED = "combined-";
const LOG_PREFIX_ERROR = "error-";
const ENCODING_UTF8 = "utf-8";
const ERROR_CODE_NOT_FOUND = "ENOENT";

export class LogsService {
  private readonly logsDir: string;

  constructor() {
    const userDataPath = app.getPath("userData");
    this.logsDir = path.join(userDataPath, LOGS_DIR_NAME);
  }

  async getLogContent(
    logType: typeof LOG_TYPE_COMBINED | typeof LOG_TYPE_ERROR,
  ): Promise<string> {
    try {
      const logFilePath = await this.getLatestLogFilePath(logType);
      if (!logFilePath) {
        return `No ${logType} logs yet.`;
      }

      const content = await fs.readFile(logFilePath, ENCODING_UTF8);

      return content || `Log file is empty.`;
    } catch (error: any) {
      logger.error("Failed to read log file", { logType, error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to read ${logType} log: ${error.message}`,
        error,
        {
          messageKey: "logs.errors.failedReadLogTemplate",
          messageParams: {
            logType,
            message: error.message,
          },
        },
      );
    }
  }

  getLogsDirectory(): string {
    return this.logsDir;
  }

  private getLogFilePrefix(
    logType: typeof LOG_TYPE_COMBINED | typeof LOG_TYPE_ERROR,
  ): string {
    return logType === LOG_TYPE_COMBINED
      ? LOG_PREFIX_COMBINED
      : LOG_PREFIX_ERROR;
  }

  private async getLatestLogFilePath(
    logType: typeof LOG_TYPE_COMBINED | typeof LOG_TYPE_ERROR,
  ): Promise<string | null> {
    try {
      const entries = await fs.readdir(this.logsDir);
      const prefix = this.getLogFilePrefix(logType);
      const candidates = entries
        .filter(
          (name) =>
            name.startsWith(prefix) && name.endsWith(LOG_FILE_EXTENSION),
        )
        .sort();

      if (candidates.length === 0) {
        return null;
      }

      const latest = candidates[candidates.length - 1];
      return path.join(this.logsDir, latest);
    } catch (error: any) {
      if (error?.code === ERROR_CODE_NOT_FOUND) {
        return null;
      }
      throw error;
    }
  }

  async exportLogs(
    logType: typeof LOG_TYPE_COMBINED | typeof LOG_TYPE_ERROR,
    destPath: string,
  ): Promise<void> {
    try {
      const logFilePath = await this.getLatestLogFilePath(logType);
      if (!logFilePath) {
        throw this.createError(
          ApiErrorCode.FS_NOT_FOUND,
          `Log file not found: ${logType}`,
          null,
          {
            messageKey: "logs.errors.logFileNotFound",
            messageParams: { logType },
          },
        );
      }

      await fs.copyFile(logFilePath, destPath);

      logger.info("Logs exported successfully", { logType, destPath });
    } catch (error: any) {
      logger.error("Failed to export logs", { logType, destPath, error });
      if (error?.code === ApiErrorCode.FS_NOT_FOUND) {
        throw error;
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to export ${logType} log: ${error.message}`,
        error,
        {
          messageKey: "logs.errors.failedExportLogTemplate",
          messageParams: {
            logType,
            message: error.message,
          },
        },
      );
    }
  }

  private createError(
    code: ApiErrorCode,
    message: string,
    details?: any,
    localization?: {
      messageKey: string;
      messageParams?: Record<string, string | number | boolean>;
    },
  ): ApiError {
    const baseDetails =
      details && typeof details === "object" && !Array.isArray(details)
        ? { ...details }
        : details !== undefined
          ? { cause: details }
          : {};

    const enrichedDetails = localization
      ? {
          ...baseDetails,
          messageKey: localization.messageKey,
          messageParams: localization.messageParams,
        }
      : details;

    return {
      code,
      message,
      details: enrichedDetails,
    };
  }
}
