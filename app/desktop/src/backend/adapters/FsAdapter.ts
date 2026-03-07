import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import { Stats } from "fs";
import { ApiError, ApiErrorCode } from "../../shared/types";

const ENCODING_UTF8 = "utf-8";
const ERROR_CODE_NOT_FOUND = "ENOENT";
const ERROR_CODE_PERMISSION = "EACCES";
const ERROR_CODE_EXISTS = "EEXIST";

export class FsAdapter {
  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, ENCODING_UTF8);
    } catch (error: any) {
      if (error.code === ERROR_CODE_NOT_FOUND) {
        throw this.createError(
          ApiErrorCode.FS_NOT_FOUND,
          `File not found: ${filePath}`,
          error,
          {
            messageKey: "fs.errors.fileNotFound",
            messageParams: { path: filePath },
          },
        );
      }
      if (error.code === ERROR_CODE_PERMISSION) {
        throw this.createError(
          ApiErrorCode.FS_PERMISSION_DENIED,
          `Permission denied: ${filePath}`,
          error,
          {
            messageKey: "fs.errors.permissionDeniedPath",
            messageParams: { path: filePath },
          },
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to read file: ${filePath}`,
        error,
        {
          messageKey: "fs.errors.failedReadFile",
          messageParams: { path: filePath },
        },
      );
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      await this.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, ENCODING_UTF8);
    } catch (error: any) {
      if (error.code === ERROR_CODE_PERMISSION) {
        throw this.createError(
          ApiErrorCode.FS_PERMISSION_DENIED,
          `Permission denied: ${filePath}`,
          error,
          {
            messageKey: "fs.errors.permissionDeniedPath",
            messageParams: { path: filePath },
          },
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to write file: ${filePath}`,
        error,
        {
          messageKey: "fs.errors.failedWriteFile",
          messageParams: { path: filePath },
        },
      );
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code === ERROR_CODE_NOT_FOUND) {
        throw this.createError(
          ApiErrorCode.FS_NOT_FOUND,
          `File not found: ${filePath}`,
          error,
          {
            messageKey: "fs.errors.fileNotFound",
            messageParams: { path: filePath },
          },
        );
      }
      if (error.code === ERROR_CODE_PERMISSION) {
        throw this.createError(
          ApiErrorCode.FS_PERMISSION_DENIED,
          `Permission denied: ${filePath}`,
          error,
          {
            messageKey: "fs.errors.permissionDeniedPath",
            messageParams: { path: filePath },
          },
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to delete file: ${filePath}`,
        error,
        {
          messageKey: "fs.errors.failedDeleteFile",
          messageParams: { path: filePath },
        },
      );
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    try {
      await fs.rename(oldPath, newPath);
    } catch (error: any) {
      if (error.code === ERROR_CODE_NOT_FOUND) {
        throw this.createError(
          ApiErrorCode.FS_NOT_FOUND,
          `File not found: ${oldPath}`,
          error,
          {
            messageKey: "fs.errors.fileNotFound",
            messageParams: { path: oldPath },
          },
        );
      }
      if (error.code === ERROR_CODE_PERMISSION) {
        throw this.createError(
          ApiErrorCode.FS_PERMISSION_DENIED,
          `Permission denied: ${oldPath}`,
          error,
          {
            messageKey: "fs.errors.permissionDeniedPath",
            messageParams: { path: oldPath },
          },
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to rename from ${oldPath} to ${newPath}`,
        error,
        {
          messageKey: "fs.errors.failedRename",
          messageParams: { from: oldPath, to: newPath },
        },
      );
    }
  }

  async mkdir(
    dirPath: string,
    options?: { recursive?: boolean },
  ): Promise<void> {
    try {
      await fs.mkdir(dirPath, options);
    } catch (error: any) {
      if (error.code === ERROR_CODE_EXISTS) {
        return;
      }
      if (error.code === ERROR_CODE_PERMISSION) {
        throw this.createError(
          ApiErrorCode.FS_PERMISSION_DENIED,
          `Permission denied: ${dirPath}`,
          error,
          {
            messageKey: "fs.errors.permissionDeniedPath",
            messageParams: { path: dirPath },
          },
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to create directory: ${dirPath}`,
        error,
        {
          messageKey: "fs.errors.failedCreateDirectory",
          messageParams: { path: dirPath },
        },
      );
    }
  }

  async rmdir(
    dirPath: string,
    options?: { recursive?: boolean },
  ): Promise<void> {
    try {
      await fs.rm(dirPath, {
        recursive: options?.recursive ?? true,
        force: true,
      });
    } catch (error: any) {
      if (error.code === ERROR_CODE_NOT_FOUND) {
        throw this.createError(
          ApiErrorCode.FS_NOT_FOUND,
          `Directory not found: ${dirPath}`,
          error,
          {
            messageKey: "fs.errors.directoryNotFound",
            messageParams: { path: dirPath },
          },
        );
      }
      if (error.code === ERROR_CODE_PERMISSION) {
        throw this.createError(
          ApiErrorCode.FS_PERMISSION_DENIED,
          `Permission denied: ${dirPath}`,
          error,
          {
            messageKey: "fs.errors.permissionDeniedPath",
            messageParams: { path: dirPath },
          },
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to delete directory: ${dirPath}`,
        error,
        {
          messageKey: "fs.errors.failedDeleteDirectory",
          messageParams: { path: dirPath },
        },
      );
    }
  }

  async readdir(dirPath: string): Promise<string[]> {
    try {
      return await fs.readdir(dirPath);
    } catch (error: any) {
      if (error.code === ERROR_CODE_NOT_FOUND) {
        throw this.createError(
          ApiErrorCode.FS_NOT_FOUND,
          `Directory not found: ${dirPath}`,
          error,
          {
            messageKey: "fs.errors.directoryNotFound",
            messageParams: { path: dirPath },
          },
        );
      }
      if (error.code === ERROR_CODE_PERMISSION) {
        throw this.createError(
          ApiErrorCode.FS_PERMISSION_DENIED,
          `Permission denied: ${dirPath}`,
          error,
          {
            messageKey: "fs.errors.permissionDeniedPath",
            messageParams: { path: dirPath },
          },
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to read directory: ${dirPath}`,
        error,
        {
          messageKey: "fs.errors.failedReadDirectory",
          messageParams: { path: dirPath },
        },
      );
    }
  }

  async stat(filePath: string): Promise<Stats> {
    try {
      return await fs.stat(filePath);
    } catch (error: any) {
      if (error.code === ERROR_CODE_NOT_FOUND) {
        throw this.createError(
          ApiErrorCode.FS_NOT_FOUND,
          `Path not found: ${filePath}`,
          error,
          {
            messageKey: "fs.errors.pathNotFound",
            messageParams: { path: filePath },
          },
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to stat: ${filePath}`,
        error,
        {
          messageKey: "fs.errors.failedStat",
          messageParams: { path: filePath },
        },
      );
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async copyFile(src: string, dest: string): Promise<void> {
    try {
      const destDir = path.dirname(dest);
      await this.mkdir(destDir, { recursive: true });
      await fs.copyFile(src, dest);
    } catch (error: any) {
      if (error.code === ERROR_CODE_NOT_FOUND) {
        throw this.createError(
          ApiErrorCode.FS_NOT_FOUND,
          `Source file not found: ${src}`,
          error,
          {
            messageKey: "fs.errors.sourceFileNotFound",
            messageParams: { path: src },
          },
        );
      }
      if (error.code === ERROR_CODE_PERMISSION) {
        throw this.createError(
          ApiErrorCode.FS_PERMISSION_DENIED,
          `Permission denied`,
          error,
          {
            messageKey: "fs.errors.permissionDenied",
          },
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to copy file from ${src} to ${dest}`,
        error,
        {
          messageKey: "fs.errors.failedCopyFile",
          messageParams: { from: src, to: dest },
        },
      );
    }
  }

  existsSync(filePath: string): boolean {
    return fsSync.existsSync(filePath);
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
