import { S3HistoryProvider } from '../../../backend/providers/S3HistoryProvider';
import { ApiErrorCode, S3RepoSettings } from '../../../shared/types';

describe('S3HistoryProvider', () => {
  const baseSettings: S3RepoSettings = {
    provider: 's3',
    bucket: 'notes-bucket',
    region: 'us-east-1',
    prefix: 'notes',
    localPath: '/tmp/notegit-s3',
    accessKeyId: 'access-key',
    secretAccessKey: 'secret-key',
    sessionToken: '',
  };

  it('returns history entries sorted by newest first', async () => {
    const s3Adapter = {
      configure: jest.fn(),
      listObjectVersions: jest.fn().mockResolvedValue([
        {
          versionId: 'v1',
          lastModified: new Date('2023-01-01T10:00:00Z'),
          isLatest: false,
        },
        {
          versionId: 'v2',
          lastModified: new Date('2024-01-01T10:00:00Z'),
          isLatest: true,
        },
      ]),
      getObject: jest.fn(),
    };

    const provider = new S3HistoryProvider(s3Adapter as any);
    provider.configure(baseSettings);

    const history = await provider.getForFile('file.md');

    expect(s3Adapter.listObjectVersions).toHaveBeenCalledWith('notes/file.md');
    expect(history[0].hash).toBe('v2');
    expect(history[1].hash).toBe('v1');
  });


  it('rejects when not configured', async () => {
    const s3Adapter = {
      configure: jest.fn(),
      listObjectVersions: jest.fn(),
      getObject: jest.fn(),
    };

    const provider = new S3HistoryProvider(s3Adapter as any);

    await expect(provider.getForFile('file.md')).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  });

  it('handles empty prefixes when building keys', async () => {
    const s3Adapter = {
      configure: jest.fn(),
      listObjectVersions: jest.fn().mockResolvedValue([]),
      getObject: jest.fn(),
    };

    const provider = new S3HistoryProvider(s3Adapter as any);
    provider.configure({ ...baseSettings, prefix: '' });

    await provider.getForFile('file.md');

    expect(s3Adapter.listObjectVersions).toHaveBeenCalledWith('file.md');
  });

  it('returns object content for a version', async () => {
    const s3Adapter = {
      configure: jest.fn(),
      listObjectVersions: jest.fn(),
      getObject: jest.fn().mockResolvedValue(Buffer.from('hello')),
    };

    const provider = new S3HistoryProvider(s3Adapter as any);
    provider.configure(baseSettings);

    const content = await provider.getVersion('v1', 'file.md');

    expect(s3Adapter.getObject).toHaveBeenCalledWith('notes/file.md', 'v1');
    expect(content).toBe('hello');
  });

  it('throws for diff requests', async () => {
    const s3Adapter = {
      configure: jest.fn(),
      listObjectVersions: jest.fn(),
      getObject: jest.fn(),
    };

    const provider = new S3HistoryProvider(s3Adapter as any);
    provider.configure(baseSettings);

    await expect(provider.getDiff('a', 'b', 'file.md')).rejects.toMatchObject({
      code: ApiErrorCode.S3_SYNC_FAILED,
    });
  });
});
