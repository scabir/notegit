import { registerConfigHandlers } from '../../../backend/handlers/configHandlers';
import { REPO_PROVIDERS } from '../../../shared/types';

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

  it('returns git installation status when checkGitInstalled succeeds', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {} as any;
    const repoService = {} as any;
    const gitAdapter = {
      checkGitInstalled: jest.fn().mockResolvedValue(true),
    } as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:checkGitInstalled'](null);

    expect(response.ok).toBe(true);
    expect(response.data).toBe(true);
    expect(gitAdapter.checkGitInstalled).toHaveBeenCalled();
  });

  it('returns false when checkGitInstalled fails', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {} as any;
    const repoService = {} as any;
    const gitAdapter = {
      checkGitInstalled: jest.fn().mockRejectedValue(new Error('no git')),
    } as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:checkGitInstalled'](null);

    expect(response.ok).toBe(true);
    expect(response.data).toBe(false);
    expect(gitAdapter.checkGitInstalled).toHaveBeenCalled();
  });

  it('returns error when updateRepoSettings fails without code', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      updateRepoSettings: jest.fn().mockRejectedValue(new Error('bad')),
    } as any;
    const repoService = {} as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:updateRepoSettings'](null, {
      provider: REPO_PROVIDERS.git,
      remoteUrl: 'url',
      branch: 'main',
      localPath: '/repo',
      pat: 'token',
      authMethod: 'pat',
    });

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('Failed to update repository settings');
  });

  it('returns ok when updateRepoSettings succeeds', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      updateRepoSettings: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {} as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:updateRepoSettings'](null, {
      provider: REPO_PROVIDERS.git,
      remoteUrl: 'url',
      branch: 'main',
      localPath: '/repo',
      pat: 'token',
      authMethod: 'pat',
    });

    expect(response.ok).toBe(true);
    expect(configService.updateRepoSettings).toHaveBeenCalled();
  });

  it('returns error when profile preparation fails', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const createdProfile = {
      id: 'profile-1',
      name: 'Profile',
      repoSettings: {
        provider: REPO_PROVIDERS.git,
        remoteUrl: 'url',
        branch: 'main',
        localPath: '/repo',
        pat: 'token',
        authMethod: 'pat',
      },
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    };
    const configService = {
      createProfile: jest.fn().mockResolvedValue(createdProfile),
      deleteProfile: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {
      prepareRepo: jest.fn().mockRejectedValue(new Error('prepare failed')),
    } as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:createProfile'](null, 'Profile', {
      provider: REPO_PROVIDERS.git,
      remoteUrl: 'url',
      branch: 'main',
      pat: 'token',
    });

    expect(response.ok).toBe(false);
    expect(configService.deleteProfile).toHaveBeenCalledWith('profile-1');
  });

  it('returns config from getFull', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      getFull: jest.fn().mockResolvedValue({
        appSettings: {
          autoSaveEnabled: false,
          autoSaveIntervalSec: 30,
          s3AutoSyncEnabled: true,
          s3AutoSyncIntervalSec: 20,
          theme: 'system',
          editorPrefs: {
            fontSize: 14,
            lineNumbers: true,
            tabSize: 2,
            showPreview: true,
          },
        },
        repoSettings: null,
        profiles: [],
        activeProfileId: null,
      }),
    } as any;
    const repoService = {} as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:getFull']();

    expect(response.ok).toBe(true);
    expect(response.data?.profiles).toEqual([]);
    expect(configService.getFull).toHaveBeenCalled();
  });

  it('returns error when getFull fails', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      getFull: jest.fn().mockRejectedValue(new Error('boom')),
    } as any;
    const repoService = {} as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:getFull']();

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('Failed to load configuration');
  });

  it('returns profiles and active profile id', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      getProfiles: jest.fn().mockResolvedValue([{ id: 'p1' }]),
      getActiveProfileId: jest.fn().mockResolvedValue('p1'),
    } as any;
    const repoService = {} as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const profilesResponse = await handlers['config:getProfiles']();
    const activeResponse = await handlers['config:getActiveProfileId']();

    expect(profilesResponse.ok).toBe(true);
    expect(profilesResponse.data).toHaveLength(1);
    expect(activeResponse.ok).toBe(true);
    expect(activeResponse.data).toBe('p1');
  });

  it('returns error when getProfiles fails', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      getProfiles: jest.fn().mockRejectedValue(new Error('no profiles')),
    } as any;
    const repoService = {} as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:getProfiles']();

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('Failed to load profiles');
  });

  it('returns error when getActiveProfileId fails', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      getActiveProfileId: jest.fn().mockRejectedValue(new Error('no active')),
    } as any;
    const repoService = {} as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:getActiveProfileId']();

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('Failed to load active profile ID');
  });

  it('creates profile when prepareRepo succeeds', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const createdProfile = {
      id: 'profile-2',
      name: 'Profile',
      repoSettings: {
        provider: REPO_PROVIDERS.git,
        remoteUrl: 'url',
        branch: 'main',
        localPath: '/repo',
        pat: 'token',
        authMethod: 'pat',
      },
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    };
    const configService = {
      createProfile: jest.fn().mockResolvedValue(createdProfile),
      deleteProfile: jest.fn(),
    } as any;
    const repoService = {
      prepareRepo: jest.fn().mockResolvedValue(undefined),
    } as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:createProfile'](null, 'Profile', {
      provider: REPO_PROVIDERS.git,
      remoteUrl: 'url',
      branch: 'main',
      pat: 'token',
    });

    expect(response.ok).toBe(true);
    expect(response.data?.id).toBe('profile-2');
    expect(repoService.prepareRepo).toHaveBeenCalled();
  });

  it('returns error when createProfile fails', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      createProfile: jest.fn().mockRejectedValue(new Error('create failed')),
    } as any;
    const repoService = {} as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:createProfile'](null, 'Profile', {
      provider: REPO_PROVIDERS.git,
      remoteUrl: 'url',
      branch: 'main',
      pat: 'token',
    });

    expect(response.ok).toBe(false);
    expect(response.error?.message).toContain('Failed to create profile');
  });

  it('returns ok for deleteProfile and setActiveProfile', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      deleteProfile: jest.fn().mockResolvedValue(undefined),
      setActiveProfileId: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {} as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const deleteResponse = await handlers['config:deleteProfile'](null, 'p1');
    const activeResponse = await handlers['config:setActiveProfile'](null, 'p1');

    expect(deleteResponse.ok).toBe(true);
    expect(activeResponse.ok).toBe(true);
    expect(configService.deleteProfile).toHaveBeenCalledWith('p1');
    expect(configService.setActiveProfileId).toHaveBeenCalledWith('p1');
  });

  it('returns error when deleteProfile fails', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      deleteProfile: jest.fn().mockRejectedValue(new Error('delete failed')),
    } as any;
    const repoService = {} as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:deleteProfile'](null, 'p1');

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('Failed to delete profile');
  });

  it('returns error when setActiveProfile fails', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      setActiveProfileId: jest.fn().mockRejectedValue(new Error('set failed')),
    } as any;
    const repoService = {} as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:setActiveProfile'](null, 'p1');

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('Failed to set active profile');
  });

  it('returns error for updateAppSettings failure', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      updateAppSettings: jest.fn().mockRejectedValue(new Error('bad')),
    } as any;
    const repoService = {
      refreshAutoSyncSettings: jest.fn(),
    } as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:updateAppSettings'](null, { theme: 'dark' });

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('Failed to update app settings');
  });

  it('returns app settings', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      getAppSettings: jest.fn().mockResolvedValue({ theme: 'light' }),
    } as any;
    const repoService = {} as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:getAppSettings']();

    expect(response.ok).toBe(true);
    expect(response.data?.theme).toBe('light');
  });

  it('returns error when getAppSettings fails', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      getAppSettings: jest.fn().mockRejectedValue(new Error('fail')),
    } as any;
    const repoService = {} as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:getAppSettings']();

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('Failed to load application settings');
  });

  it('returns favorites', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      getFavorites: jest.fn().mockResolvedValue(['note.md']),
    } as any;
    const repoService = {} as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:getFavorites']();

    expect(response.ok).toBe(true);
    expect(response.data).toEqual(['note.md']);
  });

  it('returns error when getFavorites fails', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      getFavorites: jest.fn().mockRejectedValue(new Error('fail')),
    } as any;
    const repoService = {} as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:getFavorites']();

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('Failed to load favorites');
  });

  it('updates favorites', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      updateFavorites: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repoService = {} as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:updateFavorites'](null, ['note.md']);

    expect(response.ok).toBe(true);
    expect(configService.updateFavorites).toHaveBeenCalledWith(['note.md']);
  });

  it('returns error when updateFavorites fails', async () => {
    const { ipcMain, handlers } = createIpcMain();
    const configService = {
      updateFavorites: jest.fn().mockRejectedValue(new Error('fail')),
    } as any;
    const repoService = {} as any;
    const gitAdapter = {} as any;

    registerConfigHandlers(ipcMain, configService, repoService, gitAdapter);

    const response = await handlers['config:updateFavorites'](null, ['note.md']);

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('Failed to save favorites');
  });
});
