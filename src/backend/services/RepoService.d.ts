import { GitAdapter } from '../adapters/GitAdapter';
import { FsAdapter } from '../adapters/FsAdapter';
import { ConfigService } from './ConfigService';
import type { FilesService } from './FilesService';
import { RepoSettings, RepoStatus, OpenOrCloneRepoResponse } from '../../shared/types';
export declare class RepoService {
    private gitAdapter;
    private fsAdapter;
    private configService;
    private autoPushTimer;
    private readonly AUTO_PUSH_INTERVAL;
    private currentRepoPath;
    private filesService;
    constructor(gitAdapter: GitAdapter, fsAdapter: FsAdapter, configService: ConfigService);
    /**
     * Set FilesService (to avoid circular dependency)
     */
    setFilesService(filesService: FilesService): void;
    /**
     * Open existing repo or clone new one
     */
    openOrClone(settings: RepoSettings): Promise<OpenOrCloneRepoResponse>;
    /**
     * Get current repository status
     */
    getStatus(): Promise<RepoStatus>;
    /**
     * Pull from remote
     */
    pull(): Promise<void>;
    /**
     * Push to remote
     */
    push(): Promise<void>;
    /**
     * Start auto-push timer
     * Periodically checks connection and pushes if there are commits waiting
     */
    startAutoPush(): void;
    /**
     * Stop auto-push timer
     */
    stopAutoPush(): void;
    /**
     * Try to push pending commits if connection is available
     */
    private tryAutoPush;
    /**
     * Extract repository name from Git URL
     */
    private extractRepoName;
    private createError;
    /**
     * Cleanup on shutdown
     */
    destroy(): void;
}
