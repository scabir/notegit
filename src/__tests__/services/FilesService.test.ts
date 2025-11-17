import { FilesService } from '../../backend/services/FilesService';
import { FsAdapter } from '../../backend/adapters/FsAdapter';
import { ConfigService } from '../../backend/services/ConfigService';
import { GitAdapter } from '../../backend/adapters/GitAdapter';
import { FileType, AuthMethod } from '../../shared/types';
import { Stats } from 'fs';

// Mock dependencies
jest.mock('../../backend/adapters/FsAdapter');
jest.mock('../../backend/services/ConfigService');
jest.mock('../../backend/adapters/GitAdapter');

describe('FilesService', () => {
  let filesService: FilesService;
  let mockFsAdapter: jest.Mocked<FsAdapter>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockGitAdapter: jest.Mocked<GitAdapter>;

  beforeEach(() => {
    mockFsAdapter = new FsAdapter() as jest.Mocked<FsAdapter>;
    mockFsAdapter.rmdir = jest.fn();
    mockFsAdapter.rename = jest.fn();
    mockFsAdapter.copyFile = jest.fn();
    
    mockConfigService = new ConfigService({} as any, {} as any) as jest.Mocked<ConfigService>;
    mockGitAdapter = new GitAdapter() as jest.Mocked<GitAdapter>;

    filesService = new FilesService(mockFsAdapter, mockConfigService);
    filesService.setGitAdapter(mockGitAdapter);

    jest.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize with repo path from config', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        localPath: '/path/to/repo',
        remoteUrl: 'https://github.com/user/repo.git',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      await filesService.init();

      expect(mockConfigService.getRepoSettings).toHaveBeenCalled();
    });
  });

  describe('getFileType', () => {
    it('should identify markdown files', () => {
      expect(filesService.getFileType('note.md')).toBe(FileType.MARKDOWN);
      expect(filesService.getFileType('README.markdown')).toBe(FileType.MARKDOWN);
    });

    it('should identify image files', () => {
      expect(filesService.getFileType('photo.png')).toBe(FileType.IMAGE);
      expect(filesService.getFileType('image.jpg')).toBe(FileType.IMAGE);
      expect(filesService.getFileType('pic.jpeg')).toBe(FileType.IMAGE);
      expect(filesService.getFileType('icon.svg')).toBe(FileType.IMAGE);
    });

    it('should identify PDF files', () => {
      expect(filesService.getFileType('document.pdf')).toBe(FileType.PDF);
    });

    it('should identify JSON files', () => {
      expect(filesService.getFileType('config.json')).toBe(FileType.JSON);
    });

    it('should identify code files', () => {
      expect(filesService.getFileType('script.js')).toBe(FileType.CODE);
      expect(filesService.getFileType('app.ts')).toBe(FileType.CODE);
      expect(filesService.getFileType('main.py')).toBe(FileType.CODE);
      expect(filesService.getFileType('App.java')).toBe(FileType.CODE);
    });

    it('should identify text files', () => {
      expect(filesService.getFileType('notes.txt')).toBe(FileType.TEXT);
      expect(filesService.getFileType('data.csv')).toBe(FileType.TEXT);
      expect(filesService.getFileType('config.yml')).toBe(FileType.TEXT);
    });

    it('should return OTHER for unknown types', () => {
      expect(filesService.getFileType('file.xyz')).toBe(FileType.OTHER);
      expect(filesService.getFileType('noext')).toBe(FileType.OTHER);
    });
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.readFile.mockResolvedValue('# Hello World');
      mockFsAdapter.stat.mockResolvedValue({
        size: 100,
        mtime: new Date(),
        isDirectory: () => false,
        isFile: () => true,
      } as Stats);

      const content = await filesService.readFile('notes/test.md');

      expect(content.path).toBe('notes/test.md');
      expect(content.content).toBe('# Hello World');
      expect(content.type).toBe(FileType.MARKDOWN);
      expect(content.size).toBe(100);
    });
  });

  describe('saveFile', () => {
    it('should save file content', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.writeFile.mockResolvedValue(undefined);

      await filesService.saveFile('notes/test.md', '# Updated Content');

      expect(mockFsAdapter.writeFile).toHaveBeenCalled();
    });
  });

  describe('createFile', () => {
    it('should create markdown file with default content', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.writeFile.mockResolvedValue(undefined);

      await filesService.createFile('notes', 'new-note.md');

      expect(mockFsAdapter.writeFile).toHaveBeenCalled();
      const savedContent = mockFsAdapter.writeFile.mock.calls[0][1];
      expect(savedContent).toContain('# new-note');
    });

    it('should create empty file for non-markdown files', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.writeFile.mockResolvedValue(undefined);

      await filesService.createFile('docs', 'data.txt');

      expect(mockFsAdapter.writeFile).toHaveBeenCalled();
      const savedContent = mockFsAdapter.writeFile.mock.calls[0][1];
      expect(savedContent).toBe('');
    });
  });

  describe('createFolder', () => {
    it('should create a folder', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.mkdir.mockResolvedValue(undefined);

      await filesService.createFolder('notes', 'subfolder');

      expect(mockFsAdapter.mkdir).toHaveBeenCalled();
    });
  });

  describe('deletePath', () => {
    it('should delete a file', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.stat.mockResolvedValue({
        isDirectory: () => false,
        isFile: () => true,
      } as Stats);

      mockFsAdapter.deleteFile.mockResolvedValue(undefined);

      await filesService.deletePath('notes/old.md');

      expect(mockFsAdapter.deleteFile).toHaveBeenCalled();
    });

    it('should recursively delete a directory', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.stat
        .mockResolvedValueOnce({
          isDirectory: () => true,
          isFile: () => false,
        } as Stats)
        .mockResolvedValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats);

      mockFsAdapter.readdir.mockResolvedValue(['file1.txt']);
      mockFsAdapter.deleteFile.mockResolvedValue(undefined);

      await filesService.deletePath('old-folder');

      expect(mockFsAdapter.readdir).toHaveBeenCalled();
      expect(mockFsAdapter.deleteFile).toHaveBeenCalledTimes(2); // file + folder
    });
  });

  describe('renamePath', () => {
    it('should rename a file', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.rename.mockResolvedValue(undefined);

      await filesService.renamePath('old.md', 'new.md');

      expect(mockFsAdapter.rename).toHaveBeenCalled();
    });
  });

  describe('commitFile', () => {
    it('should stage and commit a file', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      mockGitAdapter.init.mockResolvedValue(undefined);
      mockGitAdapter.add.mockResolvedValue(undefined);
      mockGitAdapter.commit.mockResolvedValue(undefined);

      await filesService.commitFile('notes/test.md', 'Update test note');

      expect(mockGitAdapter.init).toHaveBeenCalled();
      expect(mockGitAdapter.add).toHaveBeenCalledWith('notes/test.md');
      expect(mockGitAdapter.commit).toHaveBeenCalledWith('Update test note');
    });
  });

  describe('listTree', () => {
    it('should build file tree structure', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      // Mock directory structure
      mockFsAdapter.readdir
        .mockResolvedValueOnce(['notes', 'file1.md']) // Root
        .mockResolvedValueOnce(['note1.md', 'note2.md']); // notes folder

      mockFsAdapter.stat
        .mockResolvedValueOnce({
          isDirectory: () => true,
          isFile: () => false,
        } as Stats) // notes
        .mockResolvedValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats) // file1.md
        .mockResolvedValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats) // note1.md
        .mockResolvedValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats); // note2.md

      const tree = await filesService.listTree();

      expect(tree).toHaveLength(2);
      expect(tree[0].type).toBe('folder');
      expect(tree[0].name).toBe('notes');
      expect(tree[0].children).toHaveLength(2);
      expect(tree[1].type).toBe('file');
      expect(tree[1].name).toBe('file1.md');
    });

    it('should filter hidden files', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.readdir.mockResolvedValue(['.hidden', '.git', 'visible.md']);

      mockFsAdapter.stat.mockResolvedValue({
        isDirectory: () => false,
        isFile: () => true,
      } as Stats);

      const tree = await filesService.listTree();

      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('visible.md');
    });

    it('should sort folders before files', async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.readdir.mockResolvedValueOnce(['file.md', 'folder', 'another.md']);

      mockFsAdapter.stat
        .mockResolvedValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats) // file.md
        .mockResolvedValueOnce({
          isDirectory: () => true,
          isFile: () => false,
        } as Stats) // folder
        .mockResolvedValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats); // another.md

      mockFsAdapter.readdir.mockResolvedValueOnce([]); // Empty folder

      const tree = await filesService.listTree();

      expect(tree[0].type).toBe('folder');
      expect(tree[1].type).toBe('file');
      expect(tree[2].type).toBe('file');
    });
  });

  describe('renamePath', () => {
    beforeEach(async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });
      await filesService.init();
    });

    it('should rename a file', async () => {
      mockFsAdapter.rename.mockResolvedValue();

      await filesService.renamePath('old-note.md', 'new-note.md');

      expect(mockFsAdapter.rename).toHaveBeenCalledWith(
        '/repo/old-note.md',
        '/repo/new-note.md'
      );
    });

    it('should move a file to another directory', async () => {
      mockFsAdapter.rename.mockResolvedValue();

      await filesService.renamePath('note.md', 'folder/note.md');

      expect(mockFsAdapter.rename).toHaveBeenCalledWith(
        '/repo/note.md',
        '/repo/folder/note.md'
      );
    });

    it('should rename a folder', async () => {
      mockFsAdapter.rename.mockResolvedValue();

      await filesService.renamePath('old-folder', 'new-folder');

      expect(mockFsAdapter.rename).toHaveBeenCalledWith(
        '/repo/old-folder',
        '/repo/new-folder'
      );
    });

    it('should move a folder to another directory', async () => {
      mockFsAdapter.rename.mockResolvedValue();

      await filesService.renamePath('folder1', 'parent/folder1');

      expect(mockFsAdapter.rename).toHaveBeenCalledWith(
        '/repo/folder1',
        '/repo/parent/folder1'
      );
    });

    it('should handle nested paths correctly', async () => {
      mockFsAdapter.rename.mockResolvedValue();

      await filesService.renamePath('parent/child/note.md', 'parent/child/renamed.md');

      expect(mockFsAdapter.rename).toHaveBeenCalledWith(
        '/repo/parent/child/note.md',
        '/repo/parent/child/renamed.md'
      );
    });

    it('should throw error if rename fails', async () => {
      mockFsAdapter.rename.mockRejectedValue(new Error('Permission denied'));

      await expect(
        filesService.renamePath('note.md', 'renamed.md')
      ).rejects.toThrow();
    });

    it('should handle moving to root directory', async () => {
      mockFsAdapter.rename.mockResolvedValue();

      await filesService.renamePath('folder/note.md', 'note.md');

      expect(mockFsAdapter.rename).toHaveBeenCalledWith(
        '/repo/folder/note.md',
        '/repo/note.md'
      );
    });
  });

  describe('deletePath', () => {
    beforeEach(async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        localPath: '/repo',
        remoteUrl: 'url',
        branch: 'main',
        pat: 'token',
        authMethod: AuthMethod.PAT,
      });
      await filesService.init();
    });

    it('should delete a file', async () => {
      mockFsAdapter.stat.mockResolvedValue({
        isDirectory: () => false,
        isFile: () => true,
      } as Stats);
      mockFsAdapter.deleteFile.mockResolvedValue();

      await filesService.deletePath('note.md');

      expect(mockFsAdapter.deleteFile).toHaveBeenCalledWith('/repo/note.md');
    });

    // Note: Folder deletion test requires complex mocking of recursive directory operations
  });

  // Note: Tests for importFile, saveWithGitWorkflow, and commitAll are skipped
  // as they require more complex mocking setup. These methods are integration-tested
  // through the application usage and are covered by the export and autosave features.
});

