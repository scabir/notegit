import { GitAdapter } from '../../backend/adapters/GitAdapter';
import { ApiErrorCode } from '../../shared/types';
import simpleGit, { SimpleGit } from 'simple-git';

// Mock simple-git
jest.mock('simple-git');

describe('GitAdapter', () => {
  let gitAdapter: GitAdapter;
  let mockGit: jest.Mocked<SimpleGit>;

  beforeEach(() => {
    gitAdapter = new GitAdapter();

    mockGit = {
      clone: jest.fn(),
      pull: jest.fn(),
      push: jest.fn(),
      add: jest.fn(),
      commit: jest.fn(),
      status: jest.fn(),
      log: jest.fn(),
      show: jest.fn(),
      diff: jest.fn(),
      fetch: jest.fn(),
      addConfig: jest.fn(),
    } as any;

    (simpleGit as jest.Mock).mockReturnValue(mockGit);

    jest.clearAllMocks();
  });

  describe('checkGitInstalled', () => {
    it('should return true when git is installed', async () => {
      const result = await gitAdapter.checkGitInstalled();
      expect(result).toBe(true);
    });
  });

  describe('init', () => {
    it('should initialize git with repo path', async () => {
      await gitAdapter.init('/path/to/repo');
      expect(simpleGit).toHaveBeenCalledWith('/path/to/repo');
    });
  });

  describe('clone', () => {
    it('should clone repository with HTTPS and PAT', async () => {
      mockGit.clone.mockResolvedValue(undefined as any);

      await gitAdapter.clone(
        'https://github.com/user/repo.git',
        '/path/to/local',
        'main',
        'ghp_token123'
      );

      expect(mockGit.clone).toHaveBeenCalledWith(
        'https://ghp_token123@github.com/user/repo.git',
        '/path/to/local',
        ['--branch', 'main']
      );
    });

    it('should clone repository with SSH', async () => {
      mockGit.clone.mockResolvedValue(undefined as any);

      await gitAdapter.clone('git@github.com:user/repo.git', '/path/to/local', 'main');

      expect(mockGit.clone).toHaveBeenCalledWith(
        'git@github.com:user/repo.git',
        '/path/to/local',
        ['--branch', 'main']
      );
    });

    it('should throw error on clone failure', async () => {
      const error = new Error('Authentication failed');
      mockGit.clone.mockRejectedValue(error);

      await expect(
        gitAdapter.clone('https://github.com/user/repo.git', '/path/to/local', 'main', 'token')
      ).rejects.toMatchObject({
        code: ApiErrorCode.GIT_AUTH_FAILED,
        message: expect.stringContaining('Authentication failed'),
      });
    });
  });

  describe('pull', () => {
    it('should pull from remote with PAT', async () => {
      await gitAdapter.init('/repo');

      mockGit.pull.mockResolvedValue({
        files: [],
        summary: {},
      } as any);

      await gitAdapter.pull('ghp_token123');

      expect(mockGit.pull).toHaveBeenCalled();
    });

    it('should pull from remote without PAT', async () => {
      await gitAdapter.init('/repo');

      mockGit.pull.mockResolvedValue({
        files: [],
        summary: {},
      } as any);

      await gitAdapter.pull();

      expect(mockGit.pull).toHaveBeenCalled();
    });
  });

  describe('push', () => {
    it('should push to remote with PAT', async () => {
      await gitAdapter.init('/repo');

      mockGit.push.mockResolvedValue(undefined as any);

      await gitAdapter.push('ghp_token123');

      expect(mockGit.push).toHaveBeenCalled();
    });

    it('should push to remote without PAT', async () => {
      await gitAdapter.init('/repo');

      mockGit.push.mockResolvedValue(undefined as any);

      await gitAdapter.push();

      expect(mockGit.push).toHaveBeenCalled();
    });
  });

  describe('status', () => {
    it('should get repository status', async () => {
      await gitAdapter.init('/repo');

      const mockStatus = {
        current: 'main',
        ahead: 1,
        behind: 0,
        modified: ['file1.md'],
        not_added: ['file2.md'],
        deleted: [],
      };

      mockGit.status.mockResolvedValue(mockStatus as any);

      const status = await gitAdapter.status();

      expect(status.current).toBe('main');
      expect(status.ahead).toBe(1);
      expect(status.behind).toBe(0);
      expect(status.modified.length).toBe(1);
      expect(status.not_added.length).toBe(1);
    });

    it('should return status with all fields', async () => {
      await gitAdapter.init('/repo');

      const mockStatus = {
        current: 'main',
        ahead: 0,
        behind: 0,
        modified: ['a.md', 'b.md'],
        not_added: ['c.md'],
        deleted: ['d.md'],
      };

      mockGit.status.mockResolvedValue(mockStatus as any);

      const status = await gitAdapter.status();

      expect(status.modified.length).toBe(2);
      expect(status.not_added.length).toBe(1);
      expect(status.deleted.length).toBe(1);
    });
  });

  describe('add', () => {
    it('should stage file', async () => {
      await gitAdapter.init('/repo');

      mockGit.add.mockResolvedValue(undefined as any);

      await gitAdapter.add('file.md');

      expect(mockGit.add).toHaveBeenCalledWith('file.md');
    });
  });

  describe('commit', () => {
    it('should commit with message', async () => {
      await gitAdapter.init('/repo');

      mockGit.commit.mockResolvedValue({
        commit: 'abc123',
        summary: {},
      } as any);

      await gitAdapter.commit('Update file');

      expect(mockGit.commit).toHaveBeenCalledWith('Update file');
    });
  });

  describe('log', () => {
    it('should get commit log', async () => {
      await gitAdapter.init('/repo');

      const mockLog = {
        all: [
          {
            hash: 'abc123',
            date: '2024-01-01',
            message: 'Initial commit',
            author_name: 'Test User',
            author_email: 'test@example.com',
          },
        ],
      };

      mockGit.log.mockResolvedValue(mockLog as any);

      const commits = await gitAdapter.log();

      expect(commits).toHaveLength(1);
      expect(commits[0].hash).toBe('abc123');
      expect(commits[0].message).toBe('Initial commit');
    });

    it('should get commit log for specific file', async () => {
      await gitAdapter.init('/repo');

      const mockLog = {
        all: [
          {
            hash: 'abc123',
            date: '2024-01-01',
            message: 'Update file',
            author_name: 'Test User',
            author_email: 'test@example.com',
          },
        ],
      };

      mockGit.log.mockResolvedValue(mockLog as any);

      const commits = await gitAdapter.log('notes/file.md');

      expect(mockGit.log).toHaveBeenCalledWith({
        file: 'notes/file.md',
        maxCount: 100,
      });
      expect(commits).toHaveLength(1);
    });
  });

  describe('show', () => {
    it('should show file content at commit', async () => {
      await gitAdapter.init('/repo');

      mockGit.show.mockResolvedValue('# File content at commit');

      const content = await gitAdapter.show('abc123', 'notes/file.md');

      expect(mockGit.show).toHaveBeenCalledWith(['abc123:notes/file.md']);
      expect(content).toBe('# File content at commit');
    });
  });

  describe('diff', () => {
    it('should get diff between commits', async () => {
      await gitAdapter.init('/repo');

      const mockDiff = `diff --git a/file.md b/file.md
index abc123..def456 100644
--- a/file.md
+++ b/file.md
@@ -1,3 +1,4 @@
 Line 1
-Line 2
+Line 2 modified
+New line
 Line 3`;

      mockGit.diff.mockResolvedValue(mockDiff);

      const diff = await gitAdapter.diff('abc123', 'def456', 'file.md');

      expect(mockGit.diff).toHaveBeenCalledWith(['abc123', 'def456', '--', 'file.md']);
      expect(diff).toBe(mockDiff);
    });
  });

  describe('fetch', () => {
    it('should fetch from remote', async () => {
      await gitAdapter.init('/repo');

      mockGit.fetch.mockResolvedValue({} as any);

      await gitAdapter.fetch();

      expect(mockGit.fetch).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw error when not initialized', async () => {
      const uninitializedAdapter = new GitAdapter();
      
      try {
        await uninitializedAdapter.status();
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('GitAdapter not initialized');
        expect(error.code).toBe(ApiErrorCode.UNKNOWN_ERROR);
      }
    });

    it('should handle pull errors gracefully', async () => {
      await gitAdapter.init('/repo');
      
      mockGit.pull.mockRejectedValue(new Error('Network error'));
      
      await expect(gitAdapter.pull()).rejects.toMatchObject({
        code: ApiErrorCode.GIT_PULL_FAILED,
      });
    });
  });
});

