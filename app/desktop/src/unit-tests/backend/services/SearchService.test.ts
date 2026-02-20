import { SearchService } from "../../../backend/services/SearchService";
import { FsAdapter } from "../../../backend/adapters/FsAdapter";
import { ApiErrorCode } from "../../../shared/types";

jest.mock("../../../backend/adapters/FsAdapter");

describe("SearchService", () => {
  let searchService: SearchService;
  let mockFsAdapter: jest.Mocked<FsAdapter>;

  beforeEach(() => {
    mockFsAdapter = new FsAdapter() as jest.Mocked<FsAdapter>;
    searchService = new SearchService(mockFsAdapter);

    (searchService as any).repoPath = "/test/repo";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("search", () => {
    it("should handle empty query", async () => {
      const results = await searchService.search("");
      expect(results).toEqual([]);
    });

    it("finds matches in content and file name", async () => {
      const files: Record<string, string> = {
        "/test/repo/notes/a.md": "Hello world\\nSecond line",
        "/test/repo/notes/b.txt": "Other file",
        "/test/repo/notes/c.markdown": "hello again",
        "/test/repo/notes/skip.pdf": "skip",
        "/test/repo/notes/sub/inner.md": "hello inside",
      };
      const dirs: Record<string, string[]> = {
        "/test/repo": ["notes", "node_modules", ".hidden", "build"],
        "/test/repo/notes": ["a.md", "b.txt", "c.markdown", "skip.pdf", "sub"],
        "/test/repo/notes/sub": ["inner.md"],
        "/test/repo/node_modules": ["lib.js"],
        "/test/repo/.hidden": ["secret.md"],
        "/test/repo/build": ["bundle.md"],
      };

      mockFsAdapter.readdir.mockImplementation(
        async (dir: string) => dirs[dir] || [],
      );
      mockFsAdapter.stat.mockImplementation(
        async (fullPath: string) =>
          ({
            isDirectory: () => Boolean(dirs[fullPath]),
          }) as any,
      );
      mockFsAdapter.readFile.mockImplementation(async (filePath: string) => {
        if (files[filePath] !== undefined) return files[filePath];
        throw new Error("missing");
      });

      const results = await searchService.search("hello", { maxResults: 10 });

      const paths = results.map((result) => result.filePath).sort();
      expect(paths).toEqual([
        "notes/a.md",
        "notes/c.markdown",
        "notes/sub/inner.md",
      ]);
      expect(results[0].matches.length).toBeGreaterThan(0);
    });

    it("respects the maxResults limit", async () => {
      mockFsAdapter.readdir.mockResolvedValue(["a.md", "b.md"] as any);
      mockFsAdapter.stat.mockResolvedValue({ isDirectory: () => false } as any);
      mockFsAdapter.readFile.mockResolvedValue("hello");

      const results = await searchService.search("hello", { maxResults: 1 });

      expect(results).toHaveLength(1);
    });
  });

  describe("searchRepoWide", () => {
    it("should handle empty query", async () => {
      const results = await searchService.searchRepoWide("");
      expect(results).toEqual([]);
    });

    it("supports regex fallback when regex is invalid", async () => {
      const files: Record<string, string> = {
        "/test/repo/notes/a.md": "Has [ bracket",
      };
      const dirs: Record<string, string[]> = {
        "/test/repo": ["notes"],
        "/test/repo/notes": ["a.md"],
      };

      mockFsAdapter.readdir.mockImplementation(
        async (dir: string) => dirs[dir] || [],
      );
      mockFsAdapter.stat.mockImplementation(
        async (fullPath: string) =>
          ({
            isDirectory: () => Boolean(dirs[fullPath]),
          }) as any,
      );
      mockFsAdapter.readFile.mockImplementation(
        async (filePath: string) => files[filePath],
      );

      const results = await searchService.searchRepoWide("[", {
        useRegex: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0].matches[0].lineContent).toContain("[");
    });
  });

  describe("replaceInRepo", () => {
    it("should replace text in specified files", async () => {
      const testContent = "Hello world, hello universe";
      mockFsAdapter.readFile.mockResolvedValue(testContent);
      mockFsAdapter.writeFile.mockResolvedValue();

      const result = await searchService.replaceInRepo("hello", "goodbye", {
        caseSensitive: false,
        filePaths: ["test.md"],
      });

      expect(result.filesProcessed).toBe(1);
      expect(result.filesModified).toBe(1);
      expect(result.totalReplacements).toBe(2);
      expect(mockFsAdapter.writeFile).toHaveBeenCalled();
    });

    it("should not modify files with no matches", async () => {
      mockFsAdapter.readFile.mockResolvedValue("no matches here");
      mockFsAdapter.writeFile.mockResolvedValue();

      const result = await searchService.replaceInRepo(
        "missing",
        "replacement",
        {
          filePaths: ["test.md"],
        },
      );

      expect(result.filesProcessed).toBe(1);
      expect(result.filesModified).toBe(0);
      expect(mockFsAdapter.writeFile).not.toHaveBeenCalled();
    });

    it("should handle file read errors gracefully", async () => {
      mockFsAdapter.readFile.mockRejectedValue(new Error("File not found"));

      const result = await searchService.replaceInRepo("test", "replacement", {
        filePaths: ["missing.md"],
      });

      expect(result.filesProcessed).toBe(1);
      expect(result.filesModified).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain("File not found");
    });

    it("replaces using regex when enabled", async () => {
      mockFsAdapter.readFile.mockResolvedValue("Hello hello");
      mockFsAdapter.writeFile.mockResolvedValue();

      const result = await searchService.replaceInRepo("Hello", "Hi", {
        caseSensitive: true,
        useRegex: true,
        filePaths: ["test.md"],
      });

      expect(result.filesModified).toBe(1);
      expect(result.totalReplacements).toBe(1);
      expect(mockFsAdapter.writeFile).toHaveBeenCalled();
    });
  });

  describe("repo path validation", () => {
    it("throws when repo path is missing", async () => {
      const service = new SearchService(mockFsAdapter);

      await expect(service.search("test")).rejects.toMatchObject({
        code: ApiErrorCode.REPO_NOT_INITIALIZED,
      });
    });
  });

  // Note: Additional SearchService tests would require complex file system mocking
  // The search functionality is integration-tested through application usage
});
