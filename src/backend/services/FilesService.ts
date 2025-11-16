import * as path from 'path';
import { FsAdapter } from '../adapters/FsAdapter';
import { ConfigService } from './ConfigService';
import type { GitAdapter } from '../adapters/GitAdapter';
import {
  FileTreeNode,
  FileContent,
  FileType,
  ApiError,
  ApiErrorCode,
} from '../../shared/types';
import { logger } from '../utils/logger';

export class FilesService {
  private repoPath: string | null = null;
  private gitAdapter: GitAdapter | null = null;

  constructor(
    private fsAdapter: FsAdapter,
    private configService: ConfigService
  ) {}

  /**
   * Set GitAdapter (to avoid circular dependency)
   */
  setGitAdapter(gitAdapter: GitAdapter): void {
    this.gitAdapter = gitAdapter;
  }

  /**
   * Initialize with repository path
   */
  async init(): Promise<void> {
    const repoSettings = await this.configService.getRepoSettings();
    if (repoSettings?.localPath) {
      this.repoPath = repoSettings.localPath;
      logger.debug('FilesService initialized', { repoPath: this.repoPath });
    }
  }

  /**
   * List complete file tree
   */
  async listTree(): Promise<FileTreeNode[]> {
    await this.ensureRepoPath();

    logger.info('Building file tree', { repoPath: this.repoPath });

    try {
      const tree = await this.buildTree(this.repoPath!);
      logger.debug('File tree built', { nodeCount: this.countNodes(tree) });
      return tree;
    } catch (error: any) {
      logger.error('Failed to build file tree', { error });
      throw error;
    }
  }

  /**
   * Read file content
   */
  async readFile(filePath: string): Promise<FileContent> {
    await this.ensureRepoPath();

    const fullPath = path.join(this.repoPath!, filePath);

    try {
      const content = await this.fsAdapter.readFile(fullPath);
      const stats = await this.fsAdapter.stat(fullPath);
      const fileType = this.getFileType(filePath);

      return {
        path: filePath,
        content,
        type: fileType,
        size: stats.size,
        lastModified: stats.mtime,
      };
    } catch (error: any) {
      logger.error('Failed to read file', { filePath, error });
      throw error;
    }
  }

  /**
   * Save file content (no Git operations)
   */
  async saveFile(filePath: string, content: string): Promise<void> {
    await this.ensureRepoPath();

    const fullPath = path.join(this.repoPath!, filePath);

    try {
      await this.fsAdapter.writeFile(fullPath, content);
      logger.info('File saved', { filePath });
    } catch (error: any) {
      logger.error('Failed to save file', { filePath, error });
      throw error;
    }
  }

  /**
   * Commit file changes to Git
   */
  async commitFile(filePath: string, message: string): Promise<void> {
    await this.ensureRepoPath();

    if (!this.gitAdapter) {
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        'GitAdapter not initialized',
        null
      );
    }

    try {
      // Initialize Git adapter with repo path
      await this.gitAdapter.init(this.repoPath!);
      
      // Stage the file
      await this.gitAdapter.add(filePath);
      
      // Commit
      await this.gitAdapter.commit(message);
      
      logger.info('File committed', { filePath, message });
    } catch (error: any) {
      logger.error('Failed to commit file', { filePath, error });
      throw error;
    }
  }

  /**
   * Commit all changes to Git (git add . && git commit)
   */
  async commitAll(message: string): Promise<void> {
    await this.ensureRepoPath();

    if (!this.gitAdapter) {
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        'GitAdapter not initialized',
        null
      );
    }

    try {
      // Initialize Git adapter with repo path
      await this.gitAdapter.init(this.repoPath!);
      
      // Stage all changes (git add .)
      await this.gitAdapter.add('.');
      
      // Commit
      await this.gitAdapter.commit(message);
      
      logger.info('All changes committed', { message });
    } catch (error: any) {
      logger.error('Failed to commit all changes', { error });
      throw error;
    }
  }

  /**
   * Create a new file
   */
  async createFile(parentPath: string, name: string): Promise<void> {
    await this.ensureRepoPath();

    const filePath = parentPath ? path.join(parentPath, name) : name;
    const fullPath = path.join(this.repoPath!, filePath);

    try {
      // Create with default content based on file type
      let content = '';
      if (name.endsWith('.md')) {
        content = `# ${name.replace('.md', '')}\n\n`;
      }

      await this.fsAdapter.writeFile(fullPath, content);
      logger.info('File created', { filePath });
    } catch (error: any) {
      logger.error('Failed to create file', { filePath, error });
      throw error;
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(parentPath: string, name: string): Promise<void> {
    await this.ensureRepoPath();

    const folderPath = parentPath ? path.join(parentPath, name) : name;
    const fullPath = path.join(this.repoPath!, folderPath);

    try {
      await this.fsAdapter.mkdir(fullPath, { recursive: false });
      logger.info('Folder created', { folderPath });
    } catch (error: any) {
      logger.error('Failed to create folder', { folderPath, error });
      throw error;
    }
  }

  /**
   * Delete a file or folder
   */
  async deletePath(filePath: string): Promise<void> {
    await this.ensureRepoPath();

    const fullPath = path.join(this.repoPath!, filePath);

    try {
      const stats = await this.fsAdapter.stat(fullPath);
      
      if (stats.isDirectory()) {
        // Use rmdir which handles recursive deletion
        await this.fsAdapter.rmdir(fullPath, { recursive: true });
      } else {
        await this.fsAdapter.deleteFile(fullPath);
      }
      
      logger.info('Path deleted', { filePath });
    } catch (error: any) {
      logger.error('Failed to delete path', { filePath, error });
      throw error;
    }
  }

  /**
   * Rename a file or folder
   */
  async renamePath(oldPath: string, newPath: string): Promise<void> {
    await this.ensureRepoPath();

    const fullOldPath = path.join(this.repoPath!, oldPath);
    const fullNewPath = path.join(this.repoPath!, newPath);

    try {
      await this.fsAdapter.rename(fullOldPath, fullNewPath);
      logger.info('Path renamed', { oldPath, newPath });
    } catch (error: any) {
      logger.error('Failed to rename path', { oldPath, newPath, error });
      throw error;
    }
  }

  /**
   * Copy file to external location (for saveAs)
   */
  async saveFileAs(repoPath: string, destPath: string): Promise<void> {
    await this.ensureRepoPath();

    const fullRepoPath = path.join(this.repoPath!, repoPath);

    try {
      await this.fsAdapter.copyFile(fullRepoPath, destPath);
      logger.info('File saved as', { repoPath, destPath });
    } catch (error: any) {
      logger.error('Failed to save file as', { repoPath, destPath, error });
      throw error;
    }
  }

  /**
   * Import/copy file from external location into the repository
   */
  async importFile(sourcePath: string, targetPath: string): Promise<void> {
    await this.ensureRepoPath();

    const fullTargetPath = path.join(this.repoPath!, targetPath);

    try {
      // Ensure parent directory exists
      const parentDir = path.dirname(fullTargetPath);
      await this.fsAdapter.mkdir(parentDir, { recursive: true });

      // Copy the file
      await this.fsAdapter.copyFile(sourcePath, fullTargetPath);
      logger.info('File imported', { sourcePath, targetPath });
    } catch (error: any) {
      logger.error('Failed to import file', { sourcePath, targetPath, error });
      throw error;
    }
  }


  /**
   * Recursively build file tree
   */
  private async buildTree(dirPath: string, relativePath: string = ''): Promise<FileTreeNode[]> {
    const entries = await this.fsAdapter.readdir(dirPath);
    const nodes: FileTreeNode[] = [];

    for (const entry of entries) {
      // Skip hidden files and .git directory
      if (entry.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(dirPath, entry);
      const entryRelativePath = relativePath ? path.join(relativePath, entry) : entry;

      try {
        const stats = await this.fsAdapter.stat(fullPath);

        if (stats.isDirectory()) {
          // Recursively build subtree
          const children = await this.buildTree(fullPath, entryRelativePath);

          nodes.push({
            id: entryRelativePath,
            name: entry,
            path: entryRelativePath,
            type: 'folder',
            children,
            isExpanded: false,
          });
        } else {
          // It's a file
          const fileType = this.getFileType(entry);

          nodes.push({
            id: entryRelativePath,
            name: entry,
            path: entryRelativePath,
            type: 'file',
            fileType,
          });
        }
      } catch (error) {
        logger.warn('Skipping inaccessible file/folder', { entry, error });
      }
    }

    // Sort: folders first, then files, both alphabetically
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return nodes;
  }

  /**
   * Determine file type from extension
   */
  getFileType(filename: string): FileType {
    const ext = path.extname(filename).toLowerCase();

    // Markdown
    if (ext === '.md' || ext === '.markdown') {
      return FileType.MARKDOWN;
    }

    // Images
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'].includes(ext)) {
      return FileType.IMAGE;
    }

    // PDF
    if (ext === '.pdf') {
      return FileType.PDF;
    }

    // JSON
    if (ext === '.json') {
      return FileType.JSON;
    }

    // Code files
    if (
      [
        '.js',
        '.ts',
        '.jsx',
        '.tsx',
        '.py',
        '.java',
        '.c',
        '.cpp',
        '.h',
        '.cs',
        '.go',
        '.rs',
        '.rb',
        '.php',
        '.swift',
        '.kt',
        '.scala',
        '.sh',
        '.bash',
      ].includes(ext)
    ) {
      return FileType.CODE;
    }

    // Text files
    if (['.txt', '.log', '.csv', '.xml', '.yml', '.yaml', '.toml', '.ini'].includes(ext)) {
      return FileType.TEXT;
    }

    return FileType.OTHER;
  }

  /**
   * Count total nodes in tree (for debugging)
   */
  private countNodes(nodes: FileTreeNode[]): number {
    let count = nodes.length;
    for (const node of nodes) {
      if (node.children) {
        count += this.countNodes(node.children);
      }
    }
    return count;
  }

  /**
   * Ensure repo path is set
   */
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

