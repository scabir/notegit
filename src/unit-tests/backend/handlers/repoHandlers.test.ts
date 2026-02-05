import { registerRepoHandlers } from '../../../backend/handlers/repoHandlers';
import { ApiErrorCode, REPO_PROVIDERS } from '../../../shared/types';

describe('repoHandlers', () => {
  const createIpcMain = () => {
    const handlers: Record<string, (...args: any[]) => any> = {};
    const ipcMain = {
      handle: jest.fn((channel: string, handler: (...args: any[]) => any) => {
        handlers[channel] = handler;
      }),
    } as any;

    return { ipcMain, handlers };
  };

  it('returns ok for openOrClone', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const repoService = {
      openOrClone: jest.fn().mockResolvedValue({ localPath: '/repo', tree: [], status: {} }),
    } as any;

    registerRepoHandlers(ipcMain, repoService);

    const response = await handlers['repo:openOrClone'](null, { provider: REPO_PROVIDERS.git });

    expect(response.ok).toBe(true);
    expect(repoService.openOrClone).toHaveBeenCalled();
  });

  it('maps openOrClone errors to api errors', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const repoService = {
      openOrClone: jest.fn().mockRejectedValue(new Error('clone failed')),
    } as any;

    registerRepoHandlers(ipcMain, repoService);

    const response = await handlers['repo:openOrClone'](null, { provider: REPO_PROVIDERS.git });

    expect(response.ok).toBe(false);
    expect(response.error?.code).toBe(ApiErrorCode.UNKNOWN_ERROR);
    expect(response.error?.message).toBe('clone failed');
  });

  it('returns status on repo:getStatus', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const repoService = {
      getStatus: jest.fn().mockResolvedValue({ provider: REPO_PROVIDERS.git, ahead: 0, behind: 0 }),
    } as any;

    registerRepoHandlers(ipcMain, repoService);

    const response = await handlers['repo:getStatus'](null);

    expect(response.ok).toBe(true);
    expect(response.data?.provider).toBe(REPO_PROVIDERS.git);
  });

  it('returns error on repo:getStatus failure', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const repoService = {
      getStatus: jest.fn().mockRejectedValue(new Error('status failed')),
    } as any;

    registerRepoHandlers(ipcMain, repoService);

    const response = await handlers['repo:getStatus'](null);

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('status failed');
  });

  it('returns ok for repo:fetch', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const repoService = {
      fetch: jest.fn().mockResolvedValue({ provider: REPO_PROVIDERS.git }),
    } as any;

    registerRepoHandlers(ipcMain, repoService);

    const response = await handlers['repo:fetch'](null);

    expect(response.ok).toBe(true);
    expect(response.data?.provider).toBe(REPO_PROVIDERS.git);
  });

  it('returns error for repo:fetch failures', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const repoService = {
      fetch: jest.fn().mockRejectedValue(new Error('fetch failed')),
    } as any;

    registerRepoHandlers(ipcMain, repoService);

    const response = await handlers['repo:fetch'](null);

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('fetch failed');
  });

  it('returns ok for repo:pull', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const repoService = {
      pull: jest.fn().mockResolvedValue(undefined),
    } as any;

    registerRepoHandlers(ipcMain, repoService);

    const response = await handlers['repo:pull'](null);

    expect(response.ok).toBe(true);
    expect(repoService.pull).toHaveBeenCalled();
  });

  it('returns error for repo:pull failures', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const repoService = {
      pull: jest.fn().mockRejectedValue(new Error('pull failed')),
    } as any;

    registerRepoHandlers(ipcMain, repoService);

    const response = await handlers['repo:pull'](null);

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('pull failed');
  });

  it('returns ok for repo:push', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const repoService = {
      push: jest.fn().mockResolvedValue(undefined),
    } as any;

    registerRepoHandlers(ipcMain, repoService);

    const response = await handlers['repo:push'](null);

    expect(response.ok).toBe(true);
    expect(repoService.push).toHaveBeenCalled();
  });

  it('returns error for repo:push failures', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const repoService = {
      push: jest.fn().mockRejectedValue(new Error('push failed')),
    } as any;

    registerRepoHandlers(ipcMain, repoService);

    const response = await handlers['repo:push'](null);

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('push failed');
  });

  it('returns ok for repo:startAutoPush', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const repoService = {
      startAutoPush: jest.fn(),
    } as any;

    registerRepoHandlers(ipcMain, repoService);

    const response = await handlers['repo:startAutoPush'](null);

    expect(response.ok).toBe(true);
    expect(repoService.startAutoPush).toHaveBeenCalled();
  });

  it('returns error for repo:startAutoPush failures', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const repoService = {
      startAutoPush: jest.fn(() => {
        throw new Error('auto push failed');
      }),
    } as any;

    registerRepoHandlers(ipcMain, repoService);

    const response = await handlers['repo:startAutoPush'](null);

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('auto push failed');
  });
});
