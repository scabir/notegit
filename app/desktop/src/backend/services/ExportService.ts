import * as path from "path";
import * as fs from "fs/promises";
import archiver from "archiver";
import { dialog } from "electron";
import { FsAdapter } from "../adapters/FsAdapter";
import { ConfigService } from "./ConfigService";
import {
  ApiError,
  ApiErrorCode,
  EXPORT_CANCELLED_REASON,
} from "../../shared/types";
import { logger } from "../utils/logger";
import { createWriteStream } from "fs";
import {
  BackendTranslate,
  createFallbackBackendTranslator,
} from "../i18n/backendTranslator";

export class ExportService {
  private repoPath: string | null = null;
  private translate: BackendTranslate;

  constructor(
    private fsAdapter: FsAdapter,
    private configService: ConfigService,
    translate: BackendTranslate = createFallbackBackendTranslator(),
  ) {
    this.translate = translate;
  }

  async init(): Promise<void> {
    const repoSettings = await this.configService.getRepoSettings();
    if (repoSettings?.localPath) {
      this.repoPath = repoSettings.localPath;
      logger.debug("ExportService initialized", { repoPath: this.repoPath });
    }
  }

  async exportNote(
    fileName: string,
    content: string,
    defaultExtension: "md" | "txt" = "md",
  ): Promise<string> {
    try {
      const title = await this.translate("export.dialog.exportNoteTitle", {
        fallback: "Export Note",
      });
      const markdownFiles = await this.translate(
        "export.dialog.markdownFiles",
        {
          fallback: "Markdown Files",
        },
      );
      const textFiles = await this.translate("export.dialog.textFiles", {
        fallback: "Text Files",
      });
      const allFiles = await this.translate("export.dialog.allFiles", {
        fallback: "All Files",
      });

      const result = await dialog.showSaveDialog({
        title,
        defaultPath:
          fileName.replace(/\.(md|txt)$/, "") + `.${defaultExtension}`,
        filters: [
          { name: markdownFiles, extensions: ["md"] },
          { name: textFiles, extensions: ["txt"] },
          { name: allFiles, extensions: ["*"] },
        ],
        properties: ["createDirectory", "showOverwriteConfirmation"],
      });

      if (result.canceled || !result.filePath) {
        const cancelledMessage = await this.translate(
          "export.errors.cancelled",
          {
            fallback: "Export cancelled",
          },
        );
        throw this.createError(
          ApiErrorCode.VALIDATION_ERROR,
          cancelledMessage,
          { reason: EXPORT_CANCELLED_REASON },
        );
      }

      const exportPath = result.filePath;

      await fs.writeFile(exportPath, content, "utf-8");

      logger.info("Note exported successfully", { exportPath });
      return exportPath;
    } catch (error: any) {
      if (error.code === ApiErrorCode.VALIDATION_ERROR) {
        throw error;
      }
      logger.error("Failed to export note", { fileName, error });
      const template = await this.translate(
        "export.errors.failedExportNoteTemplate",
        {
          fallback: "Failed to export note: {message}",
          params: {
            message: error.message,
          },
        },
      );
      throw this.createError(ApiErrorCode.UNKNOWN_ERROR, template, error);
    }
  }

  async exportRepoAsZip(): Promise<string> {
    await this.ensureRepoPath();

    try {
      const repoName = path.basename(this.repoPath!);
      const title = await this.translate("export.dialog.exportRepoZipTitle", {
        fallback: "Export Repository as Zip",
      });
      const zipArchives = await this.translate("export.dialog.zipArchives", {
        fallback: "Zip Archives",
      });
      const allFiles = await this.translate("export.dialog.allFiles", {
        fallback: "All Files",
      });
      const result = await dialog.showSaveDialog({
        title,
        defaultPath: `${repoName}-export.zip`,
        filters: [
          { name: zipArchives, extensions: ["zip"] },
          { name: allFiles, extensions: ["*"] },
        ],
        properties: ["createDirectory", "showOverwriteConfirmation"],
      });

      if (result.canceled || !result.filePath) {
        const cancelledMessage = await this.translate(
          "export.errors.cancelled",
          {
            fallback: "Export cancelled",
          },
        );
        throw this.createError(
          ApiErrorCode.VALIDATION_ERROR,
          cancelledMessage,
          { reason: EXPORT_CANCELLED_REASON },
        );
      }

      const zipPath = result.filePath;

      await this.createZipArchive(this.repoPath!, zipPath);

      logger.info("Repository exported as zip", { zipPath });
      return zipPath;
    } catch (error: any) {
      if (error.code === ApiErrorCode.VALIDATION_ERROR) {
        throw error;
      }
      logger.error("Failed to export repository as zip", { error });
      const template = await this.translate(
        "export.errors.failedExportRepoTemplate",
        {
          fallback: "Failed to export repository: {message}",
          params: {
            message: error.message,
          },
        },
      );
      throw this.createError(ApiErrorCode.UNKNOWN_ERROR, template, error);
    }
  }

  private async createZipArchive(
    sourcePath: string,
    zipPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(zipPath);
      const archive = archiver("zip", {
        zlib: { level: 9 },
      });

      output.on("close", () => {
        logger.debug("Zip archive created", {
          zipPath,
          bytes: archive.pointer(),
        });
        resolve();
      });

      archive.on("error", (err) => {
        logger.error("Zip archive error", { err });
        reject(err);
      });

      archive.on("warning", (err) => {
        if (err.code === "ENOENT") {
          logger.warn("Zip archive warning", { err });
        } else {
          reject(err);
        }
      });

      archive.pipe(output);

      archive.glob("**/*", {
        cwd: sourcePath,
        ignore: [".git/**", "node_modules/**"],
        dot: true,
      });

      archive.finalize();
    });
  }

  private async ensureRepoPath(): Promise<void> {
    if (!this.repoPath) {
      await this.init();
    }

    if (!this.repoPath) {
      const noRepoMessage = await this.translate(
        "export.errors.noRepositoryConfigured",
        {
          fallback: "No repository configured",
        },
      );
      throw this.createError(
        ApiErrorCode.VALIDATION_ERROR,
        noRepoMessage,
        null,
      );
    }
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
