import { LogsService } from '../../../backend/services/LogsService';
import * as fs from 'fs/promises';
import { ApiErrorCode } from '../../../shared/types';

jest.mock('fs/promises');

describe('LogsService', () => {
  let service: LogsService;

  beforeEach(() => {
    service = new LogsService();
    jest.clearAllMocks();
  });

  it('returns a friendly message when log file is missing', async () => {
    (fs.access as jest.Mock).mockRejectedValue(new Error('missing'));

    const result = await service.getLogContent('combined');

    expect(result).toContain('No combined logs yet');
  });

  it('returns empty message when log file is empty', async () => {
    (fs.access as jest.Mock).mockResolvedValue(undefined);
    (fs.readFile as jest.Mock).mockResolvedValue('');

    const result = await service.getLogContent('error');

    expect(result).toContain('Log file is empty');
  });

  it('throws when read fails unexpectedly', async () => {
    (fs.access as jest.Mock).mockResolvedValue(undefined);
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('boom'));

    await expect(service.getLogContent('combined')).rejects.toMatchObject({
      code: ApiErrorCode.UNKNOWN_ERROR,
    });
  });

  it('exports logs to destination', async () => {
    (fs.access as jest.Mock).mockResolvedValue(undefined);
    (fs.copyFile as jest.Mock).mockResolvedValue(undefined);

    await expect(service.exportLogs('combined', '/tmp/out.log')).resolves.toBeUndefined();
  });

  it('throws when export fails', async () => {
    (fs.access as jest.Mock).mockRejectedValue(new Error('missing'));

    await expect(service.exportLogs('error', '/tmp/out.log')).rejects.toMatchObject({
      code: ApiErrorCode.UNKNOWN_ERROR,
    });
  });
});
