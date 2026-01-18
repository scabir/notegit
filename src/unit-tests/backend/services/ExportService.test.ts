import { ExportService } from '../../../backend/services/ExportService';
import { FsAdapter } from '../../../backend/adapters/FsAdapter';
import { ConfigService } from '../../../backend/services/ConfigService';
import { ApiErrorCode, AuthMethod } from '../../../shared/types';
import * as fs from 'fs/promises';

jest.mock('../../../backend/adapters/FsAdapter');
jest.mock('../../../backend/services/ConfigService');
jest.mock('archiver');

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


});
