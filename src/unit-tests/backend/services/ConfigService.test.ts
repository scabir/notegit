import { ConfigService } from '../../../backend/services/ConfigService';
import { FsAdapter } from '../../../backend/adapters/FsAdapter';
import { CryptoAdapter } from '../../../backend/adapters/CryptoAdapter';
import { DEFAULT_APP_SETTINGS, AuthMethod, RepoSettings, GitRepoSettings, ApiErrorCode, Profile } from '../../../shared/types';

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
          provider: 'git',
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
                provider: 'git',
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
        provider: 'git',
        pat: 'decrypted',
      });
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
        provider: 'git',
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

    it('throws when provider is changed', async () => {
      jest.spyOn(configService, 'getRepoSettings').mockResolvedValue({
        provider: 'git',
        remoteUrl: 'url',
        branch: 'main',
        localPath: '/repo',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      await expect(
        configService.updateRepoSettings({
          provider: 's3',
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
            provider: 'git',
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

    it('sets active profile id', async () => {
      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.writeFile.mockResolvedValue(undefined);

      await configService.setActiveProfileId('profile-1');

      expect(mockFsAdapter.writeFile).toHaveBeenCalled();
    });

    it('validates required s3 fields when creating profile', async () => {
      await expect(
        configService.createProfile('S3', {
          provider: 's3',
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

    it('throws when changing profile provider', async () => {
      const profiles: Profile[] = [
        {
          id: 'profile-1',
          name: 'Profile',
          repoSettings: {
            provider: 'git',
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
            provider: 's3',
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
            provider: 'git',
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
          provider: 'git',
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
  });
});
