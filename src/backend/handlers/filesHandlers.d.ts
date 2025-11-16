import { IpcMain } from 'electron';
import { FilesService } from '../services/FilesService';
export declare function registerFilesHandlers(ipcMain: IpcMain, filesService: FilesService): void;
