import { IpcMain } from 'electron';
import { HistoryService } from '../services/HistoryService';
export declare function registerHistoryHandlers(ipcMain: IpcMain, historyService: HistoryService): void;
