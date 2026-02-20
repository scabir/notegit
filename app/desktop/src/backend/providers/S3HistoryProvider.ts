import { S3Adapter } from "../adapters/S3Adapter";
import {
  CommitEntry,
  DiffHunk,
  ApiError,
  ApiErrorCode,
  RepoSettings,
  S3RepoSettings,
  REPO_PROVIDERS,
} from "../../shared/types";
import { logger } from "../utils/logger";
import type { HistoryProvider } from "./types";

export class S3HistoryProvider implements HistoryProvider {
  readonly type = REPO_PROVIDERS.s3;
  private settings: S3RepoSettings | null = null;

  constructor(private s3Adapter: S3Adapter) {}

  configure(settings: RepoSettings): void {
    if (settings.provider !== REPO_PROVIDERS.s3) {
      throw this.createError(
        ApiErrorCode.REPO_PROVIDER_MISMATCH,
        "S3HistoryProvider configured with non-s3 settings",
        { provider: settings.provider },
      );
    }

    this.settings = settings;
    this.s3Adapter.configure(settings);
  }

  async getForFile(filePath: string): Promise<CommitEntry[]> {
    this.ensureConfigured();

    const key = this.toS3Key(filePath);
    const versions = await this.s3Adapter.listObjectVersions(key);

    const sorted = versions.sort((a, b) => {
      const aTime = a.lastModified?.getTime() || 0;
      const bTime = b.lastModified?.getTime() || 0;
      return bTime - aTime;
    });

    return sorted.map((version) => ({
      hash: version.versionId,
      author: "S3",
      email: "",
      date: version.lastModified ? new Date(version.lastModified) : new Date(0),
      message: version.isLatest ? "Latest upload" : "S3 version",
      files: [filePath],
    }));
  }

  async getVersion(versionId: string, filePath: string): Promise<string> {
    this.ensureConfigured();

    const key = this.toS3Key(filePath);
    const content = await this.s3Adapter.getObject(key, versionId);
    return content.toString("utf-8");
  }

  async getDiff(
    _versionA: string,
    _versionB: string,
    _filePath: string,
  ): Promise<DiffHunk[]> {
    logger.warn("S3 diff requested but not supported");
    throw this.createError(
      ApiErrorCode.S3_SYNC_FAILED,
      "Diff is not supported for S3 history",
      null,
    );
  }

  private ensureConfigured(): void {
    if (!this.settings) {
      throw this.createError(
        ApiErrorCode.VALIDATION_ERROR,
        "S3 history provider is not configured",
        null,
      );
    }
  }

  private normalizedPrefix(): string {
    const prefix = this.settings?.prefix?.trim() || "";
    if (!prefix) {
      return "";
    }
    return prefix.replace(/^\/+|\/+$/g, "") + "/";
  }

  private toS3Key(relativePath: string): string {
    const normalized = relativePath.split("\\").join("/");
    return `${this.normalizedPrefix()}${normalized}`;
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
