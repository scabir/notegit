import { ConfigService } from '../../../backend/services/ConfigService';
import { FsAdapter } from '../../../backend/adapters/FsAdapter';
import { CryptoAdapter } from '../../../backend/adapters/CryptoAdapter';
import { DEFAULT_APP_SETTINGS, AuthMethod, RepoSettings, GitRepoSettings, S3RepoSettings, ApiErrorCode, Profile, REPO_PROVIDERS } from '../../../shared/types';

type FsExistsMock = jest.MockedFunction<FsAdapter['exists']>;

jest.mock('../../../backend/adapters/FsAdapter');
jest.mock('../../../backend/adapters/CryptoAdapter');

describe('ConfigService', () => {
  let configService: ConfigService;
  let mockFsAdapter: jest.Mocked<FsAdapter>;
  let mockCryptoAdapter: jest.Mocked<CryptoAdapter>;

  beforeEach(() => {
    mockFsAdapter = new FsAdapter() as jest.Mocked<FsAdapter>;
    mockCryptoAdapter = new CryptoAdapter() as jest.Mocked<CryptoAdapter>;
    configService = new ConfigService(mockFsAdapter, mockCryptoAdapter);

    jest.clearAllMocks();
  });

  describe('getFull', () => {
    it('should return default settings if no config files exist', async () => {
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.exists.mockResolvedValue(false);

      const config = await configService.getFull();

      expect(config.appSettings).toEqual(DEFAULT_APP_SETTINGS);
      expect(config.repoSettings).toBeNull();
    });

    it('should load existing app settings', async () => {
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.exists.mockImplementation(async (path: string) => {
        return path.includes('app-settings.json');
      });

      const savedSettings = {
        ...DEFAULT_APP_SETTINGS,
        autoSaveEnabled: true,
        autoSaveIntervalSec: 60,
      };

      mockFsAdapter.readFile.mockResolvedValue(JSON.stringify(savedSettings));

      const config = await configService.getFull();

      expect(config.appSettings.autoSaveEnabled).toBe(true);
      expect(config.appSettings.autoSaveIntervalSec).toBe(60);
    });

    it('should merge saved settings with defaults', async () => {
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.exists.mockImplementation(async (path: string) => {
        return path.includes('app-settings.json');
      });

      mockFsAdapter.readFile.mockResolvedValue(
        JSON.stringify({
          autoSaveEnabled: true,
        })
      );

      const config = await configService.getFull();

      expect(config.appSettings.autoSaveEnabled).toBe(true);
      expect(config.appSettings.theme).toBe(DEFAULT_APP_SETTINGS.theme);
      expect(config.appSettings.editorPrefs).toBeDefined();
      expect(config.appSettings.s3AutoSyncEnabled).toBe(DEFAULT_APP_SETTINGS.s3AutoSyncEnabled);
      expect(config.appSettings.s3AutoSyncIntervalSec).toBe(DEFAULT_APP_SETTINGS.s3AutoSyncIntervalSec);
    });

    it('should create config directory if it does not exist', async () => {
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.exists.mockResolvedValue(false);

      await configService.getFull();

      expect(mockFsAdapter.mkdir).toHaveBeenCalled();
    });
  });

  describe('getAppSettings', () => {
    it('returns defaults when loading fails', async () => {
      mockFsAdapter.exists.mockResolvedValue(true);
      mockFsAdapter.readFile.mockRejectedValue(new Error('bad settings'));

      const settings = await configService.getAppSettings();

      expect(settings).toEqual(DEFAULT_APP_SETTINGS);
    });
  });

  describe('updateAppSettings', () => {
    it('should save app settings to file', async () => {
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.exists.mockResolvedValue(false);
      mockFsAdapter.writeFile.mockResolvedValue(undefined);

      const updates = { autoSaveEnabled: true };
      await configService.updateAppSettings(updates);

      expect(mockFsAdapter.writeFile).toHaveBeenCalled();
      const savedData = JSON.parse(mockFsAdapter.writeFile.mock.calls[0][1]);
      expect(savedData.autoSaveEnabled).toBe(true);
    });

    it('should merge with existing settings', async () => {
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.exists.mockResolvedValue(true);
      mockFsAdapter.readFile.mockResolvedValue(
        JSON.stringify({
          ...DEFAULT_APP_SETTINGS,
          autoSaveEnabled: false,
        })
      );
      mockFsAdapter.writeFile.mockResolvedValue(undefined);

      await configService.updateAppSettings({ autoSaveIntervalSec: 120 });

      const savedData = JSON.parse(mockFsAdapter.writeFile.mock.calls[0][1]);
      expect(savedData.autoSaveEnabled).toBe(false);
      expect(savedData.autoSaveIntervalSec).toBe(120);
    });

    it('should update s3 auto sync settings', async () => {
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.exists.mockResolvedValue(false);
      mockFsAdapter.writeFile.mockResolvedValue(undefined);

      await configService.updateAppSettings({
        s3AutoSyncEnabled: false,
        s3AutoSyncIntervalSec: 120,
      });

      const savedData = JSON.parse(mockFsAdapter.writeFile.mock.calls[0][1]);
      expect(savedData.s3AutoSyncEnabled).toBe(false);
      expect(savedData.s3AutoSyncIntervalSec).toBe(120);
      expect(savedData.autoSaveEnabled).toBe(DEFAULT_APP_SETTINGS.autoSaveEnabled);
    });
  });

  describe('getRepoSettings', () => {
    it('should return null if no repo configured', async () => {
      mockFsAdapter.exists.mockResolvedValue(false);

      const settings = await configService.getRepoSettings();

      expect(settings).toBeNull();
    });

    it('should decrypt PAT when loading', async () => {
      mockFsAdapter.exists.mockResolvedValue(true);

      const encryptedPat = 'encrypted-token';
      const decryptedPat = 'ghp_1234567890';

      mockFsAdapter.readFile.mockResolvedValue(
        JSON.stringify({
          provider: REPO_PROVIDERS.git,
          remoteUrl: 'https://github.com/user/repo.git',
          branch: 'main',
          localPath: '/path/to/repo',
          pat: encryptedPat,
          authMethod: AuthMethod.PAT,
        })
      );

      mockCryptoAdapter.decrypt.mockReturnValue(decryptedPat);

      const settings = await configService.getRepoSettings();

      expect(mockCryptoAdapter.decrypt).toHaveBeenCalledWith(encryptedPat);
      expect((settings as GitRepoSettings | null)?.pat).toBe(decryptedPat);
    });

    it('returns repo settings from active profile', async () => {
      mockFsAdapter.exists.mockImplementation(async (filePath: string) => {
        return filePath.includes('active-profile.json') || filePath.includes('profiles.json');
      });

      mockFsAdapter.readFile.mockImplementation(async (filePath: string) => {
        if (filePath.includes('active-profile.json')) {
          return JSON.stringify({ activeProfileId: 'profile-1' });
        }
        if (filePath.includes('profiles.json')) {
          return JSON.stringify([
            {
              id: 'profile-1',
              name: 'Profile',
              repoSettings: {
                provider: REPO_PROVIDERS.git,
                remoteUrl: 'https://github.com/user/repo.git',
                branch: 'main',
                localPath: '/repo',
                pat: 'encrypted',
                authMethod: AuthMethod.PAT,
              },
              createdAt: Date.now(),
              lastUsedAt: Date.now(),
            },
          ]);
        }
        return '{}';
      });

      mockCryptoAdapter.decrypt.mockReturnValue('decrypted');

      const settings = await configService.getRepoSettings();

      expect(settings).toMatchObject({
        provider: REPO_PROVIDERS.git,
        pat: 'decrypted',
      });
    });

    it('loads local repo settings without decryption', async () => {
      mockFsAdapter.exists.mockResolvedValue(true);

      mockFsAdapter.readFile.mockResolvedValue(
        JSON.stringify({
          provider: REPO_PROVIDERS.local,
          localPath: '/local/repo',
        })
      );

      const settings = await configService.getRepoSettings();

      expect(settings).toMatchObject({
        provider: REPO_PROVIDERS.local,
        localPath: '/local/repo',
      });
      expect(mockCryptoAdapter.decrypt).not.toHaveBeenCalled();
    });

    it('decrypts s3 credentials when loading', async () => {
      mockFsAdapter.exists.mockImplementation(async (filePath: string) => {
        return filePath.includes('repo-settings.json');
      });
      mockFsAdapter.readFile.mockResolvedValue(
        JSON.stringify({
          provider: REPO_PROVIDERS.s3,
          bucket: 'bucket',
          region: 'region',
          prefix: '',
          localPath: '/repo',
          accessKeyId: 'enc-ak',
          secretAccessKey: 'enc-sk',
          sessionToken: 'enc-st',
        })
      );
      mockCryptoAdapter.decrypt.mockImplementation((value) => `dec-${value}`);

      const settings = await configService.getRepoSettings();

      expect(settings).toMatchObject({
        provider: REPO_PROVIDERS.s3,
        accessKeyId: 'dec-enc-ak',
        secretAccessKey: 'dec-enc-sk',
        sessionToken: 'dec-enc-st',
      });
    });

    it('returns null when repo settings fail to load', async () => {
      mockFsAdapter.exists.mockImplementation(async (filePath: string) => {
        return filePath.includes('repo-settings.json');
      });
      mockFsAdapter.readFile.mockRejectedValue(new Error('bad json'));

      const settings = await configService.getRepoSettings();

      expect(settings).toBeNull();
    });
  });

  describe('updateRepoSettings', () => {
    it('should encrypt PAT before saving', async () => {
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.writeFile.mockResolvedValue(undefined);

      const plainPat = 'ghp_1234567890';
      const encryptedPat = 'encrypted-token';

      mockCryptoAdapter.encrypt.mockReturnValue(encryptedPat);

      const settings: RepoSettings = {
        provider: REPO_PROVIDERS.git,
        remoteUrl: 'https://github.com/user/repo.git',
        branch: 'main',
        localPath: '/path/to/repo',
        pat: plainPat,
        authMethod: AuthMethod.PAT as AuthMethod,
      };

      await configService.updateRepoSettings(settings);

      expect(mockCryptoAdapter.encrypt).toHaveBeenCalledWith(plainPat);

      const savedData = JSON.parse(mockFsAdapter.writeFile.mock.calls[0][1]);
      expect(savedData.pat).toBe(encryptedPat);
      expect(savedData.remoteUrl).toBe(settings.remoteUrl);
    });

    it('should encrypt s3 credentials before saving', async () => {
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.writeFile.mockResolvedValue(undefined);
      jest.spyOn(configService, 'getRepoSettings').mockResolvedValue(null);

      mockCryptoAdapter.encrypt.mockImplementation((value) => `enc-${value}`);

      const settings: RepoSettings = {
        provider: REPO_PROVIDERS.s3,
        bucket: 'bucket',
        region: 'region',
        prefix: '',
        localPath: '/repo',
        accessKeyId: 'access',
        secretAccessKey: 'secret',
        sessionToken: 'token',
      };

      await configService.updateRepoSettings(settings);

      const savedData = JSON.parse(mockFsAdapter.writeFile.mock.calls[0][1]);
      expect(savedData.accessKeyId).toBe('enc-access');
      expect(savedData.secretAccessKey).toBe('enc-secret');
      expect(savedData.sessionToken).toBe('enc-token');
    });

    it('should not encrypt local settings', async () => {
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.writeFile.mockResolvedValue(undefined);
      jest.spyOn(configService, 'getRepoSettings').mockResolvedValue(null);

      const settings: RepoSettings = {
        provider: REPO_PROVIDERS.local,
        localPath: '/local',
      };

      await configService.updateRepoSettings(settings);

      const savedData = JSON.parse(mockFsAdapter.writeFile.mock.calls[0][1]);
      expect(savedData).toMatchObject(settings);
      expect(mockCryptoAdapter.encrypt).not.toHaveBeenCalled();
    });

    it('throws when provider is changed', async () => {
      jest.spyOn(configService, 'getRepoSettings').mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        remoteUrl: 'url',
        branch: 'main',
        localPath: '/repo',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      await expect(
        configService.updateRepoSettings({
          provider: REPO_PROVIDERS.s3,
          bucket: 'bucket',
          region: 'region',
          prefix: '',
          localPath: '/repo',
          accessKeyId: 'key',
          secretAccessKey: 'secret',
          sessionToken: '',
        })
      ).rejects.toMatchObject({
        code: ApiErrorCode.REPO_PROVIDER_MISMATCH,
      });
    });
  });

  describe('clearRepoSettings', () => {
    it('should delete repo settings file if it exists', async () => {
      mockFsAdapter.exists.mockResolvedValue(true);
      mockFsAdapter.deleteFile.mockResolvedValue(undefined);

      await configService.clearRepoSettings();

      expect(mockFsAdapter.deleteFile).toHaveBeenCalled();
    });

    it('should not throw if file does not exist', async () => {
      mockFsAdapter.exists.mockResolvedValue(false);

      await expect(configService.clearRepoSettings()).resolves.toBeUndefined();

      expect(mockFsAdapter.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('app state storage', () => {
    it('returns defaults when app state is invalid', async () => {
      mockFsAdapter.exists.mockImplementation(async (filePath: string) =>
        filePath.includes('app-state.json')
      );
      mockFsAdapter.readFile.mockResolvedValue('{bad');

      const state = await configService.getAppState();

      expect(state).toEqual({ expandedFolders: [] });
    });

    it('updates app state', async () => {
      mockFsAdapter.exists.mockResolvedValue(false);
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.writeFile.mockResolvedValue(undefined);

      await configService.updateAppState({ expandedFolders: ['notes'] });

      const savedData = JSON.parse(mockFsAdapter.writeFile.mock.calls[0][1]);
      expect(savedData.expandedFolders).toEqual(['notes']);
    });
  });

  describe('profiles management', () => {
    it('saves profiles with encrypted values', async () => {
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.writeFile.mockResolvedValue(undefined);
      mockCryptoAdapter.encrypt.mockImplementation((value) => `enc:${value}`);

      const profiles: Profile[] = [
        {
          id: 'profile-1',
          name: 'Profile',
          repoSettings: {
            provider: REPO_PROVIDERS.git,
            remoteUrl: 'https://github.com/user/repo.git',
            branch: 'main',
            localPath: '/repo',
            pat: 'token',
            authMethod: AuthMethod.PAT,
          },
          createdAt: Date.now(),
          lastUsedAt: Date.now(),
        },
      ];

      await configService.saveProfiles(profiles);

      const saved = JSON.parse(mockFsAdapter.writeFile.mock.calls[0][1]);
      expect(saved[0].repoSettings.pat).toBe('enc:token');
    });

    it('returns empty list when profiles fail to load', async () => {
      mockFsAdapter.exists.mockResolvedValue(true);
      mockFsAdapter.readFile.mockRejectedValue(new Error('bad profiles'));

      const profiles = await configService.getProfiles();

      expect(profiles).toEqual([]);
    });

    it('returns null when active profile id fails to load', async () => {
      mockFsAdapter.exists.mockResolvedValue(true);
      mockFsAdapter.readFile.mockRejectedValue(new Error('bad active'));

      const activeId = await configService.getActiveProfileId();

      expect(activeId).toBeNull();
    });

    it('sets active profile id', async () => {
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.writeFile.mockResolvedValue(undefined);

      await configService.setActiveProfileId('profile-1');

      expect(mockFsAdapter.writeFile).toHaveBeenCalled();
    });

    it('creates a git profile by default', async () => {
      mockFsAdapter.exists.mockResolvedValue(false);
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.writeFile.mockResolvedValue(undefined);
      mockCryptoAdapter.encrypt.mockImplementation((value) => `enc:${value}`);

      const profile = await configService.createProfile('Git Profile', {
        remoteUrl: 'https://github.com/user/repo.git',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      } as any);

      const gitSettings = profile.repoSettings as GitRepoSettings;
      expect(gitSettings.provider).toBe(REPO_PROVIDERS.git);
      expect(gitSettings.remoteUrl).toBe('https://github.com/user/repo.git');
      expect(gitSettings.localPath).toContain('/tmp/notegit-test/repos');
    });

    it('creates a local profile', async () => {
      mockFsAdapter.exists.mockResolvedValue(false);
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.writeFile.mockResolvedValue(undefined);

      const profile = await configService.createProfile('Local Notes', {
        provider: REPO_PROVIDERS.local,
      } as any);

      expect(profile.repoSettings.provider).toBe(REPO_PROVIDERS.local);
      expect(profile.repoSettings.localPath).toContain('local-notes-local');
    });

    it('creates an s3 profile', async () => {
      mockFsAdapter.exists.mockResolvedValue(false);
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.writeFile.mockResolvedValue(undefined);

      const profile = await configService.createProfile('S3 Profile', {
        provider: REPO_PROVIDERS.s3,
        bucket: 'bucket',
        region: 'region',
        accessKeyId: 'access',
        secretAccessKey: 'secret',
        prefix: 'notes',
      } as any);

      const s3Settings = profile.repoSettings as S3RepoSettings;
      expect(s3Settings.provider).toBe(REPO_PROVIDERS.s3);
      expect(s3Settings.bucket).toBe('bucket');
      expect(s3Settings.prefix).toBe('notes');
    });

    it('validates required s3 fields when creating profile', async () => {
      await expect(
        configService.createProfile('S3', {
          provider: REPO_PROVIDERS.s3,
          bucket: '',
          region: '',
          accessKeyId: '',
          secretAccessKey: '',
        } as any)
      ).rejects.toMatchObject({
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    });

    it('throws when updating unknown profile', async () => {
      jest.spyOn(configService, 'getProfiles').mockResolvedValue([]);

      await expect(configService.updateProfile('missing', { name: 'New' })).rejects.toThrow(
        'Profile not found'
      );
    });

    it('updates an existing profile', async () => {
      const profiles: Profile[] = [
        {
          id: 'profile-1',
          name: 'Profile',
          repoSettings: {
            provider: REPO_PROVIDERS.git,
            remoteUrl: 'https://github.com/user/repo.git',
            branch: 'main',
            localPath: '/repo',
            pat: 'token',
            authMethod: AuthMethod.PAT,
          },
          createdAt: Date.now(),
          lastUsedAt: Date.now(),
        },
      ];

      jest.spyOn(configService, 'getProfiles').mockResolvedValue(profiles);
      jest.spyOn(configService, 'saveProfiles').mockResolvedValue(undefined);

      await configService.updateProfile('profile-1', { name: 'Updated' });

      expect(configService.saveProfiles).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 'profile-1', name: 'Updated' })])
      );
    });

    it('throws when changing profile provider', async () => {
      const profiles: Profile[] = [
        {
          id: 'profile-1',
          name: 'Profile',
          repoSettings: {
            provider: REPO_PROVIDERS.git,
            remoteUrl: 'https://github.com/user/repo.git',
            branch: 'main',
            localPath: '/repo',
            pat: 'token',
            authMethod: AuthMethod.PAT,
          },
          createdAt: Date.now(),
          lastUsedAt: Date.now(),
        },
      ];

      jest.spyOn(configService, 'getProfiles').mockResolvedValue(profiles);

      await expect(
        configService.updateProfile('profile-1', {
          repoSettings: {
            provider: REPO_PROVIDERS.s3,
          } as any,
        })
      ).rejects.toMatchObject({
        code: ApiErrorCode.REPO_PROVIDER_MISMATCH,
      });
    });

    it('deletes active profile and clears active id', async () => {
      const profiles: Profile[] = [
        {
          id: 'profile-1',
          name: 'Profile',
          repoSettings: {
            provider: REPO_PROVIDERS.git,
            remoteUrl: 'https://github.com/user/repo.git',
            branch: 'main',
            localPath: '/repo',
            pat: 'token',
            authMethod: AuthMethod.PAT,
          },
          createdAt: Date.now(),
          lastUsedAt: Date.now(),
        },
      ];

      jest.spyOn(configService, 'getProfiles').mockResolvedValue(profiles);
      jest.spyOn(configService, 'saveProfiles').mockResolvedValue(undefined);
      jest.spyOn(configService, 'getActiveProfileId').mockResolvedValue('profile-1');
      jest.spyOn(configService, 'setActiveProfileId').mockResolvedValue(undefined);

      await configService.deleteProfile('profile-1');

      expect(configService.saveProfiles).toHaveBeenCalledWith([]);
      expect(configService.setActiveProfileId).toHaveBeenCalledWith(null);
    });

    it('throws when deleting an unknown profile', async () => {
      jest.spyOn(configService, 'getProfiles').mockResolvedValue([
        {
          id: 'profile-1',
          name: 'Profile',
          repoSettings: {
            provider: REPO_PROVIDERS.git,
            remoteUrl: 'https://github.com/user/repo.git',
            branch: 'main',
            localPath: '/repo',
            pat: 'token',
            authMethod: AuthMethod.PAT,
          },
          createdAt: Date.now(),
          lastUsedAt: Date.now(),
        },
      ]);

      await expect(configService.deleteProfile('missing')).rejects.toThrow('Profile not found');
    });
  });

  describe('migrateToProfiles', () => {
    it('creates a default profile from legacy repo settings', async () => {
      jest.spyOn(configService, 'getProfiles').mockResolvedValue([]);
      jest.spyOn(configService, 'getActiveProfileId').mockResolvedValue(null);

      mockFsAdapter.exists.mockImplementation(async (filePath: string) => {
        return filePath.includes('repo-settings.json');
      });
      mockFsAdapter.readFile.mockResolvedValue(
        JSON.stringify({
          provider: REPO_PROVIDERS.git,
          remoteUrl: 'https://github.com/user/repo.git',
          branch: 'main',
          localPath: '/repo',
          pat: 'token',
          authMethod: AuthMethod.PAT,
        })
      );

      jest.spyOn(configService, 'saveProfiles').mockResolvedValue(undefined);
      jest.spyOn(configService, 'setActiveProfileId').mockResolvedValue(undefined);

      await configService.migrateToProfiles();

      expect(configService.saveProfiles).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'profile-default',
          }),
        ])
      );
      expect(configService.setActiveProfileId).toHaveBeenCalledWith('profile-default');
    });

    it('returns early when profiles already exist', async () => {
      jest.spyOn(configService, 'getProfiles').mockResolvedValue([
        {
          id: 'profile-1',
          name: 'Profile',
          repoSettings: {
            provider: REPO_PROVIDERS.git,
            remoteUrl: 'https://github.com/user/repo.git',
            branch: 'main',
            localPath: '/repo',
            pat: 'token',
            authMethod: AuthMethod.PAT,
          },
          createdAt: Date.now(),
          lastUsedAt: Date.now(),
        },
      ]);
      jest.spyOn(configService, 'getActiveProfileId').mockResolvedValue(null);

      await configService.migrateToProfiles();

      expect(mockFsAdapter.exists).not.toHaveBeenCalled();
    });

    it('derives profile name from local path when migrating', async () => {
      jest.spyOn(configService, 'getProfiles').mockResolvedValue([]);
      jest.spyOn(configService, 'getActiveProfileId').mockResolvedValue(null);

      mockFsAdapter.exists.mockImplementation(async (filePath: string) => {
        return filePath.includes('repo-settings.json');
      });
      mockFsAdapter.readFile.mockResolvedValue(
        JSON.stringify({
          provider: REPO_PROVIDERS.local,
          localPath: '/tmp/my-notes',
        })
      );

      const saveProfiles = jest.spyOn(configService, 'saveProfiles').mockResolvedValue(undefined);
      const setActiveProfileId = jest.spyOn(configService, 'setActiveProfileId').mockResolvedValue(undefined);

      await configService.migrateToProfiles();

      expect(saveProfiles).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ name: 'my-notes' })])
      );
      expect(setActiveProfileId).toHaveBeenCalled();
    });

    it('handles migration errors without throwing', async () => {
      jest.spyOn(configService, 'getProfiles').mockResolvedValue([]);
      jest.spyOn(configService, 'getActiveProfileId').mockResolvedValue(null);

      mockFsAdapter.exists.mockImplementation(async (filePath: string) => {
        return filePath.includes('repo-settings.json');
      });
      mockFsAdapter.readFile.mockRejectedValue(new Error('fail'));

      await expect(configService.migrateToProfiles()).resolves.toBeUndefined();
    });
  });

  describe('favorites storage', () => {
    beforeEach(() => {
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.exists.mockResolvedValue(false);
      mockFsAdapter.readFile.mockResolvedValue('');
      mockFsAdapter.writeFile.mockResolvedValue(undefined);
    });

    it('returns empty list and creates file when favorites missing', async () => {
      (mockFsAdapter.exists as FsExistsMock).mockResolvedValue(false);

      const favorites = await configService.getFavorites();

      expect(favorites).toEqual([]);
      expect(mockFsAdapter.writeFile).toHaveBeenCalledWith(expect.stringContaining('favorites.json'), '[]');
    });

    it('loads favorites when file exists', async () => {
      (mockFsAdapter.exists as FsExistsMock).mockImplementation(async (path: string) =>
        path.includes('favorites.json')
      );
      mockFsAdapter.readFile.mockResolvedValue(JSON.stringify(['note.md', 'docs/note.md']));

      const favorites = await configService.getFavorites();

      expect(favorites).toEqual(['note.md', 'docs/note.md']);
    });

    it('writes favorites via updateFavorites', async () => {
      const favoritesList = ['note.md'];

      await configService.updateFavorites(favoritesList);

      expect(mockFsAdapter.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('favorites.json'),
        JSON.stringify(favoritesList, null, 2)
      );
    });

    it('returns empty list when favorites fail to load', async () => {
      (mockFsAdapter.exists as FsExistsMock).mockResolvedValue(true);
      mockFsAdapter.readFile.mockRejectedValue(new Error('read failed'));

      const favorites = await configService.getFavorites();

      expect(favorites).toEqual([]);
    });
  });
});
