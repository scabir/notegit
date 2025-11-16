"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBackend = createBackend;
const FsAdapter_1 = require("./adapters/FsAdapter");
const CryptoAdapter_1 = require("./adapters/CryptoAdapter");
const GitAdapter_1 = require("./adapters/GitAdapter");
const ConfigService_1 = require("./services/ConfigService");
const RepoService_1 = require("./services/RepoService");
const FilesService_1 = require("./services/FilesService");
const HistoryService_1 = require("./services/HistoryService");
const configHandlers_1 = require("./handlers/configHandlers");
const repoHandlers_1 = require("./handlers/repoHandlers");
const filesHandlers_1 = require("./handlers/filesHandlers");
const historyHandlers_1 = require("./handlers/historyHandlers");
const logger_1 = require("./utils/logger");
function createBackend(ipcMain) {
    logger_1.logger.info('Initializing backend services');
    // Initialize adapters
    const fsAdapter = new FsAdapter_1.FsAdapter();
    const cryptoAdapter = new CryptoAdapter_1.CryptoAdapter();
    const gitAdapter = new GitAdapter_1.GitAdapter();
    // Initialize services
    const configService = new ConfigService_1.ConfigService(fsAdapter, cryptoAdapter);
    const repoService = new RepoService_1.RepoService(gitAdapter, fsAdapter, configService);
    const filesService = new FilesService_1.FilesService(fsAdapter, configService);
    const historyService = new HistoryService_1.HistoryService(gitAdapter, configService);
    // Set circular dependencies
    repoService.setFilesService(filesService);
    filesService.setGitAdapter(gitAdapter);
    // Register all IPC handlers with dependencies
    (0, configHandlers_1.registerConfigHandlers)(ipcMain, configService, gitAdapter);
    (0, repoHandlers_1.registerRepoHandlers)(ipcMain, repoService);
    (0, filesHandlers_1.registerFilesHandlers)(ipcMain, filesService);
    (0, historyHandlers_1.registerHistoryHandlers)(ipcMain, historyService);
    logger_1.logger.info('Backend services initialized');
}
