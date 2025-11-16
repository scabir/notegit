import { IpcMain, dialog } from 'electron';
import { logger } from '../utils/logger';

export function registerDialogHandlers(ipcMain: IpcMain) {
  ipcMain.handle(
    'dialog:showOpenDialog',
    async (_event, options: any) => {
      try {
        const result = await dialog.showOpenDialog(options);
        return result;
      } catch (error: any) {
        logger.error('Failed to show open dialog', { error });
        return { canceled: true, filePaths: [] };
      }
    }
  );
}

