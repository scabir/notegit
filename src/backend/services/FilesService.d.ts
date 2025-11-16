import { FsAdapter } from '../adapters/FsAdapter';
import { ConfigService } from './ConfigService';
import type { GitAdapter } from '../adapters/GitAdapter';
import { FileTreeNode, FileContent, FileType } from '../../shared/types';
export declare class FilesService {
    private fsAdapter;
    private configService;
    private repoPath;
    private gitAdapter;
    constructor(fsAdapter: FsAdapter, configService: ConfigService);
    /**
     * Set GitAdapter (to avoid circular dependency)
     */
    setGitAdapter(gitAdapter: GitAdapter): void;
    /**
     * Initialize with repository path
     */
    init(): Promise<void>;
    /**
     * List complete file tree
     */
    listTree(): Promise<FileTreeNode[]>;
    /**
     * Read file content
     */
    readFile(filePath: string): Promise<FileContent>;
    /**
     * Save file content (no Git operations)
     */
    saveFile(filePath: string, content: string): Promise<void>;
    /**
     * Commit file changes to Git
     */
    commitFile(filePath: string, message: string): Promise<void>;
    /**
     * Create a new file
     */
    createFile(parentPath: string, name: string): Promise<void>;
    /**
     * Create a new folder
     */
    createFolder(parentPath: string, name: string): Promise<void>;
    /**
     * Delete a file or folder
     */
    deletePath(filePath: string): Promise<void>;
    /**
     * Rename a file or folder
     */
    renamePath(oldPath: string, newPath: string): Promise<void>;
    /**
     * Copy file to external location (for saveAs)
     */
    saveFileAs(repoPath: string, destPath: string): Promise<void>;
    /**
     * Recursively delete directory
     */
    private deleteDirectory;
    /**
     * Recursively build file tree
     */
    private buildTree;
    /**
     * Determine file type from extension
     */
    getFileType(filename: string): FileType;
    /**
     * Count total nodes in tree (for debugging)
     */
    private countNodes;
    /**
     * Ensure repo path is set
     */
    private ensureRepoPath;
    private createError;
}
