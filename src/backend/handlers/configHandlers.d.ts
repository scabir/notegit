import { IpcMain } from 'electron';
import { ConfigService } from '../services/ConfigService';
import { GitAdapter } from '../adapters/GitAdapter';
export declare function registerConfigHandlers(ipcMain: IpcMain, configService: ConfigService, gitAdapter: GitAdapter): void;
