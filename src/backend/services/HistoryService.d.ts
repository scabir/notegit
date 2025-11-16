import { GitAdapter } from '../adapters/GitAdapter';
import { ConfigService } from './ConfigService';
import { CommitEntry, DiffHunk } from '../../shared/types';
export declare class HistoryService {
    private gitAdapter;
    private configService;
    private repoPath;
    constructor(gitAdapter: GitAdapter, configService: ConfigService);
    /**
     * Initialize with repository path
     */
    init(): Promise<void>;
    /**
     * Get commit history for a specific file
     */
    getForFile(filePath: string): Promise<CommitEntry[]>;
    /**
     * Get file content at a specific commit
     */
    getVersion(commitHash: string, filePath: string): Promise<string>;
    /**
     * Get diff between two commits for a file
     */
    getDiff(hash1: string, hash2: string, filePath: string): Promise<DiffHunk[]>;
    private ensureRepoPath;
    private createError;
}
