import { registerSearchHandlers } from "../../../backend/handlers/searchHandlers";
import { ApiErrorCode } from "../../../shared/types";

describe("searchHandlers", () => {
  const createIpcMain = () => {
    const handlers: Record<string, (...args: any[]) => any> = {};
    const ipcMain = {
      handle: jest.fn((channel: string, handler: (...args: any[]) => any) => {
        handlers[channel] = handler;
      }),
    } as any;

    return { ipcMain, handlers };
  };

  it("returns search results", async () => {
    const searchService = {
      search: jest.fn().mockResolvedValue([{ filePath: "notes/a.md" }]),
      searchRepoWide: jest.fn(),
      replaceInRepo: jest.fn(),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerSearchHandlers(ipcMain, searchService);

    const response = await handlers["search:query"](null, "test", {
      maxResults: 5,
    });

    expect(response.ok).toBe(true);
    expect(response.data).toEqual([{ filePath: "notes/a.md" }]);
  });

  it("returns repo-wide search results", async () => {
    const searchService = {
      search: jest.fn(),
      searchRepoWide: jest
        .fn()
        .mockResolvedValue([{ filePath: "notes/a.md", matches: [] }]),
      replaceInRepo: jest.fn(),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerSearchHandlers(ipcMain, searchService);

    const response = await handlers["search:repoWide"](null, "test", {
      caseSensitive: false,
    });

    expect(response.ok).toBe(true);
    expect(response.data).toHaveLength(1);
  });

  it("returns replace results", async () => {
    const searchService = {
      search: jest.fn(),
      searchRepoWide: jest.fn(),
      replaceInRepo: jest.fn().mockResolvedValue({
        filesProcessed: 1,
        filesModified: 1,
        totalReplacements: 1,
        errors: [],
      }),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerSearchHandlers(ipcMain, searchService);

    const response = await handlers["search:replaceInRepo"](null, "a", "b", {
      filePaths: ["a.md"],
    });

    expect(response.ok).toBe(true);
    expect(response.data?.filesProcessed).toBe(1);
  });

  it("returns error when search fails", async () => {
    const searchService = {
      search: jest.fn().mockRejectedValue(new Error("fail")),
      searchRepoWide: jest.fn(),
      replaceInRepo: jest.fn(),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerSearchHandlers(ipcMain, searchService);

    const response = await handlers["search:query"](null, "test");

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe("fail");
  });

  it("returns error when repo-wide search fails", async () => {
    const searchService = {
      search: jest.fn(),
      searchRepoWide: jest.fn().mockRejectedValue(new Error("repo fail")),
      replaceInRepo: jest.fn(),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerSearchHandlers(ipcMain, searchService);

    const response = await handlers["search:repoWide"](null, "test");

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe("repo fail");
  });

  it("returns error when replace fails", async () => {
    const searchService = {
      search: jest.fn(),
      searchRepoWide: jest.fn(),
      replaceInRepo: jest.fn().mockRejectedValue(new Error("replace fail")),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerSearchHandlers(ipcMain, searchService);

    const response = await handlers["search:replaceInRepo"](null, "a", "b", {});

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe("replace fail");
  });

  it("localizes coded errors across search operations", async () => {
    const codedError = {
      code: ApiErrorCode.REPO_NOT_INITIALIZED,
      message: "Repository not initialized",
      details: {
        messageKey: "search.errors.repositoryNotInitialized",
      },
    };
    const searchService = {
      search: jest.fn().mockRejectedValueOnce(codedError),
      searchRepoWide: jest.fn().mockRejectedValueOnce(codedError),
      replaceInRepo: jest.fn().mockRejectedValueOnce(codedError),
    } as any;
    const translate = jest.fn(async () => "Localized search error");

    const { ipcMain, handlers } = createIpcMain();
    registerSearchHandlers(ipcMain, searchService, translate);

    const queryResponse = await handlers["search:query"](null, "test");
    const repoWideResponse = await handlers["search:repoWide"](null, "test");
    const replaceResponse = await handlers["search:replaceInRepo"](
      null,
      "a",
      "b",
      {},
    );

    expect(queryResponse.error?.message).toBe("Localized search error");
    expect(repoWideResponse.error?.message).toBe("Localized search error");
    expect(replaceResponse.error?.message).toBe("Localized search error");
  });

  it("uses translated fallback when uncoded errors have no message", async () => {
    const searchService = {
      search: jest.fn().mockRejectedValueOnce({}),
      searchRepoWide: jest.fn().mockRejectedValueOnce({}),
      replaceInRepo: jest.fn().mockRejectedValueOnce({}),
    } as any;
    const translate = jest
      .fn()
      .mockResolvedValueOnce("Failed to search")
      .mockResolvedValueOnce("Failed to perform repo-wide search")
      .mockResolvedValueOnce("Failed to perform repo-wide replace");

    const { ipcMain, handlers } = createIpcMain();
    registerSearchHandlers(ipcMain, searchService, translate);

    const queryResponse = await handlers["search:query"](null, "test");
    const repoWideResponse = await handlers["search:repoWide"](null, "test");
    const replaceResponse = await handlers["search:replaceInRepo"](
      null,
      "a",
      "b",
      {},
    );

    expect(queryResponse.error?.message).toBe("Failed to search");
    expect(repoWideResponse.error?.message).toBe(
      "Failed to perform repo-wide search",
    );
    expect(replaceResponse.error?.message).toBe(
      "Failed to perform repo-wide replace",
    );
  });
});
