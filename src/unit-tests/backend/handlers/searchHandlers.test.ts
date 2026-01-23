import { registerSearchHandlers } from '../../../backend/handlers/searchHandlers';

describe('searchHandlers', () => {
  const createIpcMain = () => {
    const handlers: Record<string, (...args: any[]) => any> = {};
    const ipcMain = {
      handle: jest.fn((channel: string, handler: (...args: any[]) => any) => {
        handlers[channel] = handler;
      }),
    } as any;

    return { ipcMain, handlers };
  };

  it('returns search results', async () => {
    const searchService = {
      search: jest.fn().mockResolvedValue([{ filePath: 'notes/a.md' }]),
      searchRepoWide: jest.fn(),
      replaceInRepo: jest.fn(),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerSearchHandlers(ipcMain, searchService);

    const response = await handlers['search:query'](null, 'test', { maxResults: 5 });

    expect(response.ok).toBe(true);
    expect(response.data).toEqual([{ filePath: 'notes/a.md' }]);
  });

  it('returns repo-wide search results', async () => {
    const searchService = {
      search: jest.fn(),
      searchRepoWide: jest.fn().mockResolvedValue([{ filePath: 'notes/a.md', matches: [] }]),
      replaceInRepo: jest.fn(),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerSearchHandlers(ipcMain, searchService);

    const response = await handlers['search:repoWide'](null, 'test', { caseSensitive: false });

    expect(response.ok).toBe(true);
    expect(response.data).toHaveLength(1);
  });

  it('returns replace results', async () => {
    const searchService = {
      search: jest.fn(),
      searchRepoWide: jest.fn(),
      replaceInRepo: jest.fn().mockResolvedValue({ filesProcessed: 1, filesModified: 1, totalReplacements: 1, errors: [] }),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerSearchHandlers(ipcMain, searchService);

    const response = await handlers['search:replaceInRepo'](null, 'a', 'b', { filePaths: ['a.md'] });

    expect(response.ok).toBe(true);
    expect(response.data?.filesProcessed).toBe(1);
  });

  it('returns error when search fails', async () => {
    const searchService = {
      search: jest.fn().mockRejectedValue(new Error('fail')),
      searchRepoWide: jest.fn(),
      replaceInRepo: jest.fn(),
    } as any;

    const { ipcMain, handlers } = createIpcMain();
    registerSearchHandlers(ipcMain, searchService);

    const response = await handlers['search:query'](null, 'test');

    expect(response.ok).toBe(false);
    expect(response.error?.message).toBe('fail');
  });
});
