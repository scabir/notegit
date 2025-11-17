import * as path from 'path';
import * as fs from 'fs/promises';
import archiver from 'archiver';
import { dialog } from 'electron';
import { FsAdapter } from '../adapters/FsAdapter';
import { ConfigService } from './ConfigService';
import { ApiError, ApiErrorCode } from '../../shared/types';
import { logger } from '../utils/logger';
import { createWriteStream } from 'fs';

export class ExportService {
  private repoPath: string | null = null;

  constructor(
    private fsAdapter: FsAdapter,
    private configService: ConfigService
  ) {}

  /**
   * Initialize with repository path
   */
  async init(): Promise<void> {
    const repoSettings = await this.configService.getRepoSettings();
    if (repoSettings?.localPath) {
      this.repoPath = repoSettings.localPath;
      logger.debug('ExportService initialized', { repoPath: this.repoPath });
    }
  }

  /**
   * Export current note to .md or .txt file
   * Shows save dialog and writes content to selected file
   */
  async exportNote(
    fileName: string,
    content: string,
    defaultExtension: 'md' | 'txt' = 'md'
  ): Promise<string> {
    try {
      // Show save dialog
      const result = await dialog.showSaveDialog({
        title: 'Export Note',
        defaultPath: fileName.replace(/\.(md|txt)$/, '') + `.${defaultExtension}`,
        filters: [
          { name: 'Markdown Files', extensions: ['md'] },
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['createDirectory', 'showOverwriteConfirmation'],
      });

      if (result.canceled || !result.filePath) {
        throw this.createError(
          ApiErrorCode.VALIDATION_ERROR,
          'Export cancelled by user',
          null
        );
      }

      const exportPath = result.filePath;

      // Write content to file
      await fs.writeFile(exportPath, content, 'utf-8');

      logger.info('Note exported successfully', { exportPath });
      return exportPath;
    } catch (error: any) {
      if (error.code === ApiErrorCode.VALIDATION_ERROR) {
        throw error;
      }
      logger.error('Failed to export note', { fileName, error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to export note: ${error.message}`,
        error
      );
    }
  }

  /**
   * Export entire repository as a zip archive
   * Shows save dialog and creates zip of repo (excluding .git)
   */
  async exportRepoAsZip(): Promise<string> {
    await this.ensureRepoPath();

    try {
      // Show save dialog
      const repoName = path.basename(this.repoPath!);
      const result = await dialog.showSaveDialog({
        title: 'Export Repository as Zip',
        defaultPath: `${repoName}-export.zip`,
        filters: [
          { name: 'Zip Archives', extensions: ['zip'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['createDirectory', 'showOverwriteConfirmation'],
      });

      if (result.canceled || !result.filePath) {
        throw this.createError(
          ApiErrorCode.VALIDATION_ERROR,
          'Export cancelled by user',
          null
        );
      }

      const zipPath = result.filePath;

      // Create zip archive
      await this.createZipArchive(this.repoPath!, zipPath);

      logger.info('Repository exported as zip', { zipPath });
      return zipPath;
    } catch (error: any) {
      if (error.code === ApiErrorCode.VALIDATION_ERROR) {
        throw error;
      }
      logger.error('Failed to export repository as zip', { error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to export repository: ${error.message}`,
        error
      );
    }
  }

  /**
   * Create a zip archive of the repository
   */
  private async createZipArchive(sourcePath: string, zipPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      // Handle stream events
      output.on('close', () => {
        logger.debug('Zip archive created', {
          zipPath,
          bytes: archive.pointer(),
        });
        resolve();
      });

      archive.on('error', (err) => {
        logger.error('Zip archive error', { err });
        reject(err);
      });

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          logger.warn('Zip archive warning', { err });
        } else {
          reject(err);
        }
      });

      // Pipe archive data to the file
      archive.pipe(output);

      // Add files to archive, excluding .git directory
      archive.glob('**/*', {
        cwd: sourcePath,
        ignore: ['.git/**', 'node_modules/**'],
        dot: true,
      });

      // Finalize the archive
      archive.finalize();
    });
  }

  private async ensureRepoPath(): Promise<void> {
    if (!this.repoPath) {
      await this.init();
    }

    if (!this.repoPath) {
      throw this.createError(
        ApiErrorCode.VALIDATION_ERROR,
        'No repository configured',
        null
      );
    }
  }

  private createError(code: ApiErrorCode, message: string, details?: any): ApiError {
    return {
      code,
      message,
      details,
    };
  }
}
