import { ConfigService } from '../../../backend/services/ConfigService';
import { FsAdapter } from '../../../backend/adapters/FsAdapter';
import { CryptoAdapter } from '../../../backend/adapters/CryptoAdapter';
import { DEFAULT_APP_SETTINGS, AuthMethod, RepoSettings, GitRepoSettings } from '../../../shared/types';

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
});
