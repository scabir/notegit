import * as path from 'path';
import { FsAdapter } from '../adapters/FsAdapter';
import { ApiError, ApiErrorCode } from '../../shared/types/api';
import { logger } from '../utils/logger';

export interface SearchResult {
  filePath: string;
  fileName: string;
  matches: SearchMatch[];
}

export interface SearchMatch {
  lineNumber: number;
  lineContent: string;
  contextBefore: string;
  contextAfter: string;
}

export class SearchService {
  private fsAdapter: FsAdapter;
  private repoPath: string | null = null;

  constructor(fsAdapter: FsAdapter) {
    this.fsAdapter = fsAdapter;
  }

  setRepoPath(repoPath: string): void {
    this.repoPath = repoPath;
    logger.info('Search service repo path set', { repoPath });
  }

  private createError(code: ApiErrorCode, message: string, details: any): ApiError {
    return {
      code,
      message,
      details,
    };
  }

  private async ensureRepoPath(): Promise<void> {
    if (!this.repoPath) {
      throw this.createError(
        ApiErrorCode.REPO_NOT_INITIALIZED,
        'Repository not initialized',
        null
      );
    }
  }

  /**
   * Search for files and content matching the query
   */
  async search(query: string, options?: { maxResults?: number }): Promise<SearchResult[]> {
    await this.ensureRepoPath();

    if (!query || query.trim().length === 0) {
      return [];
    }

    const maxResults = options?.maxResults || 50;
    const queryLower = query.toLowerCase();
    const results: SearchResult[] = [];

    try {
      const files = await this.getAllSearchableFiles(this.repoPath!);

      for (const filePath of files) {
        if (results.length >= maxResults) break;

        const fileName = path.basename(filePath);
        const fileNameLower = fileName.toLowerCase();

        // Check if filename matches
        const fileNameMatches = fileNameLower.includes(queryLower);

        // Read file content
        let content = '';
        try {
          content = await this.fsAdapter.readFile(filePath);
        } catch (error) {
          logger.warn('Failed to read file for search', { filePath, error });
          continue;
        }

        const matches: SearchMatch[] = [];

        // Search in content
        const lines = content.split('\n');
        const contentLower = content.toLowerCase();

        if (contentLower.includes(queryLower)) {
          // Find all lines containing the query
          for (let i = 0; i < lines.length; i++) {
            const lineLower = lines[i].toLowerCase();
            if (lineLower.includes(queryLower)) {
              matches.push({
                lineNumber: i + 1,
                lineContent: lines[i],
                contextBefore: i > 0 ? lines[i - 1] : '',
                contextAfter: i < lines.length - 1 ? lines[i + 1] : '',
              });

              // Limit matches per file
              if (matches.length >= 5) break;
            }
          }
        }

        // Add result if there are content matches or filename matches
        if (matches.length > 0 || fileNameMatches) {
          const relativePath = path.relative(this.repoPath!, filePath);
          results.push({
            filePath: relativePath,
            fileName,
            matches,
          });
        }
      }

      logger.info('Search completed', { query, resultCount: results.length });
      return results;
    } catch (error: any) {
      logger.error('Search failed', { query, error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        'Search failed',
        error
      );
    }
  }

  /**
   * Get all searchable files (.md and .txt) in the repository
   */
  private async getAllSearchableFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    const processDirectory = async (currentPath: string) => {
      try {
        const entries = await this.fsAdapter.readdir(currentPath);

        for (const entryName of entries) {
          const fullPath = path.join(currentPath, entryName);

          // Skip hidden files and directories
          if (entryName.startsWith('.')) {
            continue;
          }

          // Skip node_modules and other common directories
          if (entryName === 'node_modules' || entryName === 'dist' || entryName === 'build') {
            continue;
          }

          // Check if it's a directory or file
          try {
            const stats = await this.fsAdapter.stat(fullPath);
            
            if (stats.isDirectory()) {
              await processDirectory(fullPath);
            } else {
              // Only include .md and .txt files
              const ext = path.extname(entryName).toLowerCase();
              if (ext === '.md' || ext === '.txt' || ext === '.markdown') {
                files.push(fullPath);
              }
            }
          } catch (error: any) {
            // Skip files we can't stat
            logger.warn('Failed to stat file for search', { fullPath, error });
            continue;
          }
        }
      } catch (error: any) {
        logger.warn('Failed to read directory for search', { currentPath, error });
      }
    };

    await processDirectory(dirPath);
    return files;
  }
}

