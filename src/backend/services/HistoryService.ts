import {
  CommitEntry,
  DiffHunk,
  ApiError,
  ApiErrorCode,
  RepoProviderType,
} from "../../shared/types";
import { ConfigService } from "./ConfigService";
import type { HistoryProvider } from "../providers/types";
import { logger } from "../utils/logger";

export class HistoryService {
  private activeProvider: HistoryProvider | null = null;
  private activeProviderType: RepoProviderType | null = null;

  constructor(
    private providers: Record<RepoProviderType, HistoryProvider>,
    private configService: ConfigService,
  ) {}

  async init(): Promise<void> {
    await this.ensureProvider();
  }

  async getForFile(filePath: string): Promise<CommitEntry[]> {
    const provider = await this.ensureProvider();
    return await provider.getForFile(filePath);
  }

  async getVersion(versionId: string, filePath: string): Promise<string> {
    const provider = await this.ensureProvider();
    return await provider.getVersion(versionId, filePath);
  }

  async getDiff(
    versionA: string,
    versionB: string,
    filePath: string,
  ): Promise<DiffHunk[]> {
    const provider = await this.ensureProvider();
    return await provider.getDiff(versionA, versionB, filePath);
  }

  private async ensureProvider(): Promise<HistoryProvider> {
    const repoSettings = await this.configService.getRepoSettings();
    if (!repoSettings) {
      throw this.createError(
        ApiErrorCode.VALIDATION_ERROR,
        "No repository configured",
        null,
      );
    }

    if (
      this.activeProvider &&
      this.activeProviderType === repoSettings.provider
    ) {
      this.activeProvider.configure(repoSettings);
      return this.activeProvider;
    }

    const provider = this.providers[repoSettings.provider];
    if (!provider) {
      throw this.createError(
        ApiErrorCode.VALIDATION_ERROR,
        `Unsupported history provider: ${repoSettings.provider}`,
        null,
      );
    }

    provider.configure(repoSettings);
    this.activeProvider = provider;
    this.activeProviderType = repoSettings.provider;

    logger.debug("History provider configured", {
      provider: repoSettings.provider,
    });

    return provider;
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
