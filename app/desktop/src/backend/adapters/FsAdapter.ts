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
        );
      }
      if (error.code === ERROR_CODE_PERMISSION) {
        throw this.createError(
          ApiErrorCode.FS_PERMISSION_DENIED,
          `Permission denied: ${filePath}`,
          error,
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to read file: ${filePath}`,
        error,
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
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to write file: ${filePath}`,
        error,
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
        );
      }
      if (error.code === ERROR_CODE_PERMISSION) {
        throw this.createError(
          ApiErrorCode.FS_PERMISSION_DENIED,
          `Permission denied: ${filePath}`,
          error,
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to delete file: ${filePath}`,
        error,
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
        );
      }
      if (error.code === ERROR_CODE_PERMISSION) {
        throw this.createError(
          ApiErrorCode.FS_PERMISSION_DENIED,
          `Permission denied: ${oldPath}`,
          error,
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to rename from ${oldPath} to ${newPath}`,
        error,
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
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to create directory: ${dirPath}`,
        error,
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
        );
      }
      if (error.code === ERROR_CODE_PERMISSION) {
        throw this.createError(
          ApiErrorCode.FS_PERMISSION_DENIED,
          `Permission denied: ${dirPath}`,
          error,
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to delete directory: ${dirPath}`,
        error,
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
        );
      }
      if (error.code === ERROR_CODE_PERMISSION) {
        throw this.createError(
          ApiErrorCode.FS_PERMISSION_DENIED,
          `Permission denied: ${dirPath}`,
          error,
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to read directory: ${dirPath}`,
        error,
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
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to stat: ${filePath}`,
        error,
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
        );
      }
      if (error.code === ERROR_CODE_PERMISSION) {
        throw this.createError(
          ApiErrorCode.FS_PERMISSION_DENIED,
          `Permission denied`,
          error,
        );
      }
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to copy file from ${src} to ${dest}`,
        error,
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
  ): ApiError {
    return {
      code,
      message,
      details,
    };
  }
}
