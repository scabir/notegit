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

  /**
   * Search for text across all markdown files in the repo
   * Returns detailed match information for find and replace
   */
  async searchRepoWide(
    query: string,
    options?: { caseSensitive?: boolean; useRegex?: boolean }
  ): Promise<RepoWideSearchResult[]> {
    await this.ensureRepoPath();

    if (!query || query.trim().length === 0) {
      return [];
    }

    const results: RepoWideSearchResult[] = [];
    const caseSensitive = options?.caseSensitive || false;
    const useRegex = options?.useRegex || false;

    try {
      // Get all markdown files
      const files = await this.getAllMarkdownFiles(this.repoPath!);

      for (const filePath of files) {
        const relativePath = path.relative(this.repoPath!, filePath);
        const fileMatches: RepoWideMatch[] = [];

        try {
          const content = await this.fsAdapter.readFile(filePath);
          const lines = content.split('\n');

          // Search each line
          for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const matches = this.findMatchesInLine(line, query, caseSensitive, useRegex);

            for (const match of matches) {
              fileMatches.push({
                lineNumber: lineIndex + 1,
                lineContent: line,
                matchStart: match.start,
                matchEnd: match.end,
                contextBefore: lineIndex > 0 ? lines[lineIndex - 1] : '',
                contextAfter: lineIndex < lines.length - 1 ? lines[lineIndex + 1] : '',
              });
            }
          }

          if (fileMatches.length > 0) {
            results.push({
              filePath: relativePath,
              fileName: path.basename(filePath),
              fullPath: filePath,
              matches: fileMatches,
            });
          }
        } catch (error: any) {
          logger.warn('Failed to read file for repo-wide search', { filePath, error });
          continue;
        }
      }

      logger.info('Repo-wide search completed', {
        query,
        filesScanned: files.length,
        filesWithMatches: results.length,
        totalMatches: results.reduce((sum, r) => sum + r.matches.length, 0),
      });

      return results;
    } catch (error: any) {
      logger.error('Repo-wide search failed', { error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Repo-wide search failed: ${error.message}`,
        error
      );
    }
  }

  /**
   * Replace text across multiple files in the repo
   */
  async replaceInRepo(
    query: string,
    replacement: string,
    options: {
      caseSensitive?: boolean;
      useRegex?: boolean;
      filePaths?: string[]; // If provided, only replace in these files
    }
  ): Promise<ReplaceResult> {
    await this.ensureRepoPath();

    const caseSensitive = options?.caseSensitive || false;
    const useRegex = options?.useRegex || false;
    let filesToProcess: string[] = [];

    try {
      // Determine which files to process
      if (options.filePaths && options.filePaths.length > 0) {
        // Convert relative paths to full paths
        filesToProcess = options.filePaths.map((relPath) =>
          path.join(this.repoPath!, relPath)
        );
      } else {
        // Process all markdown files
        filesToProcess = await this.getAllMarkdownFiles(this.repoPath!);
      }

      const result: ReplaceResult = {
        filesProcessed: 0,
        filesModified: 0,
        totalReplacements: 0,
        errors: [],
      };

      for (const filePath of filesToProcess) {
        result.filesProcessed++;

        try {
          const content = await this.fsAdapter.readFile(filePath);
          const newContent = this.replaceInContent(content, query, replacement, caseSensitive, useRegex);

          // Check if content changed
          if (newContent !== content) {
            await this.fsAdapter.writeFile(filePath, newContent);
            result.filesModified++;

            // Count replacements
            const matches = this.findMatchesInContent(content, query, caseSensitive, useRegex);
            result.totalReplacements += matches.length;

            logger.info('File modified by replace', {
              filePath: path.relative(this.repoPath!, filePath),
              replacements: matches.length,
            });
          }
        } catch (error: any) {
          const relativePath = path.relative(this.repoPath!, filePath);
          result.errors.push({
            filePath: relativePath,
            error: error.message || 'Unknown error',
          });
          logger.error('Failed to replace in file', { filePath, error });
        }
      }

      logger.info('Repo-wide replace completed', result);
      return result;
    } catch (error: any) {
      logger.error('Repo-wide replace failed', { error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Repo-wide replace failed: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get all markdown files in the repo
   */
  private async getAllMarkdownFiles(dirPath: string): Promise<string[]> {
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

          try {
            const stats = await this.fsAdapter.stat(fullPath);

            if (stats.isDirectory()) {
              await processDirectory(fullPath);
            } else {
              // Only include .md files for repo-wide operations
              const ext = path.extname(entryName).toLowerCase();
              if (ext === '.md' || ext === '.markdown') {
                files.push(fullPath);
              }
            }
          } catch (error: any) {
            logger.warn('Failed to stat file', { fullPath, error });
            continue;
          }
        }
      } catch (error: any) {
        logger.warn('Failed to read directory', { currentPath, error });
      }
    };

    await processDirectory(dirPath);
    return files;
  }

  /**
   * Find all matches of a query in a single line
   */
  private findMatchesInLine(
    line: string,
    query: string,
    caseSensitive: boolean,
    useRegex: boolean
  ): { start: number; end: number }[] {
    const matches: { start: number; end: number }[] = [];

    if (useRegex) {
      try {
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(query, flags);
        let match;

        while ((match = regex.exec(line)) !== null) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
          });
        }
      } catch (error) {
        // Invalid regex, fall back to literal search
        return this.findMatchesInLine(line, query, caseSensitive, false);
      }
    } else {
      const searchLine = caseSensitive ? line : line.toLowerCase();
      const searchQuery = caseSensitive ? query : query.toLowerCase();
      let index = 0;

      while ((index = searchLine.indexOf(searchQuery, index)) !== -1) {
        matches.push({
          start: index,
          end: index + query.length,
        });
        index += query.length;
      }
    }

    return matches;
  }

  /**
   * Find all matches in content
   */
  private findMatchesInContent(
    content: string,
    query: string,
    caseSensitive: boolean,
    useRegex: boolean
  ): { start: number; end: number }[] {
    const matches: { start: number; end: number }[] = [];

    if (useRegex) {
      try {
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(query, flags);
        let match;

        while ((match = regex.exec(content)) !== null) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
          });
        }
      } catch (error) {
        return this.findMatchesInContent(content, query, caseSensitive, false);
      }
    } else {
      const searchContent = caseSensitive ? content : content.toLowerCase();
      const searchQuery = caseSensitive ? query : query.toLowerCase();
      let index = 0;

      while ((index = searchContent.indexOf(searchQuery, index)) !== -1) {
        matches.push({
          start: index,
          end: index + query.length,
        });
        index += query.length;
      }
    }

    return matches;
  }

  /**
   * Replace text in content
   */
  private replaceInContent(
    content: string,
    query: string,
    replacement: string,
    caseSensitive: boolean,
    useRegex: boolean
  ): string {
    if (useRegex) {
      try {
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(query, flags);
        return content.replace(regex, replacement);
      } catch (error) {
        // Invalid regex, fall back to literal replacement
        return this.replaceInContent(content, query, replacement, caseSensitive, false);
      }
    } else {
      if (caseSensitive) {
        return content.split(query).join(replacement);
      } else {
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        return content.replace(regex, replacement);
      }
    }
  }
}

// Type definitions for repo-wide search
export interface RepoWideSearchResult {
  filePath: string; // Relative path
  fileName: string;
  fullPath: string; // Absolute path
  matches: RepoWideMatch[];
}

export interface RepoWideMatch {
  lineNumber: number;
  lineContent: string;
  matchStart: number; // Character position in line
  matchEnd: number; // Character position in line
  contextBefore: string;
  contextAfter: string;
}

export interface ReplaceResult {
  filesProcessed: number;
  filesModified: number;
  totalReplacements: number;
  errors: { filePath: string; error: string }[];
}

