import * as path from 'path';
import { FsAdapter } from '../adapters/FsAdapter';
import { ConfigService } from './ConfigService';
import type { FilesService } from './FilesService';
import type { RepoProvider } from '../providers/types';
import type { S3RepoProvider } from '../providers/S3RepoProvider';
import {
  RepoProviderType,
  RepoSettings,
  RepoStatus,
  OpenOrCloneRepoResponse,
  FileTreeNode,
  ApiError,
  ApiErrorCode,
  AuthMethod,
  GitRepoSettings,
  S3RepoSettings,
  LocalRepoSettings,
  REPO_PROVIDERS,
} from '../../shared/types';
import { logger } from '../utils/logger';
import {
  slugifyProfileName,
  getDefaultReposBaseDir,
  extractRepoNameFromUrl,
  findUniqueFolderName,
} from '../utils/profileHelpers';

const DEFAULT_LOCAL_REPO_NAME = 'local-repo';

interface OpenRepoOptions {
  updateConfig?: boolean;
  loadTree?: boolean;
  startAutoSync?: boolean;
}

export class RepoService {
  private activeProvider: RepoProvider | null = null;
  private activeSettings: RepoSettings | null = null;
  private filesService: FilesService | null = null;

  constructor(
    private providers: Record<RepoProviderType, RepoProvider>,
    private fsAdapter: FsAdapter,
    private configService: ConfigService
  ) {}

  setFilesService(filesService: FilesService): void {
    this.filesService = filesService;
  }

  async openOrClone(settings: RepoSettings): Promise<OpenOrCloneRepoResponse> {
    return await this.openRepo(settings, {
      updateConfig: true,
      loadTree: true,
      startAutoSync: true,
    });
  }

  async prepareRepo(settings: RepoSettings): Promise<void> {
    const previousProvider = this.activeProvider;
    const previousSettings = this.activeSettings;
    const shouldRestartAutoSync = Boolean(previousProvider);

    try {
      if (previousProvider) {
        previousProvider.stopAutoSync();
      }

      await this.openRepo(settings, {
        updateConfig: false,
        loadTree: false,
        startAutoSync: false,
      });
    } finally {
      if (previousProvider && previousSettings) {
        previousProvider.configure(previousSettings);
        this.activeProvider = previousProvider;
        this.activeSettings = previousSettings;

        try {
          await previousProvider.getStatus();
        } catch (error) {
          logger.warn('Failed to restore previous repository after prepare', { error });
        }

        if (shouldRestartAutoSync) {
          previousProvider.startAutoSync();
        }
      } else {
        this.activeProvider = null;
        this.activeSettings = null;
      }
    }
  }

  async getStatus(): Promise<RepoStatus> {
    const provider = await this.ensureActiveProvider();
    return await provider.getStatus();
  }

  async fetch(): Promise<RepoStatus> {
    const provider = await this.ensureActiveProvider();
    return await provider.fetch();
  }

  async pull(): Promise<void> {
    const provider = await this.ensureActiveProvider();
    await provider.pull();
  }

  async push(): Promise<void> {
    const provider = await this.ensureActiveProvider();
    await provider.push();
  }

  startAutoPush(): void {
    if (this.activeProvider) {
      void this.applyAutoSyncSettings(this.activeProvider);
      return;
    }

    void this.ensureActiveProvider()
      .then((provider) => this.applyAutoSyncSettings(provider))
      .catch((error) => logger.warn('Failed to start auto-sync', { error }));
  }

  stopAutoPush(): void {
    if (this.activeProvider) {
      this.activeProvider.stopAutoSync();
    }
  }

  async getProviderType(): Promise<RepoProviderType> {
    const provider = await this.ensureActiveProvider();
    return provider.type;
  }

  private async openRepo(
    settings: RepoSettings,
    options: OpenRepoOptions
  ): Promise<OpenOrCloneRepoResponse> {
    logger.info('Opening repository', {
      provider: settings.provider,
    });

    const normalized = this.normalizeSettings(settings);
    const withLocalPath = await this.ensureLocalPath(normalized);
    const provider = this.getProvider(withLocalPath.provider);

    provider.configure(withLocalPath);
    await provider.open(withLocalPath);

    this.activeProvider = provider;
    this.activeSettings = withLocalPath;

    if (options.updateConfig !== false) {
      await this.configService.updateRepoSettings(withLocalPath);
    }

    let tree: FileTreeNode[] = [];
    if (this.filesService && options.loadTree !== false) {
      await this.filesService.init();
      tree = await this.filesService.listTree();
    }

    if (options.startAutoSync !== false) {
      await this.applyAutoSyncSettings(provider);
    }

    const status = await provider.getStatus();

    return {
      localPath: withLocalPath.localPath,
      tree,
      status,
    };
  }

  private async ensureActiveProvider(): Promise<RepoProvider> {
    if (this.activeProvider && this.activeSettings) {
      return this.activeProvider;
    }

    const repoSettings = await this.configService.getRepoSettings();
    if (!repoSettings) {
      throw this.createError(
        ApiErrorCode.VALIDATION_ERROR,
        'No repository configured',
        null
      );
    }

    const provider = this.getProvider(repoSettings.provider);
    provider.configure(repoSettings);

    this.activeProvider = provider;
    this.activeSettings = repoSettings;

    return provider;
  }

  private getProvider(providerType: RepoProviderType): RepoProvider {
    const provider = this.providers[providerType];
    if (!provider) {
      throw this.createError(
        ApiErrorCode.VALIDATION_ERROR,
        `Unsupported repository provider: ${providerType}`,
        null
      );
    }
    return provider;
  }

  private normalizeSettings(settings: RepoSettings): RepoSettings {
    if (settings.provider === REPO_PROVIDERS.s3) {
      const s3Settings = settings as S3RepoSettings;
      return {
        provider: REPO_PROVIDERS.s3,
        bucket: s3Settings.bucket || '',
        region: s3Settings.region || '',
        prefix: s3Settings.prefix || '',
        localPath: s3Settings.localPath || '',
        accessKeyId: s3Settings.accessKeyId || '',
        secretAccessKey: s3Settings.secretAccessKey || '',
        sessionToken: s3Settings.sessionToken || '',
      };
    }

    if (settings.provider === REPO_PROVIDERS.local) {
      const localSettings = settings as LocalRepoSettings;
      return {
        provider: REPO_PROVIDERS.local,
        localPath: localSettings.localPath || '',
      };
    }

    const gitSettings = settings as GitRepoSettings;
    return {
      provider: REPO_PROVIDERS.git,
      remoteUrl: gitSettings.remoteUrl || '',
      branch: gitSettings.branch || 'main',
      localPath: gitSettings.localPath || '',
      pat: gitSettings.pat || '',
      authMethod: gitSettings.authMethod || AuthMethod.PAT,
    };
  }

  private async ensureLocalPath(settings: RepoSettings): Promise<RepoSettings> {
    const baseDir = getDefaultReposBaseDir();
    await this.fsAdapter.mkdir(baseDir, { recursive: true });

    if (settings.provider === REPO_PROVIDERS.local) {
      const localSettings = settings as LocalRepoSettings;
      const rawName = localSettings.localPath?.trim();
      const baseName = rawName ? slugifyProfileName(rawName) : DEFAULT_LOCAL_REPO_NAME;
      const folderName = await findUniqueFolderName(baseDir, baseName, this.fsAdapter);
      return {
        ...settings,
        localPath: path.join(baseDir, folderName),
      };
    }

    if (settings.localPath) {
      return settings;
    }

    if (settings.provider === REPO_PROVIDERS.git) {
      const repoName = extractRepoNameFromUrl(settings.remoteUrl);
      const folderName = await findUniqueFolderName(baseDir, repoName, this.fsAdapter);
      return {
        ...settings,
        localPath: path.join(baseDir, folderName),
      };
    }

    const s3Settings = settings as S3RepoSettings;
    const suffix = s3Settings.prefix
      ? `${s3Settings.bucket}-${s3Settings.prefix.replace(/\//g, '-')}`
      : s3Settings.bucket;
    const baseName = `${slugifyProfileName(suffix)}-s3`;
    const folderName = await findUniqueFolderName(baseDir, baseName, this.fsAdapter);

    return {
      ...settings,
      localPath: path.join(baseDir, folderName),
    };
  }

  private createError(code: ApiErrorCode, message: string, details?: any): ApiError {
    return {
      code,
      message,
      details,
    };
  }

  destroy(): void {
    this.stopAutoPush();
  }

  async refreshAutoSyncSettings(): Promise<void> {
    if (!this.activeProvider) {
      return;
    }

    await this.applyAutoSyncSettings(this.activeProvider);
  }

  async queueS3Delete(path: string): Promise<void> {
    const provider = await this.ensureActiveProvider();
    if (provider.type !== REPO_PROVIDERS.s3) {
      return;
    }

    const s3Provider = provider as S3RepoProvider;
    await s3Provider.queueDelete(path);
  }

  async queueS3Move(oldPath: string, newPath: string): Promise<void> {
    const provider = await this.ensureActiveProvider();
    if (provider.type !== REPO_PROVIDERS.s3) {
      return;
    }

    const s3Provider = provider as S3RepoProvider;
    const normalizedNewPath = this.normalizeS3Path(newPath);
    await s3Provider.queueMove(oldPath, normalizedNewPath);
  }

  async queueS3Upload(path: string): Promise<void> {
    const provider = await this.ensureActiveProvider();
    if (provider.type !== REPO_PROVIDERS.s3) {
      return;
    }

    const s3Provider = provider as S3RepoProvider;
    await s3Provider.queueUpload(path);
  }

  private normalizeS3Path(newPath: string): string {
    const lastSlash = newPath.lastIndexOf('/');
    if (lastSlash === -1) {
      return newPath.replace(/ /g, '-');
    }

    const parentPath = newPath.slice(0, lastSlash);
    const name = newPath.slice(lastSlash + 1).replace(/ /g, '-');
    return parentPath ? `${parentPath}/${name}` : name;
  }

  private async applyAutoSyncSettings(provider: RepoProvider): Promise<void> {
    if (provider.type === REPO_PROVIDERS.local) {
      return;
    }

    if (provider.type !== REPO_PROVIDERS.s3) {
      provider.startAutoSync();
      return;
    }

    const appSettings = await this.configService.getAppSettings();
    const intervalSec = appSettings.s3AutoSyncIntervalSec || 30;
    const intervalMs = Math.max(1000, intervalSec * 1000);

    if (appSettings.s3AutoSyncEnabled) {
      provider.startAutoSync(intervalMs);
    } else {
      provider.stopAutoSync();
    }
  }
}
