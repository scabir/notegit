import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { S3RepoProvider } from '../../../backend/providers/S3RepoProvider';
import { ApiErrorCode, S3RepoSettings } from '../../../shared/types';

const hashContent = (content: string) =>
  crypto.createHash('sha256').update(content).digest('hex');

const manifestPath = (dir: string) => path.join(dir, '.notegit', 's3-sync.json');

const readManifest = async (dir: string) => {
  const content = await fs.readFile(manifestPath(dir), 'utf-8');
  return JSON.parse(content);
};

type AdapterOverrides = Partial<{
  configure: jest.Mock;
  getBucketVersioning: jest.Mock;
  listObjects: jest.Mock;
  getObject: jest.Mock;
  putObject: jest.Mock;
  headObject: jest.Mock;
  deleteObject: jest.Mock;
}>;

const createAdapter = (overrides: AdapterOverrides = {}) => {
  return {
    configure: jest.fn(),
    getBucketVersioning: jest.fn().mockResolvedValue('Enabled'),
    listObjects: jest.fn().mockResolvedValue([]),
    getObject: jest.fn(),
    putObject: jest.fn().mockResolvedValue(undefined),
    headObject: jest.fn().mockImplementation(async (key: string) => ({
      key,
      eTag: '"etag-default"',
      lastModified: new Date('2024-01-01T00:00:00Z'),
    })),
    deleteObject: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
};

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
    jest.useRealTimers();
  });

  it('rejects when bucket versioning is not enabled', async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const s3Adapter = createAdapter({
      getBucketVersioning: jest.fn().mockResolvedValue('Suspended'),
    });

    const provider = new S3RepoProvider(s3Adapter as any);

    await expect(provider.open(settings)).rejects.toMatchObject({
      code: ApiErrorCode.S3_VERSIONING_REQUIRED,
    });
  });

  it('pulls remote objects on open and records a manifest', async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const remoteTime = new Date('2024-01-01T10:00:00Z');
    const s3Adapter = createAdapter({
      listObjects: jest.fn().mockResolvedValue([
        {
          key: 'notes/test.md',
          lastModified: remoteTime,
          eTag: '"etag-1"',
        },
      ]),
      getObject: jest.fn().mockResolvedValue(Buffer.from('# Hello from S3')),
    });

    const provider = new S3RepoProvider(s3Adapter as any);

    await provider.open(settings);

    const saved = await fs.readFile(path.join(tempDir, 'test.md'), 'utf-8');
    expect(saved).toBe('# Hello from S3');
    expect(s3Adapter.getObject).toHaveBeenCalledWith('notes/test.md');

    const manifest = await readManifest(tempDir);
    expect(manifest.files['test.md'].remoteETag).toBe('etag-1');
    expect(manifest.files['test.md'].localHash).toBe(hashContent('# Hello from S3'));
  });

  it('uploads local changes on push and stores remote metadata', async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const s3Adapter = createAdapter({
      headObject: jest.fn().mockResolvedValue({
        key: 'notes/note.md',
        eTag: '"etag-upload"',
        lastModified: new Date('2024-01-02T10:00:00Z'),
      }),
    });

    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure(settings);

    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(path.join(tempDir, 'note.md'), 'Local note');

    await provider.push();

    expect(s3Adapter.putObject).toHaveBeenCalledWith('notes/note.md', expect.any(Buffer));
    expect(s3Adapter.headObject).toHaveBeenCalledWith('notes/note.md');

    const manifest = await readManifest(tempDir);
    expect(manifest.files['note.md'].remoteETag).toBe('etag-upload');
  });

  it('downloads remote objects during sync', async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const remoteTime = new Date('2024-01-03T10:00:00Z');
    const s3Adapter = createAdapter({
      listObjects: jest.fn().mockResolvedValue([
        {
          key: 'notes/new.md',
          lastModified: remoteTime,
          eTag: '"etag-remote"',
        },
      ]),
      getObject: jest.fn().mockResolvedValue(Buffer.from('Remote note')),
    });

    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure(settings);
    await fs.mkdir(tempDir, { recursive: true });

    await provider.push();

    const saved = await fs.readFile(path.join(tempDir, 'new.md'), 'utf-8');
    expect(saved).toBe('Remote note');
    expect(s3Adapter.getObject).toHaveBeenCalledWith('notes/new.md');
  });

  it('deletes remote objects removed locally after a baseline sync', async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const baseContent = 'Base note';
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(path.join(tempDir, 'obsolete.md'), baseContent);
    await fs.stat(path.join(tempDir, 'obsolete.md'));

    const manifest = {
      version: 1,
      updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
      files: {
        'obsolete.md': {
          localHash: hashContent(baseContent),
          localMtimeMs: 0,
          remoteETag: 'etag-base',
          remoteLastModifiedMs: new Date('2024-01-01T00:00:00Z').getTime(),
          deleted: false,
        },
      },
    };

    await fs.mkdir(path.join(tempDir, '.notegit'), { recursive: true });
    await fs.writeFile(manifestPath(tempDir), JSON.stringify(manifest, null, 2), 'utf-8');
    await fs.rm(path.join(tempDir, 'obsolete.md'));

    const s3Adapter = createAdapter({
      listObjects: jest.fn().mockResolvedValue([
        {
          key: 'notes/obsolete.md',
          lastModified: new Date('2024-01-01T00:00:00Z'),
          eTag: '"etag-base"',
        },
      ]),
    });

    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure(settings);

    await provider.push();

    expect(s3Adapter.deleteObject).toHaveBeenCalledWith('notes/obsolete.md');

    const updated = await readManifest(tempDir);
    expect(updated.files['obsolete.md'].deleted).toBe(true);
  });

  it('creates a conflict copy when both local and remote changed', async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const baseContent = 'Base';
    const localContent = 'Local v2';
    const remoteContent = 'Remote v2';
    const remoteTime = new Date('2024-01-02T03:04:05Z');

    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(path.join(tempDir, 'note.md'), localContent);
    const stats = await fs.stat(path.join(tempDir, 'note.md'));

    const manifest = {
      version: 1,
      updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
      files: {
        'note.md': {
          localHash: hashContent(baseContent),
          localMtimeMs: stats.mtimeMs - 1000,
          remoteETag: 'etag-base',
          remoteLastModifiedMs: new Date('2024-01-01T00:00:00Z').getTime(),
          deleted: false,
        },
      },
    };

    await fs.mkdir(path.join(tempDir, '.notegit'), { recursive: true });
    await fs.writeFile(manifestPath(tempDir), JSON.stringify(manifest, null, 2), 'utf-8');

    const s3Adapter = createAdapter({
      listObjects: jest.fn().mockResolvedValue([
        {
          key: 'notes/note.md',
          lastModified: remoteTime,
          eTag: '"etag-remote"',
        },
      ]),
      getObject: jest.fn().mockResolvedValue(Buffer.from(remoteContent)),
    });

    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure(settings);

    await provider.push();

    const conflictFile = path.join(tempDir, 'note.s3-conflict-20240102-030405.md');
    const conflictContent = await fs.readFile(conflictFile, 'utf-8');
    const localContentAfter = await fs.readFile(path.join(tempDir, 'note.md'), 'utf-8');

    expect(conflictContent).toBe(remoteContent);
    expect(localContentAfter).toBe(localContent);

    const updated = await readManifest(tempDir);
    expect(updated.files['note.md'].conflict).toBe(true);
    expect(updated.files['note.md'].conflictRemoteETag).toBe('etag-remote');
    expect(updated.files['note.md'].conflictLocalHash).toBe(hashContent(localContent));
  });

  it('ignores conflict copies when uploading', async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(
      path.join(tempDir, 'note.s3-conflict-20240102-030405.md'),
      'Conflict copy'
    );

    const s3Adapter = createAdapter();

    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure(settings);

    await provider.push();

    expect(s3Adapter.putObject).not.toHaveBeenCalled();
    expect(s3Adapter.headObject).not.toHaveBeenCalled();
  });

  it('marks a conflict when remote is deleted and local changed', async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const baseContent = 'Base';
    const localContent = 'Local v2';

    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(path.join(tempDir, 'note.md'), localContent);
    await fs.stat(path.join(tempDir, 'note.md'));

    const manifest = {
      version: 1,
      updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
      files: {
        'note.md': {
          localHash: hashContent(baseContent),
          localMtimeMs: 0,
          remoteETag: 'etag-base',
          remoteLastModifiedMs: new Date('2024-01-01T00:00:00Z').getTime(),
          deleted: false,
        },
      },
    };

    await fs.mkdir(path.join(tempDir, '.notegit'), { recursive: true });
    await fs.writeFile(manifestPath(tempDir), JSON.stringify(manifest, null, 2), 'utf-8');

    const s3Adapter = createAdapter({
      listObjects: jest.fn().mockResolvedValue([]),
    });

    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure(settings);

    await provider.push();

    expect(s3Adapter.deleteObject).not.toHaveBeenCalled();
    expect(s3Adapter.getObject).not.toHaveBeenCalled();

    const updated = await readManifest(tempDir);
    expect(updated.files['note.md'].conflict).toBe(true);
    expect(updated.files['note.md'].conflictRemoteDeleted).toBe(true);
  });

  it('uses the provided interval for auto sync', () => {
    jest.useFakeTimers();

    const tempDir = '/tmp/notegit-s3';
    const settings = { ...baseSettings, localPath: tempDir };

    const s3Adapter = createAdapter();
    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure(settings);

    jest.spyOn(provider, 'pull').mockResolvedValue(undefined);

    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    provider.startAutoSync(45000);

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 45000);

    provider.stopAutoSync();
    setIntervalSpy.mockRestore();
  });

  it('restarts the auto sync timer when called again', () => {
    jest.useFakeTimers();

    const tempDir = '/tmp/notegit-s3';
    const settings = { ...baseSettings, localPath: tempDir };

    const s3Adapter = createAdapter();
    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure(settings);

    jest.spyOn(provider, 'pull').mockResolvedValue(undefined);

    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    provider.startAutoSync(30000);
    provider.startAutoSync(60000);

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);

    provider.stopAutoSync();
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});
