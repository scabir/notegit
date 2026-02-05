import { HistoryService } from '../../../backend/services/HistoryService';
import { GitAdapter } from '../../../backend/adapters/GitAdapter';
import { ConfigService } from '../../../backend/services/ConfigService';
import { GitHistoryProvider } from '../../../backend/providers/GitHistoryProvider';
import { AuthMethod, REPO_PROVIDERS } from '../../../shared/types';

jest.mock('../../../backend/adapters/GitAdapter');
jest.mock('../../../backend/services/ConfigService');

describe('HistoryService', () => {
  let historyService: HistoryService;
  let mockGitAdapter: jest.Mocked<GitAdapter>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockS3HistoryProvider: jest.Mocked<{
    type: typeof REPO_PROVIDERS.s3;
    configure: jest.Mock;
    getForFile: jest.Mock;
    getVersion: jest.Mock;
    getDiff: jest.Mock;
  }>;
  let mockLocalHistoryProvider: jest.Mocked<{
    type: typeof REPO_PROVIDERS.local;
    configure: jest.Mock;
    getForFile: jest.Mock;
    getVersion: jest.Mock;
    getDiff: jest.Mock;
  }>;

  beforeEach(() => {
    mockGitAdapter = new GitAdapter() as jest.Mocked<GitAdapter>;
    mockConfigService = new ConfigService({} as any, {} as any) as jest.Mocked<ConfigService>;

    const gitHistoryProvider = new GitHistoryProvider(mockGitAdapter);
    mockS3HistoryProvider = {
      type: REPO_PROVIDERS.s3,
      configure: jest.fn(),
      getForFile: jest.fn(),
      getVersion: jest.fn(),
      getDiff: jest.fn(),
    } as any;
    mockLocalHistoryProvider = {
      type: REPO_PROVIDERS.local,
      configure: jest.fn(),
      getForFile: jest.fn(),
      getVersion: jest.fn(),
      getDiff: jest.fn(),
    } as any;

    historyService = new HistoryService(
      { git: gitHistoryProvider, s3: mockS3HistoryProvider, local: mockLocalHistoryProvider },
      mockConfigService
    );

    jest.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize with repo path from config', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: '/path/to/repo',
        remoteUrl: 'https://github.com/user/repo.git',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      await historyService.init();

      expect(mockConfigService.getRepoSettings).toHaveBeenCalled();
    });
  });

  describe('getForFile', () => {
    it('should get commit history for a file', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      mockGitAdapter.init.mockResolvedValue(undefined);

      const mockCommits = [
        {
          hash: 'abc123',
          date: '2024-01-01T12:00:00Z',
          message: 'Update file',
          author_name: 'Test User',
          author_email: 'test@example.com',
        },
        {
          hash: 'def456',
          date: '2024-01-01T10:00:00Z',
          message: 'Initial commit',
          author_name: 'Test User',
          author_email: 'test@example.com',
        },
      ];

      mockGitAdapter.log.mockResolvedValue(mockCommits as any);

      const history = await historyService.getForFile('notes/file.md');

      expect(mockGitAdapter.log).toHaveBeenCalledWith('notes/file.md');
      expect(history).toHaveLength(2);
      expect(history[0].hash).toBe('abc123');
      expect(history[0].author).toBe('Test User');
    });

    it('should return empty array when no history', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      mockGitAdapter.init.mockResolvedValue(undefined);
      mockGitAdapter.log.mockResolvedValue([]);

      const history = await historyService.getForFile('notes/new-file.md');

      expect(history).toEqual([]);
    });
  });

  describe('getVersion', () => {
    it('should get file content at specific commit', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      mockGitAdapter.init.mockResolvedValue(undefined);
      mockGitAdapter.show.mockResolvedValue('# Old version of file');

      const content = await historyService.getVersion('abc123', 'notes/file.md');

      expect(mockGitAdapter.show).toHaveBeenCalledWith('abc123', 'notes/file.md');
      expect(content).toBe('# Old version of file');
    });
  });

  describe('getDiff', () => {
    it('should get diff between two commits', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      mockGitAdapter.init.mockResolvedValue(undefined);

      const mockDiffOutput = `diff --git a/file.md b/file.md
index abc123..def456 100644
--- a/file.md
+++ b/file.md
@@ -1,3 +1,4 @@
 Line 1
-Line 2
+Line 2 modified
+New line
 Line 3`;

      mockGitAdapter.diff.mockResolvedValue(mockDiffOutput);

      const diff = await historyService.getDiff('abc123', 'def456', 'notes/file.md');

      expect(mockGitAdapter.diff).toHaveBeenCalledWith('abc123', 'def456', 'notes/file.md');
      expect(diff).toHaveLength(1);
      expect(diff[0].oldStart).toBe(1);
      expect(diff[0].oldLines).toBe(3);
      expect(diff[0].newStart).toBe(1);
      expect(diff[0].newLines).toBe(4);
      expect(diff[0].lines.length).toBeGreaterThan(0);
    });

    it('should handle diff with multiple hunks', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      mockGitAdapter.init.mockResolvedValue(undefined);

      const mockDiffOutput = `diff --git a/file.md b/file.md
@@ -1,2 +1,2 @@
 Line 1
-Line 2
+Line 2 modified
@@ -10,2 +10,3 @@
 Line 10
-Line 11
+Line 11 modified
+New line`;

      mockGitAdapter.diff.mockResolvedValue(mockDiffOutput);

      const diff = await historyService.getDiff('notes/file.md', 'abc123', 'def456');

      expect(diff).toHaveLength(2);
    });

    it('should return empty array for no changes', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      mockGitAdapter.init.mockResolvedValue(undefined);
      mockGitAdapter.diff.mockResolvedValue('');

      const diff = await historyService.getDiff('abc123', 'def456', 'notes/file.md');

      expect(diff).toEqual([]);
    });
  });

  describe('s3 provider selection', () => {
    it('uses the s3 provider when repo settings are s3', async () => {
      const repoSettings = {
        provider: REPO_PROVIDERS.s3,
        localPath: '/repo',
        bucket: 'notes-bucket',
        region: 'us-east-1',
        prefix: '',
        accessKeyId: 'access-key',
        secretAccessKey: 'secret-key',
        sessionToken: '',
      };

      mockConfigService.getRepoSettings.mockResolvedValue(repoSettings as any);
      mockS3HistoryProvider.getForFile.mockResolvedValue([]);

      await historyService.getForFile('notes/file.md');

      expect(mockS3HistoryProvider.configure).toHaveBeenCalledWith(repoSettings);
      expect(mockS3HistoryProvider.getForFile).toHaveBeenCalledWith('notes/file.md');
    });
  });

  describe('local provider selection', () => {
    it('uses the local provider when repo settings are local', async () => {
      const repoSettings = {
        provider: REPO_PROVIDERS.local,
        localPath: '/repo',
      };

      mockConfigService.getRepoSettings.mockResolvedValue(repoSettings as any);
      mockLocalHistoryProvider.getForFile.mockResolvedValue([]);

      await historyService.getForFile('notes/file.md');

      expect(mockLocalHistoryProvider.configure).toHaveBeenCalledWith(repoSettings);
      expect(mockLocalHistoryProvider.getForFile).toHaveBeenCalledWith('notes/file.md');
    });
  });
});
