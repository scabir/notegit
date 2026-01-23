import { FsAdapter } from '../../../backend/adapters/FsAdapter';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ApiErrorCode } from '../../../shared/types';

jest.mock('fs/promises');
jest.mock('fs');

describe('FsAdapter', () => {
  let fsAdapter: FsAdapter;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    fsAdapter = new FsAdapter();
    jest.clearAllMocks();
  });

  describe('readFile', () => {
    it('should read file successfully', async () => {
      const content = 'file content';
      mockFs.readFile.mockResolvedValue(content);

      const result = await fsAdapter.readFile('/test/file.txt');

      expect(result).toBe(content);
      expect(mockFs.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });

    it('should throw FS_NOT_FOUND error when file does not exist', async () => {
      const error: any = new Error('ENOENT');
      error.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);

      await expect(fsAdapter.readFile('/missing/file.txt')).rejects.toMatchObject({
        code: ApiErrorCode.FS_NOT_FOUND,
      });
    });

    it('should throw FS_PERMISSION_DENIED error when access denied', async () => {
      const error: any = new Error('EACCES');
      error.code = 'EACCES';
      mockFs.readFile.mockRejectedValue(error);

      await expect(fsAdapter.readFile('/forbidden/file.txt')).rejects.toMatchObject({
        code: ApiErrorCode.FS_PERMISSION_DENIED,
      });
    });

    it('should throw UNKNOWN_ERROR for other errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('Unknown error'));

      await expect(fsAdapter.readFile('/test/file.txt')).rejects.toMatchObject({
        code: ApiErrorCode.UNKNOWN_ERROR,
      });
    });
  });

  describe('writeFile', () => {
    it('should write file successfully', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      await fsAdapter.writeFile('/test/file.txt', 'content');

      expect(mockFs.writeFile).toHaveBeenCalledWith('/test/file.txt', 'content', 'utf-8');
    });

    it('should create directory if it does not exist', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      await fsAdapter.writeFile('/test/dir/file.txt', 'content');

      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/dir', { recursive: true });
    });

    it('should throw FS_PERMISSION_DENIED on permission error', async () => {
      const error: any = new Error('EACCES');
      error.code = 'EACCES';
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockRejectedValue(error);

      await expect(fsAdapter.writeFile('/forbidden/file.txt', 'content')).rejects.toMatchObject({
        code: ApiErrorCode.FS_PERMISSION_DENIED,
      });
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      mockFs.unlink.mockResolvedValue(undefined);

      await fsAdapter.deleteFile('/test/file.txt');

      expect(mockFs.unlink).toHaveBeenCalledWith('/test/file.txt');
    });

    it('should throw FS_NOT_FOUND when file does not exist', async () => {
      const error: any = new Error('ENOENT');
      error.code = 'ENOENT';
      mockFs.unlink.mockRejectedValue(error);

      await expect(fsAdapter.deleteFile('/missing/file.txt')).rejects.toMatchObject({
        code: ApiErrorCode.FS_NOT_FOUND,
      });
    });

    it('should throw FS_PERMISSION_DENIED when access denied', async () => {
      const error: any = new Error('EACCES');
      error.code = 'EACCES';
      mockFs.unlink.mockRejectedValue(error);

      await expect(fsAdapter.deleteFile('/forbidden/file.txt')).rejects.toMatchObject({
        code: ApiErrorCode.FS_PERMISSION_DENIED,
      });
    });
  });

  describe('rename', () => {
    it('should rename file successfully', async () => {
      mockFs.rename.mockResolvedValue(undefined);

      await fsAdapter.rename('/old/path.txt', '/new/path.txt');

      expect(mockFs.rename).toHaveBeenCalledWith('/old/path.txt', '/new/path.txt');
    });

    it('should throw FS_NOT_FOUND when source does not exist', async () => {
      const error: any = new Error('ENOENT');
      error.code = 'ENOENT';
      mockFs.rename.mockRejectedValue(error);

      await expect(fsAdapter.rename('/missing/file.txt', '/new/file.txt')).rejects.toMatchObject({
        code: ApiErrorCode.FS_NOT_FOUND,
      });
    });

    it('should throw FS_PERMISSION_DENIED when rename is blocked', async () => {
      const error: any = new Error('EACCES');
      error.code = 'EACCES';
      mockFs.rename.mockRejectedValue(error);

      await expect(fsAdapter.rename('/forbidden/file.txt', '/new/file.txt')).rejects.toMatchObject({
        code: ApiErrorCode.FS_PERMISSION_DENIED,
      });
    });
  });

  describe('mkdir', () => {
    it('should create directory successfully', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);

      await fsAdapter.mkdir('/test/dir', { recursive: true });

      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/dir', { recursive: true });
    });

    it('should not throw if directory already exists', async () => {
      const error: any = new Error('EEXIST');
      error.code = 'EEXIST';
      mockFs.mkdir.mockRejectedValue(error);

      await expect(fsAdapter.mkdir('/existing/dir')).resolves.toBeUndefined();
    });

    it('should throw FS_PERMISSION_DENIED on permission error', async () => {
      const error: any = new Error('EACCES');
      error.code = 'EACCES';
      mockFs.mkdir.mockRejectedValue(error);

      await expect(fsAdapter.mkdir('/forbidden/dir')).rejects.toMatchObject({
        code: ApiErrorCode.FS_PERMISSION_DENIED,
      });
    });
  });

  describe('rmdir', () => {
    it('should remove directory recursively', async () => {
      mockFs.rm.mockResolvedValue(undefined);

      await fsAdapter.rmdir('/test/dir', { recursive: true });

      expect(mockFs.rm).toHaveBeenCalledWith('/test/dir', { recursive: true, force: true });
    });

    it('should throw FS_NOT_FOUND for missing directory', async () => {
      const error: any = new Error('ENOENT');
      error.code = 'ENOENT';
      mockFs.rm.mockRejectedValue(error);

      await expect(fsAdapter.rmdir('/missing/dir')).rejects.toMatchObject({
        code: ApiErrorCode.FS_NOT_FOUND,
      });
    });
  });

  describe('readdir', () => {
    it('should list directory contents', async () => {
      const files = ['file1.txt', 'file2.txt'];
      mockFs.readdir.mockResolvedValue(files as any);

      const result = await fsAdapter.readdir('/test/dir');

      expect(result).toEqual(files);
      expect(mockFs.readdir).toHaveBeenCalledWith('/test/dir');
    });

    it('should throw FS_NOT_FOUND when directory does not exist', async () => {
      const error: any = new Error('ENOENT');
      error.code = 'ENOENT';
      mockFs.readdir.mockRejectedValue(error);

      await expect(fsAdapter.readdir('/missing/dir')).rejects.toMatchObject({
        code: ApiErrorCode.FS_NOT_FOUND,
      });
    });

    it('should throw FS_PERMISSION_DENIED when access is blocked', async () => {
      const error: any = new Error('EACCES');
      error.code = 'EACCES';
      mockFs.readdir.mockRejectedValue(error);

      await expect(fsAdapter.readdir('/forbidden/dir')).rejects.toMatchObject({
        code: ApiErrorCode.FS_PERMISSION_DENIED,
      });
    });
  });

  describe('stat', () => {
    it('should return stats for existing path', async () => {
      const stats = { isDirectory: () => false } as any;
      mockFs.stat.mockResolvedValue(stats);

      const result = await fsAdapter.stat('/test/file.txt');

      expect(result).toBe(stats);
    });

    it('should throw FS_NOT_FOUND when stat fails with ENOENT', async () => {
      const error: any = new Error('ENOENT');
      error.code = 'ENOENT';
      mockFs.stat.mockRejectedValue(error);

      await expect(fsAdapter.stat('/missing/file.txt')).rejects.toMatchObject({
        code: ApiErrorCode.FS_NOT_FOUND,
      });
    });
  });

  describe('exists', () => {
    it('should return true if file exists', async () => {
      mockFs.access.mockResolvedValue(undefined);

      const result = await fsAdapter.exists('/test/file.txt');

      expect(result).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      const result = await fsAdapter.exists('/missing/file.txt');

      expect(result).toBe(false);
    });
  });

  describe('copyFile', () => {
    it('should copy file successfully', async () => {
      mockFs.copyFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      await fsAdapter.copyFile('/src/file.txt', '/dest/file.txt');

      expect(mockFs.copyFile).toHaveBeenCalledWith('/src/file.txt', '/dest/file.txt');
    });

    it('should create destination directory if needed', async () => {
      mockFs.copyFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      await fsAdapter.copyFile('/src/file.txt', '/dest/dir/file.txt');

      expect(mockFs.mkdir).toHaveBeenCalledWith('/dest/dir', { recursive: true });
    });

    it('should throw FS_NOT_FOUND if source does not exist', async () => {
      const error: any = new Error('ENOENT');
      error.code = 'ENOENT';
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.copyFile.mockRejectedValue(error);

      await expect(fsAdapter.copyFile('/missing/file.txt', '/dest/file.txt')).rejects.toMatchObject(
        {
          code: ApiErrorCode.FS_NOT_FOUND,
        }
      );
    });

    it('should throw FS_PERMISSION_DENIED on access error', async () => {
      const error: any = new Error('EACCES');
      error.code = 'EACCES';
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.copyFile.mockRejectedValue(error);

      await expect(fsAdapter.copyFile('/src/file.txt', '/dest/file.txt')).rejects.toMatchObject({
        code: ApiErrorCode.FS_PERMISSION_DENIED,
      });
    });
  });

  describe('existsSync', () => {
    it('returns sync existence result', () => {
      const fsSync = require('fs') as { existsSync: jest.Mock };
      fsSync.existsSync.mockReturnValueOnce(true);

      expect(fsAdapter.existsSync('/test/file.txt')).toBe(true);
      expect(fsSync.existsSync).toHaveBeenCalledWith('/test/file.txt');
    });
  });
});
