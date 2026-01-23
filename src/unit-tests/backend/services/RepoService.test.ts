import { RepoService } from '../../../backend/services/RepoService';
import type { ConfigService } from '../../../backend/services/ConfigService';
import type { FsAdapter } from '../../../backend/adapters/FsAdapter';

describe('RepoService', () => {
  const createRepoService = () => {
    const gitProvider = {
      type: 'git',
      configure: jest.fn(),
      open: jest.fn(),
      getStatus: jest.fn().mockResolvedValue({}),
      fetch: jest.fn(),
      pull: jest.fn(),
      push: jest.fn(),
      startAutoSync: jest.fn(),
      stopAutoSync: jest.fn(),
    };

    const s3Provider = {
      type: 's3',
      configure: jest.fn(),
      open: jest.fn(),
      getStatus: jest.fn().mockResolvedValue({}),
      fetch: jest.fn(),
      pull: jest.fn(),
      push: jest.fn(),
      startAutoSync: jest.fn(),
      stopAutoSync: jest.fn(),
      queueDelete: jest.fn(),
      queueMove: jest.fn(),
      queueUpload: jest.fn(),
    };

    const mockConfigService = {
      getRepoSettings: jest.fn(),
      getAppSettings: jest.fn(),
      updateRepoSettings: jest.fn(),
    } as unknown as ConfigService;

    const mockFsAdapter = {
      mkdir: jest.fn(),
      exists: jest.fn().mockResolvedValue(false),
    } as unknown as FsAdapter;

    const repoService = new RepoService(
      { git: gitProvider as any, s3: s3Provider as any },
      mockFsAdapter,
      mockConfigService
    );

    return { repoService, gitProvider, s3Provider, mockConfigService, mockFsAdapter };
  };

  it('queueS3Delete uses the s3 provider when repo is s3', async () => {
    const { repoService, s3Provider, mockConfigService } = createRepoService();

    const repoSettings = {
      provider: 's3',
      localPath: '/repo',
      bucket: 'notes-bucket',
      region: 'us-east-1',
      prefix: '',
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
      sessionToken: '',
    };

    mockConfigService.getRepoSettings = jest.fn().mockResolvedValue(repoSettings as any);

    await repoService.queueS3Delete('notes/file.md');

    expect(s3Provider.configure).toHaveBeenCalledWith(repoSettings);
    expect(s3Provider.queueDelete).toHaveBeenCalledWith('notes/file.md');
  });

  it('queueS3Delete is a no-op for git repos', async () => {
    const { repoService, s3Provider, mockConfigService } = createRepoService();

    const repoSettings = {
      provider: 'git',
      localPath: '/repo',
      remoteUrl: 'url',
      branch: 'main',
      pat: 'token',
      authMethod: 'pat',
    };

    mockConfigService.getRepoSettings = jest.fn().mockResolvedValue(repoSettings as any);

    await repoService.queueS3Delete('notes/file.md');

    expect(s3Provider.queueDelete).not.toHaveBeenCalled();
  });

  it('queueS3Move normalizes spaces in new path', async () => {
    const { repoService, s3Provider, mockConfigService } = createRepoService();

    const repoSettings = {
      provider: 's3',
      localPath: '/repo',
      bucket: 'notes-bucket',
      region: 'us-east-1',
      prefix: '',
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
      sessionToken: '',
    };

    mockConfigService.getRepoSettings = jest.fn().mockResolvedValue(repoSettings as any);

    await repoService.queueS3Move('old.md', 'folder/new name.md');

    expect(s3Provider.queueMove).toHaveBeenCalledWith('old.md', 'folder/new-name.md');
  });

  it('refreshAutoSyncSettings starts s3 auto sync when enabled', async () => {
    const { repoService, s3Provider, mockConfigService } = createRepoService();

    const repoSettings = {
      provider: 's3',
      localPath: '/repo',
      bucket: 'notes-bucket',
      region: 'us-east-1',
      prefix: '',
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
      sessionToken: '',
    };

    mockConfigService.getRepoSettings = jest.fn().mockResolvedValue(repoSettings as any);
    mockConfigService.getAppSettings = jest.fn().mockResolvedValue({
      s3AutoSyncEnabled: true,
      s3AutoSyncIntervalSec: 45,
    });

    await repoService.getStatus().catch(() => undefined);
    await repoService.refreshAutoSyncSettings();

    expect(s3Provider.startAutoSync).toHaveBeenCalledWith(45000);
    expect(s3Provider.stopAutoSync).not.toHaveBeenCalled();
  });

  it('refreshAutoSyncSettings stops s3 auto sync when disabled', async () => {
    const { repoService, s3Provider, mockConfigService } = createRepoService();

    const repoSettings = {
      provider: 's3',
      localPath: '/repo',
      bucket: 'notes-bucket',
      region: 'us-east-1',
      prefix: '',
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
      sessionToken: '',
    };

    mockConfigService.getRepoSettings = jest.fn().mockResolvedValue(repoSettings as any);
    mockConfigService.getAppSettings = jest.fn().mockResolvedValue({
      s3AutoSyncEnabled: false,
      s3AutoSyncIntervalSec: 30,
    });

    await repoService.getStatus().catch(() => undefined);
    await repoService.refreshAutoSyncSettings();

    expect(s3Provider.stopAutoSync).toHaveBeenCalled();
    expect(s3Provider.startAutoSync).not.toHaveBeenCalled();
  });

  it('opens a git repo and loads tree', async () => {
    const { repoService, gitProvider, mockConfigService, mockFsAdapter } = createRepoService();
    const filesService = {
      init: jest.fn().mockResolvedValue(undefined),
      listTree: jest.fn().mockResolvedValue([{ id: 'a.md' }]),
    } as any;
    repoService.setFilesService(filesService);

    const response = await repoService.openOrClone({
      provider: 'git',
      remoteUrl: 'https://github.com/user/repo.git',
      branch: 'main',
      localPath: '',
      pat: 'token',
      authMethod: 'pat',
    } as any);

    expect(mockFsAdapter.mkdir).toHaveBeenCalled();
    expect(gitProvider.configure).toHaveBeenCalled();
    expect(gitProvider.open).toHaveBeenCalled();
    expect(mockConfigService.updateRepoSettings).toHaveBeenCalled();
    expect(response.tree).toEqual([{ id: 'a.md' }]);
  });

  it('queues s3 upload when provider is s3', async () => {
    const { repoService, s3Provider, mockConfigService } = createRepoService();

    mockConfigService.getRepoSettings = jest.fn().mockResolvedValue({
      provider: 's3',
      localPath: '/repo',
      bucket: 'notes-bucket',
      region: 'us-east-1',
      prefix: '',
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
      sessionToken: '',
    });

    await repoService.queueS3Upload('notes/a.md');

    expect(s3Provider.queueUpload).toHaveBeenCalledWith('notes/a.md');
  });

  it('prepareRepo restores previous provider', async () => {
    const { repoService, gitProvider, s3Provider } = createRepoService();
    gitProvider.getStatus = jest.fn().mockResolvedValue({ provider: 'git' });
    s3Provider.open = jest.fn().mockRejectedValue(new Error('open failed'));

    await repoService.openOrClone({
      provider: 'git',
      remoteUrl: 'https://github.com/user/repo.git',
      branch: 'main',
      localPath: '/repo',
      pat: 'token',
      authMethod: 'pat',
    } as any);

    await repoService.prepareRepo({
      provider: 's3',
      localPath: '/s3',
      bucket: 'bucket',
      region: 'region',
      prefix: '',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      sessionToken: '',
    } as any).catch(() => undefined);

    expect(gitProvider.startAutoSync).toHaveBeenCalled();
  });
});
