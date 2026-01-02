import { GitAdapter } from '../adapters/GitAdapter';
import { ConfigService } from './ConfigService';
import {
  CommitEntry,
  DiffHunk,
  DiffLine,
  ApiError,
  ApiErrorCode,
} from '../../shared/types';
import { logger } from '../utils/logger';

export class HistoryService {
  private repoPath: string | null = null;

  constructor(
    private gitAdapter: GitAdapter,
    private configService: ConfigService
  ) {}

  async init(): Promise<void> {
    const repoSettings = await this.configService.getRepoSettings();
    if (repoSettings?.localPath) {
      this.repoPath = repoSettings.localPath;
      await this.gitAdapter.init(this.repoPath);
      logger.debug('HistoryService initialized', { repoPath: this.repoPath });
    }
  }

  async getForFile(filePath: string): Promise<CommitEntry[]> {
    await this.ensureRepoPath();

    try {
      const commits = await this.gitAdapter.log(filePath);
      
      return commits.map((commit: any) => ({
        hash: commit.hash,
        author: commit.author_name,
        email: commit.author_email,
        date: new Date(commit.date),
        message: commit.message,
        files: [], // Not populated for performance
      }));
    } catch (error: any) {
      logger.error('Failed to get file history', { filePath, error });
      throw error;
    }
  }

  async getVersion(commitHash: string, filePath: string): Promise<string> {
    await this.ensureRepoPath();

    try {
      const content = await this.gitAdapter.show(commitHash, filePath);
      return content;
    } catch (error: any) {
      logger.error('Failed to get file version', { commitHash, filePath, error });
      throw error;
    }
  }

  async getDiff(hash1: string, hash2: string, filePath: string): Promise<DiffHunk[]> {
    await this.ensureRepoPath();

    try {
      const diffText = await this.gitAdapter.diff(hash1, hash2, filePath);
      
      const hunks: DiffHunk[] = [];
      const lines = diffText.split('\n');
      
      let currentHunk: DiffHunk | null = null;
      
    for (const line of lines) {
        const hunkMatch = line.match(/^@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
    if (hunkMatch) {
    if (currentHunk) {
            hunks.push(currentHunk);
          }
          currentHunk = {
            oldStart: parseInt(hunkMatch[1]),
            oldLines: parseInt(hunkMatch[2]),
            newStart: parseInt(hunkMatch[3]),
            newLines: parseInt(hunkMatch[4]),
            lines: [],
          };
          continue;
        }
        
    if (currentHunk) {
          let type: 'add' | 'remove' | 'context';
    if (line.startsWith('+')) {
            type = 'add';
          } else if (line.startsWith('-')) {
            type = 'remove';
          } else {
            type = 'context';
          }
          
          currentHunk.lines.push({
            type,
            content: line.substring(1),
          });
        }
      }
      
    if (currentHunk) {
        hunks.push(currentHunk);
      }
      
      return hunks;
    } catch (error: any) {
      logger.error('Failed to get diff', { hash1, hash2, filePath, error });
      throw error;
    }
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
