import { S3Adapter } from '../../../backend/adapters/S3Adapter';
import { ApiErrorCode } from '../../../shared/types';

jest.mock('@aws-sdk/client-s3', () => {
  const sendMock = jest.fn();
  return {
    S3Client: jest.fn(() => ({ send: sendMock })),
    ListObjectsV2Command: jest.fn((input) => ({ input })),
    GetObjectCommand: jest.fn((input) => ({ input })),
    PutObjectCommand: jest.fn((input) => ({ input })),
    DeleteObjectCommand: jest.fn((input) => ({ input })),
    GetBucketVersioningCommand: jest.fn((input) => ({ input })),
    ListObjectVersionsCommand: jest.fn((input) => ({ input })),
    __sendMock: sendMock,
  };
});

describe('S3Adapter', () => {
  let adapter: S3Adapter;
  let sendMock: jest.Mock;

  beforeEach(() => {
    sendMock = (jest.requireMock('@aws-sdk/client-s3') as any).__sendMock;
    sendMock.mockReset();
    adapter = new S3Adapter();
    adapter.configure({
      provider: 's3',
      bucket: 'notes-bucket',
      region: 'us-east-1',
      prefix: '',
      localPath: '/tmp/notegit-s3',
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
      sessionToken: '',
    });
  });

  it('paginates listObjects', async () => {
    sendMock
      .mockResolvedValueOnce({
        Contents: [
          {
            Key: 'notes/a.md',
            LastModified: new Date('2024-01-01T10:00:00Z'),
            Size: 10,
          },
        ],
        IsTruncated: true,
        NextContinuationToken: 'token-1',
      })
      .mockResolvedValueOnce({
        Contents: [
          {
            Key: 'notes/b.md',
            LastModified: new Date('2024-01-02T10:00:00Z'),
            Size: 20,
          },
        ],
        IsTruncated: false,
      });

    const results = await adapter.listObjects('notes/');

    expect(results.map((item) => item.key)).toEqual(['notes/a.md', 'notes/b.md']);
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock.mock.calls[0][0].input).toMatchObject({
      Bucket: 'notes-bucket',
      Prefix: 'notes/',
      ContinuationToken: undefined,
    });
    expect(sendMock.mock.calls[1][0].input).toMatchObject({
      Bucket: 'notes-bucket',
      Prefix: 'notes/',
      ContinuationToken: 'token-1',
    });
  });

  it('maps auth errors to S3_AUTH_FAILED', async () => {
    sendMock.mockRejectedValue({ name: 'AccessDenied' });

    await expect(adapter.getBucketVersioning()).rejects.toMatchObject({
      code: ApiErrorCode.S3_AUTH_FAILED,
    });
  });

  it('maps non-auth errors to S3_SYNC_FAILED', async () => {
    sendMock.mockRejectedValue(new Error('boom'));

    await expect(adapter.listObjects('notes/')).rejects.toMatchObject({
      code: ApiErrorCode.S3_SYNC_FAILED,
    });
  });
});
