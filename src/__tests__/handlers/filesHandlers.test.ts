import { registerFilesHandlers } from '../../backend/handlers/filesHandlers';

describe('filesHandlers', () => {
  const createIpcMain = () => {
    const handlers: Record<string, (...args: any[]) => any> = {};
    const ipcMain = {
      handle: jest.fn((channel: string, handler: (...args: any[]) => any) => {
        handlers[channel] = handler;
      }),
    } as any;

    return { ipcMain, handlers };
  };

  it('returns ok for delete even when s3 queueing fails', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      deletePath: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {
      queueS3Delete: jest.fn().mockRejectedValue(new Error('offline')),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers['files:delete'](null, 'note.md');

    expect(response.ok).toBe(true);
    expect(filesService.deletePath).toHaveBeenCalledWith('note.md');
    expect(repoService.queueS3Delete).toHaveBeenCalledWith('note.md');
  });

  it('returns ok for rename even when s3 queueing fails', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      renamePath: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {
      queueS3Move: jest.fn().mockRejectedValue(new Error('offline')),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers['files:rename'](null, 'old.md', 'new.md');

    expect(response.ok).toBe(true);
    expect(filesService.renamePath).toHaveBeenCalledWith('old.md', 'new.md');
    expect(repoService.queueS3Move).toHaveBeenCalledWith('old.md', 'new.md');
  });
});
