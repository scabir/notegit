import { registerFilesHandlers } from '../../../backend/handlers/filesHandlers';

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

  it('returns ok for save even when s3 queueing fails', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      saveFile: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {
      queueS3Upload: jest.fn().mockRejectedValue(new Error('offline')),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers['files:save'](null, 'note.md', '# content');

    expect(response.ok).toBe(true);
    expect(filesService.saveFile).toHaveBeenCalledWith('note.md', '# content');
    expect(repoService.queueS3Upload).toHaveBeenCalledWith('note.md');
  });

  it('returns ok for saveWithGitWorkflow', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      saveWithGitWorkflow: jest.fn().mockResolvedValue({ pullFailed: true }),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers['files:saveWithGitWorkflow'](null, 'note.md', 'body', true);

    expect(response.ok).toBe(true);
    expect(response.data).toEqual({ pullFailed: true });
    expect(filesService.saveWithGitWorkflow).toHaveBeenCalledWith('note.md', 'body', true);
  });

  it('returns error for saveWithGitWorkflow failures', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      saveWithGitWorkflow: jest.fn().mockRejectedValue(new Error('fail')),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers['files:saveWithGitWorkflow'](null, 'note.md', 'body', false);

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('fail');
  });

  it('returns ok for commit', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitFile: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers['files:commit'](null, 'note.md', 'message');

    expect(response.ok).toBe(true);
    expect(filesService.commitFile).toHaveBeenCalledWith('note.md', 'message');
  });

  it('returns error for commit failures', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitFile: jest.fn().mockRejectedValue(new Error('commit failed')),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers['files:commit'](null, 'note.md', 'message');

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('commit failed');
  });

  it('returns ok for commitAll', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitAll: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers['files:commitAll'](null, 'message');

    expect(response.ok).toBe(true);
    expect(filesService.commitAll).toHaveBeenCalledWith('message');
  });

  it('returns error for commitAll failures', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitAll: jest.fn().mockRejectedValue(new Error('commit all failed')),
    } as any;
    const repoService = {} as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers['files:commitAll'](null, 'message');

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('commit all failed');
  });

  it('returns synced message for non-git commitAndPushAll', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitAll: jest.fn(),
      getGitStatus: jest.fn(),
    } as any;
    const repoService = {
      getStatus: jest.fn().mockResolvedValue({ provider: 's3', hasUncommitted: true }),
      push: jest.fn().mockResolvedValue(undefined),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers['files:commitAndPushAll'](null);

    expect(response.ok).toBe(true);
    expect(response.data?.message).toBe('Synced successfully');
    expect(repoService.push).toHaveBeenCalled();
    expect(filesService.commitAll).not.toHaveBeenCalled();
  });

  it('returns nothing-to-commit message when clean', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitAll: jest.fn(),
      getGitStatus: jest.fn(),
    } as any;
    const repoService = {
      getStatus: jest.fn().mockResolvedValue({ provider: 'git', hasUncommitted: false }),
      push: jest.fn(),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers['files:commitAndPushAll'](null);

    expect(response.ok).toBe(true);
    expect(response.data?.message).toBe('Nothing to commit');
    expect(filesService.commitAll).not.toHaveBeenCalled();
    expect(repoService.push).not.toHaveBeenCalled();
  });

  it('commits and pushes with summary message when changes exist', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitAll: jest.fn().mockResolvedValue(undefined),
      getGitStatus: jest.fn().mockResolvedValue({
        modified: ['a.md'],
        added: ['b.md'],
        deleted: [],
      }),
    } as any;
    const repoService = {
      getStatus: jest.fn().mockResolvedValue({ provider: 'git', hasUncommitted: true }),
      push: jest.fn().mockResolvedValue(undefined),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers['files:commitAndPushAll'](null);

    expect(filesService.commitAll).toHaveBeenCalledWith('Update: a.md, b.md');
    expect(repoService.push).toHaveBeenCalled();
    expect(response.data?.message).toBe('Changes committed and pushed successfully');
  });

  it('returns error for commitAndPushAll failures', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const filesService = {
      commitAll: jest.fn(),
      getGitStatus: jest.fn(),
    } as any;
    const repoService = {
      getStatus: jest.fn().mockRejectedValue(new Error('status failed')),
      push: jest.fn(),
    } as any;

    registerFilesHandlers(ipcMain, filesService, repoService);

    const response = await handlers['files:commitAndPushAll'](null);

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('status failed');
  });
});
