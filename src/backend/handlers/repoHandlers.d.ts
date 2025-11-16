import { IpcMain } from 'electron';
import { RepoService } from '../services/RepoService';
export declare function registerRepoHandlers(ipcMain: IpcMain, repoService: RepoService): void;
