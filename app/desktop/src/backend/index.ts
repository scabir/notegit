import { app, IpcMain } from "electron";
import { FsAdapter } from "./adapters/FsAdapter";
import { CryptoAdapter } from "./adapters/CryptoAdapter";
import { GitAdapter } from "./adapters/GitAdapter";
import { MockGitAdapter } from "./adapters/MockGitAdapter";
import { S3Adapter } from "./adapters/S3Adapter";
import { MockS3Adapter } from "./adapters/MockS3Adapter";
import { ConfigService } from "./services/ConfigService";
import { RepoService } from "./services/RepoService";
import { FilesService } from "./services/FilesService";
import { HistoryService } from "./services/HistoryService";
import { SearchService } from "./services/SearchService";
import { ExportService } from "./services/ExportService";
import { LogsService } from "./services/LogsService";
import { TranslationService } from "./services/TranslationService";
import { DefaultLocalRepoBootstrapService } from "./services/DefaultLocalRepoBootstrapService";
import { GitRepoProvider } from "./providers/GitRepoProvider";
import { S3RepoProvider } from "./providers/S3RepoProvider";
import { GitHistoryProvider } from "./providers/GitHistoryProvider";
import { S3HistoryProvider } from "./providers/S3HistoryProvider";
import { LocalRepoProvider } from "./providers/LocalRepoProvider";
import { LocalHistoryProvider } from "./providers/LocalHistoryProvider";
import { registerConfigHandlers } from "./handlers/configHandlers";
import { registerRepoHandlers } from "./handlers/repoHandlers";
import { registerFilesHandlers } from "./handlers/filesHandlers";
import { registerHistoryHandlers } from "./handlers/historyHandlers";
import { registerDialogHandlers } from "./handlers/dialogHandlers";
import { registerSearchHandlers } from "./handlers/searchHandlers";
import { registerExportHandlers } from "./handlers/exportHandlers";
import { registerLogsHandlers } from "./handlers/logsHandlers";
import { registerI18nHandlers } from "./handlers/i18nHandlers";
import { logger } from "./utils/logger";
import * as fs from "fs";
import { createBackendTranslator } from "./i18n/backendTranslator";
import { resolveLocalesRootDir } from "./utils/resolveLocalesRootDir";
import { resolveTutorialsRootDir } from "./utils/resolveTutorialsRootDir";

export async function createBackend(ipcMain: IpcMain): Promise<void> {
  logger.info("Initializing backend services");

  const fsAdapter = new FsAdapter();
  const cryptoAdapter = new CryptoAdapter();
  const gitAdapter =
    process.env.NOTEBRANCH_INTEGRATION_GIT_MOCK === "1"
      ? new MockGitAdapter()
      : new GitAdapter();
  const s3Adapter =
    process.env.NOTEBRANCH_INTEGRATION_S3_MOCK === "1"
      ? new MockS3Adapter()
      : new S3Adapter();

  const configService = new ConfigService(fsAdapter, cryptoAdapter);
  const defaultLocalRepoBootstrapService = new DefaultLocalRepoBootstrapService(
    fsAdapter,
    configService,
  );
  const gitRepoProvider = new GitRepoProvider(gitAdapter, fsAdapter);
  const s3RepoProvider = new S3RepoProvider(s3Adapter);
  const localRepoProvider = new LocalRepoProvider(fsAdapter);
  const repoService = new RepoService(
    { git: gitRepoProvider, s3: s3RepoProvider, local: localRepoProvider },
    fsAdapter,
    configService,
  );
  const filesService = new FilesService(fsAdapter, configService);
  const gitHistoryProvider = new GitHistoryProvider(gitAdapter);
  const s3HistoryProvider = new S3HistoryProvider(s3Adapter);
  const localHistoryProvider = new LocalHistoryProvider();
  const historyService = new HistoryService(
    {
      git: gitHistoryProvider,
      s3: s3HistoryProvider,
      local: localHistoryProvider,
    },
    configService,
  );
  const searchService = new SearchService(fsAdapter);
  const logsService = new LogsService();
  const translationService = new TranslationService(fsAdapter, {
    localesRootDir: resolveLocalesRootDir({
      explicitRoot: process.env.NOTEBRANCH_LOCALES_ROOT,
      resourcesPath: process.resourcesPath,
      compiledDir: __dirname,
      exists: (targetPath) => fs.existsSync(targetPath),
    }),
  });
  const translate = createBackendTranslator(translationService, configService);
  const exportService = new ExportService(fsAdapter, configService, translate);

  repoService.setFilesService(filesService);
  filesService.setGitAdapter(gitAdapter);

  const tutorialsRootDir = resolveTutorialsRootDir({
    explicitRoot: process.env.NOTEBRANCH_TUTORIALS_ROOT,
    resourcesPath: process.resourcesPath,
    appPath: app.getAppPath(),
    compiledDir: __dirname,
    exists: (targetPath) => fs.existsSync(targetPath),
  });

  try {
    await defaultLocalRepoBootstrapService.ensureDefaultLocalRepo({
      tutorialsRootDir,
      integrationTestMode: process.env.NOTEBRANCH_INTEGRATION_TEST === "1",
    });
  } catch (error) {
    logger.error("Failed to bootstrap first-install default repository", {
      error,
    });
  }

  configService.getFull().then((config) => {
    if (config?.repoSettings?.localPath) {
      searchService.setRepoPath(config.repoSettings.localPath);
    }
  });

  registerConfigHandlers(
    ipcMain,
    configService,
    repoService,
    gitAdapter,
    translate,
  );
  registerRepoHandlers(ipcMain, repoService, translate);
  registerFilesHandlers(ipcMain, filesService, repoService, translate);
  registerHistoryHandlers(ipcMain, historyService, translate);
  registerDialogHandlers(ipcMain, translate);
  registerSearchHandlers(ipcMain, searchService, translate);
  registerExportHandlers(ipcMain, exportService, translate);
  registerLogsHandlers(ipcMain, logsService, translate);
  registerI18nHandlers(ipcMain, translationService, configService, translate);

  logger.info("Backend services initialized");
}
