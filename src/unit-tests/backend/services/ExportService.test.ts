import { ExportService } from '../../../backend/services/ExportService';
import { FsAdapter } from '../../../backend/adapters/FsAdapter';
import { ConfigService } from '../../../backend/services/ConfigService';
import { ApiErrorCode, AuthMethod } from '../../../shared/types';
import * as fs from 'fs/promises';
import { dialog } from 'electron';

jest.mock('../../../backend/adapters/FsAdapter');
jest.mock('../../../backend/services/ConfigService');
jest.mock('../../../backend/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
}));
jest.mock('electron', () => ({
  dialog: {
    showSaveDialog: jest.fn(),
  },
  app: {
    getPath: jest.fn(() => '/tmp/notegit-test'),
  },
}));

jest.mock('fs', () => ({
  createWriteStream: jest.fn(() => {
    const stream = {
      on: jest.fn().mockReturnThis(),
      pipe: jest.fn(),
    };
    return stream;
  }),
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  stat: jest.fn((_path: string, callback: (err: NodeJS.ErrnoException | null, stats: any) => void) =>
    callback(null, { isFile: () => true })
  ),
}));

jest.mock('archiver', () => {
  return jest.fn(() => ({
    on: jest.fn(),
    pipe: jest.fn(),
    glob: jest.fn(),
    finalize: jest.fn(),
    pointer: jest.fn(() => 10),
  }));
});

describe('ExportService', () => {
  let exportService: ExportService;
  let mockFsAdapter: jest.Mocked<FsAdapter>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockFsAdapter = new FsAdapter() as jest.Mocked<FsAdapter>;
    mockConfigService = {
      getRepoSettings: jest.fn(),
    } as any;
    exportService = new ExportService(mockFsAdapter, mockConfigService);

    mockConfigService.getRepoSettings.mockResolvedValue({
      provider: 'git',
      localPath: '/test/repo',
      remoteUrl: 'https://github.com/test/repo.git',
      branch: 'main',
      pat: 'test-token',
      authMethod: AuthMethod.PAT,
    });

    jest.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize with repo path from config', async () => {
      await exportService.init();

      expect(mockConfigService.getRepoSettings).toHaveBeenCalled();
    });
  });

  describe('exportNote', () => {
    it('exports note when user selects a path', async () => {
      (dialog.showSaveDialog as jest.Mock).mockResolvedValue({
        canceled: false,
        filePath: '/tmp/note.md',
      });
      const writeFile = fs.writeFile as jest.Mock;
      writeFile.mockResolvedValue(undefined);

      const result = await exportService.exportNote('note.md', '# Hello', 'md');

      expect(result).toBe('/tmp/note.md');
      expect(fs.writeFile).toHaveBeenCalledWith('/tmp/note.md', '# Hello', 'utf-8');
    });

    it('throws validation error when user cancels', async () => {
      (dialog.showSaveDialog as jest.Mock).mockResolvedValue({
        canceled: true,
        filePath: undefined,
      });

      await expect(exportService.exportNote('note.md', '# Hello', 'md')).rejects.toMatchObject({
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    });
  });

  describe('exportRepoAsZip', () => {
    it('exports repository as zip', async () => {
      (dialog.showSaveDialog as jest.Mock).mockResolvedValue({
        canceled: false,
        filePath: '/tmp/repo-export.zip',
      });

      const archiverMock = require('archiver');
      const createWriteStream = require('fs').createWriteStream as jest.Mock;
      let closeHandler: (() => void) | null = null;

      createWriteStream.mockImplementation(() => ({
        on: jest.fn((event: string, handler: () => void) => {
          if (event === 'close') {
            closeHandler = handler;
          }
        }),
      }));

      archiverMock.mockImplementation(() => ({
        on: jest.fn(),
        pipe: jest.fn(),
        glob: jest.fn(),
        pointer: jest.fn(() => 10),
        finalize: jest.fn(() => {
          if (closeHandler) {
            closeHandler();
          }
        }),
      }));

      const result = await exportService.exportRepoAsZip();

      expect(result).toBe('/tmp/repo-export.zip');
      expect(archiverMock).toHaveBeenCalled();
    });

    it('throws validation error when user cancels', async () => {
      (dialog.showSaveDialog as jest.Mock).mockResolvedValue({
        canceled: true,
        filePath: undefined,
      });

      await expect(exportService.exportRepoAsZip()).rejects.toMatchObject({
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    });
  });
});
