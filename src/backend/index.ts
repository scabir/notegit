import { IpcMain } from 'electron';
import { FsAdapter } from './adapters/FsAdapter';
import { CryptoAdapter } from './adapters/CryptoAdapter';
import { GitAdapter } from './adapters/GitAdapter';
import { ConfigService } from './services/ConfigService';
import { RepoService } from './services/RepoService';
import { FilesService } from './services/FilesService';
import { HistoryService } from './services/HistoryService';
import { SearchService } from './services/SearchService';
import { registerConfigHandlers } from './handlers/configHandlers';
import { registerRepoHandlers } from './handlers/repoHandlers';
import { registerFilesHandlers } from './handlers/filesHandlers';
import { registerHistoryHandlers } from './handlers/historyHandlers';
import { registerDialogHandlers } from './handlers/dialogHandlers';
import { registerSearchHandlers } from './handlers/searchHandlers';
import { logger } from './utils/logger';

export function createBackend(ipcMain: IpcMain): void {
  logger.info('Initializing backend services');

  // Initialize adapters
  const fsAdapter = new FsAdapter();
  const cryptoAdapter = new CryptoAdapter();
  const gitAdapter = new GitAdapter();

  // Initialize services
  const configService = new ConfigService(fsAdapter, cryptoAdapter);
  const repoService = new RepoService(gitAdapter, fsAdapter, configService);
  const filesService = new FilesService(fsAdapter, configService);
  const historyService = new HistoryService(gitAdapter, configService);
  const searchService = new SearchService(fsAdapter);

  // Set circular dependencies
  repoService.setFilesService(filesService);
  filesService.setGitAdapter(gitAdapter);
  
  // Initialize search service with repo path from config
  configService.getFull().then((config) => {
    if (config?.repoSettings?.localPath) {
      searchService.setRepoPath(config.repoSettings.localPath);
    }
  });

  // Register all IPC handlers with dependencies
  registerConfigHandlers(ipcMain, configService, gitAdapter);
  registerRepoHandlers(ipcMain, repoService);
  registerFilesHandlers(ipcMain, filesService);
  registerHistoryHandlers(ipcMain, historyService);
  registerDialogHandlers(ipcMain);
  registerSearchHandlers(ipcMain, searchService);

  logger.info('Backend services initialized');
}

