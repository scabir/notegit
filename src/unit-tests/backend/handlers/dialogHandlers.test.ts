import { registerDialogHandlers } from '../../../backend/handlers/dialogHandlers';
import { dialog } from 'electron';

jest.mock('electron', () => ({
  dialog: {
    showOpenDialog: jest.fn(),
    showSaveDialog: jest.fn(),
  },
  app: {
    getPath: jest.fn(() => '/tmp/notegit-test'),
  },
}));

describe('dialogHandlers', () => {
  const createIpcMain = () => {
    const handlers: Record<string, (...args: any[]) => any> = {};
    const ipcMain = {
      handle: jest.fn((channel: string, handler: (...args: any[]) => any) => {
        handlers[channel] = handler;
      }),
    } as any;

    return { ipcMain, handlers };
  };

  it('returns open dialog result', async () => {
    (dialog.showOpenDialog as jest.Mock).mockResolvedValue({ canceled: false, filePaths: ['/tmp/a'] });
    const { ipcMain, handlers } = createIpcMain();

    registerDialogHandlers(ipcMain);

    const result = await handlers['dialog:showOpenDialog'](null, { title: 'Open' });

    expect(result.canceled).toBe(false);
    expect(dialog.showOpenDialog).toHaveBeenCalled();
  });

  it('returns fallback when open dialog fails', async () => {
    (dialog.showOpenDialog as jest.Mock).mockRejectedValue(new Error('boom'));
    const { ipcMain, handlers } = createIpcMain();

    registerDialogHandlers(ipcMain);

    const result = await handlers['dialog:showOpenDialog'](null, { title: 'Open' });

    expect(result).toEqual({ canceled: true, filePaths: [] });
  });

  it('returns save dialog result', async () => {
    (dialog.showSaveDialog as jest.Mock).mockResolvedValue({ canceled: false, filePath: '/tmp/out.md' });
    const { ipcMain, handlers } = createIpcMain();

    registerDialogHandlers(ipcMain);

    const result = await handlers['dialog:showSaveDialog'](null, { title: 'Save' });

    expect(result.filePath).toBe('/tmp/out.md');
  });

  it('returns fallback when save dialog fails', async () => {
    (dialog.showSaveDialog as jest.Mock).mockRejectedValue(new Error('boom'));
    const { ipcMain, handlers } = createIpcMain();

    registerDialogHandlers(ipcMain);

    const result = await handlers['dialog:showSaveDialog'](null, { title: 'Save' });

    expect(result).toEqual({ canceled: true, filePath: undefined });
  });
});
