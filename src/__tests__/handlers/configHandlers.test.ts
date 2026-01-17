import { registerConfigHandlers } from '../../backend/handlers/configHandlers';

describe('configHandlers', () => {
  const createIpcMain = () => {
    const handlers: Record<string, (...args: any[]) => any> = {};
    const ipcMain = {
      handle: jest.fn((channel: string, handler: (...args: any[]) => any) => {
        handlers[channel] = handler;
      }),
    } as any;

    return { ipcMain, handlers };
  };

  it('refreshes auto sync settings after app settings update', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      updateAppSettings: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {
      refreshAutoSyncSettings: jest.fn().mockResolvedValue(undefined),
    } as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:updateAppSettings'](null, {
      s3AutoSyncEnabled: true,
      s3AutoSyncIntervalSec: 20,
    });

    expect(response.ok).toBe(true);
    expect(configService.updateAppSettings).toHaveBeenCalled();
    expect(repoService.refreshAutoSyncSettings).toHaveBeenCalled();
  });

  it('returns ok even if auto sync refresh fails', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      updateAppSettings: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {
      refreshAutoSyncSettings: jest.fn().mockRejectedValue(new Error('offline')),
    } as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:updateAppSettings'](null, {
      s3AutoSyncEnabled: false,
    });

    expect(response.ok).toBe(true);
    expect(configService.updateAppSettings).toHaveBeenCalled();
    expect(repoService.refreshAutoSyncSettings).toHaveBeenCalled();
  });
});
