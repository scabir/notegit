import { registerHistoryHandlers } from '../../../backend/handlers/historyHandlers';

describe('historyHandlers', () => {
  const createIpcMain = () => {
    const handlers: Record<string, (...args: any[]) => any> = {};
    const ipcMain = {
      handle: jest.fn((channel: string, handler: (...args: any[]) => any) => {
        handlers[channel] = handler;
      }),
    } as any;

    return { ipcMain, handlers };
  };

  it('returns file history', async () => {
    const historyService = {
      getForFile: jest.fn().mockResolvedValue([{ hash: 'abc' }]),
      getVersion: jest.fn(),
      getDiff: jest.fn(),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerHistoryHandlers(ipcMain, historyService);

    const response = await handlers['history:getForFile'](null, 'notes/a.md');

    expect(response.ok).toBe(true);
    expect(response.data).toEqual([{ hash: 'abc' }]);
  });

  it('returns version content', async () => {
    const historyService = {
      getForFile: jest.fn(),
      getVersion: jest.fn().mockResolvedValue('content'),
      getDiff: jest.fn(),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerHistoryHandlers(ipcMain, historyService);

    const response = await handlers['history:getVersion'](null, 'hash', 'notes/a.md');

    expect(response.ok).toBe(true);
    expect(response.data).toBe('content');
  });

  it('returns diff hunks', async () => {
    const historyService = {
      getForFile: jest.fn(),
      getVersion: jest.fn(),
      getDiff: jest.fn().mockResolvedValue([{ header: '@@' }]),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerHistoryHandlers(ipcMain, historyService);

    const response = await handlers['history:getDiff'](null, 'a', 'b', 'notes/a.md');

    expect(response.ok).toBe(true);
    expect(response.data).toEqual([{ header: '@@' }]);
  });

  it('returns error when history fails', async () => {
    const historyService = {
      getForFile: jest.fn().mockRejectedValue(new Error('fail')),
      getVersion: jest.fn(),
      getDiff: jest.fn(),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerHistoryHandlers(ipcMain, historyService);

    const response = await handlers['history:getForFile'](null, 'notes/a.md');

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('fail');
  });
});
