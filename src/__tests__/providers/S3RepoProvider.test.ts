import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { S3RepoProvider } from '../../backend/providers/S3RepoProvider';
import { ApiErrorCode, S3RepoSettings } from '../../shared/types';

describe('S3RepoProvider', () => {
  const baseSettings: S3RepoSettings = {
    provider: 's3',
    bucket: 'notes-bucket',
    region: 'us-east-1',
    prefix: 'notes',
    localPath: '',
    accessKeyId: 'access-key',
    secretAccessKey: 'secret-key',
    sessionToken: '',
  };

  const tempDirs: string[] = [];

  const createTempDir = async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'notegit-s3-'));
    tempDirs.push(dir);
    return dir;
  };

  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map(async (dir) => {
        await fs.rm(dir, { recursive: true, force: true });
      })
    );
  });

  it('rejects when bucket versioning is not enabled', async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const s3Adapter = {
      configure: jest.fn(),
      getBucketVersioning: jest.fn().mockResolvedValue('Suspended'),
      listObjects: jest.fn(),
      getObject: jest.fn(),
      putObject: jest.fn(),
      deleteObject: jest.fn(),
    };

    const provider = new S3RepoProvider(s3Adapter as any);

    await expect(provider.open(settings)).rejects.toMatchObject({
      code: ApiErrorCode.S3_VERSIONING_REQUIRED,
    });
  });

  it('pulls remote objects on open', async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const s3Adapter = {
      configure: jest.fn(),
      getBucketVersioning: jest.fn().mockResolvedValue('Enabled'),
      listObjects: jest.fn().mockResolvedValue([
        {
          key: 'notes/test.md',
          lastModified: new Date('2024-01-01T10:00:00Z'),
        },
      ]),
      getObject: jest.fn().mockResolvedValue(Buffer.from('# Hello from S3')),
      putObject: jest.fn(),
      deleteObject: jest.fn(),
    };

    const provider = new S3RepoProvider(s3Adapter as any);

    await provider.open(settings);

    const saved = await fs.readFile(path.join(tempDir, 'test.md'), 'utf-8');
    expect(saved).toBe('# Hello from S3');
    expect(s3Adapter.getObject).toHaveBeenCalledWith('notes/test.md');
  });

  it('uploads local changes on push', async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const s3Adapter = {
      configure: jest.fn(),
      getBucketVersioning: jest.fn().mockResolvedValue('Enabled'),
      listObjects: jest.fn().mockResolvedValue([]),
      getObject: jest.fn(),
      putObject: jest.fn().mockResolvedValue(undefined),
      deleteObject: jest.fn(),
    };

    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure(settings);

    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(path.join(tempDir, 'note.md'), 'Local note');

    await provider.push();

    expect(s3Adapter.putObject).toHaveBeenCalledWith(
      'notes/note.md',
      expect.any(Buffer)
    );
  });
});
