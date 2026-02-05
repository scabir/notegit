import { IpcMain } from 'electron';
import { FsAdapter } from './adapters/FsAdapter';
import { CryptoAdapter } from './adapters/CryptoAdapter';
import { GitAdapter } from './adapters/GitAdapter';
import { S3Adapter } from './adapters/S3Adapter';
import { ConfigService } from './services/ConfigService';
import { RepoService } from './services/RepoService';
import { FilesService } from './services/FilesService';
import { HistoryService } from './services/HistoryService';
import { SearchService } from './services/SearchService';
import { ExportService } from './services/ExportService';
import { LogsService } from './services/LogsService';
import { GitRepoProvider } from './providers/GitRepoProvider';
import { S3RepoProvider } from './providers/S3RepoProvider';
import { GitHistoryProvider } from './providers/GitHistoryProvider';
import { S3HistoryProvider } from './providers/S3HistoryProvider';
import { LocalRepoProvider } from './providers/LocalRepoProvider';
import { LocalHistoryProvider } from './providers/LocalHistoryProvider';
import { registerConfigHandlers } from './handlers/configHandlers';
import { registerRepoHandlers } from './handlers/repoHandlers';
import { registerFilesHandlers } from './handlers/filesHandlers';
import { registerHistoryHandlers } from './handlers/historyHandlers';
import { registerDialogHandlers } from './handlers/dialogHandlers';
import { registerSearchHandlers } from './handlers/searchHandlers';
import { registerExportHandlers } from './handlers/exportHandlers';
import { registerLogsHandlers } from './handlers/logsHandlers';
import { logger } from './utils/logger';

export function createBackend(ipcMain: IpcMain): void {
  logger.info('Initializing backend services');

  const fsAdapter = new FsAdapter();
  const cryptoAdapter = new CryptoAdapter();
  const gitAdapter = new GitAdapter();
  const s3Adapter = new S3Adapter();

  const configService = new ConfigService(fsAdapter, cryptoAdapter);
  const gitRepoProvider = new GitRepoProvider(gitAdapter, fsAdapter);
  const s3RepoProvider = new S3RepoProvider(s3Adapter);
  const localRepoProvider = new LocalRepoProvider(fsAdapter);
  const repoService = new RepoService(
    { git: gitRepoProvider, s3: s3RepoProvider, local: localRepoProvider },
    fsAdapter,
    configService
  );
  const filesService = new FilesService(fsAdapter, configService);
  const gitHistoryProvider = new GitHistoryProvider(gitAdapter);
  const s3HistoryProvider = new S3HistoryProvider(s3Adapter);
  const localHistoryProvider = new LocalHistoryProvider();
  const historyService = new HistoryService(
    { git: gitHistoryProvider, s3: s3HistoryProvider, local: localHistoryProvider },
    configService
  );
  const searchService = new SearchService(fsAdapter);
  const exportService = new ExportService(fsAdapter, configService);
  const logsService = new LogsService();

  repoService.setFilesService(filesService);
  filesService.setGitAdapter(gitAdapter);

  configService.getFull().then((config) => {
    if (config?.repoSettings?.localPath) {
      searchService.setRepoPath(config.repoSettings.localPath);
    }
  });

  registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);
  registerRepoHandlers(ipcMain, repoService);
  registerFilesHandlers(ipcMain, filesService, repoService);
  registerHistoryHandlers(ipcMain, historyService);
  registerDialogHandlers(ipcMain);
  registerSearchHandlers(ipcMain, searchService);
  registerExportHandlers(ipcMain, exportService);
  registerLogsHandlers(ipcMain, logsService);

  logger.info('Backend services initialized');
}
