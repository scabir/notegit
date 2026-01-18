import { SearchService } from '../../../backend/services/SearchService';
import { FsAdapter } from '../../../backend/adapters/FsAdapter';
import { ConfigService } from '../../../backend/services/ConfigService';
import { ApiErrorCode } from '../../../shared/types';

jest.mock('../../../backend/adapters/FsAdapter');
jest.mock('../../../backend/services/ConfigService');

describe('SearchService', () => {
  let searchService: SearchService;
  let mockFsAdapter: jest.Mocked<FsAdapter>;

  beforeEach(() => {
    mockFsAdapter = new FsAdapter() as jest.Mocked<FsAdapter>;
    searchService = new SearchService(mockFsAdapter);

    (searchService as any).repoPath = '/test/repo';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should handle empty query', async () => {
      const results = await searchService.search('');
      expect(results).toEqual([]);
    });
  });

  describe('searchRepoWide', () => {
    it('should handle empty query', async () => {
      const results = await searchService.searchRepoWide('');
      expect(results).toEqual([]);
    });
  });

  describe('replaceInRepo', () => {
    it('should replace text in specified files', async () => {
      const testContent = 'Hello world, hello universe';
      mockFsAdapter.readFile.mockResolvedValue(testContent);
      mockFsAdapter.writeFile.mockResolvedValue();

      const result = await searchService.replaceInRepo('hello', 'goodbye', {
        caseSensitive: false,
        filePaths: ['test.md'],
      });

      expect(result.filesProcessed).toBe(1);
      expect(result.filesModified).toBe(1);
      expect(result.totalReplacements).toBe(2);
      expect(mockFsAdapter.writeFile).toHaveBeenCalled();
    });

    it('should not modify files with no matches', async () => {
      mockFsAdapter.readFile.mockResolvedValue('no matches here');
      mockFsAdapter.writeFile.mockResolvedValue();

      const result = await searchService.replaceInRepo('missing', 'replacement', {
        filePaths: ['test.md'],
      });

      expect(result.filesProcessed).toBe(1);
      expect(result.filesModified).toBe(0);
      expect(mockFsAdapter.writeFile).not.toHaveBeenCalled();
    });

    it('should handle file read errors gracefully', async () => {
      mockFsAdapter.readFile.mockRejectedValue(new Error('File not found'));

      const result = await searchService.replaceInRepo('test', 'replacement', {
        filePaths: ['missing.md'],
      });

      expect(result.filesProcessed).toBe(1);
      expect(result.filesModified).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('File not found');
    });
  });

  // Note: Additional SearchService tests would require complex file system mocking
  // The search functionality is integration-tested through application usage
});
