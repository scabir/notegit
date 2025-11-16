export declare class GitAdapter {
    private git;
    private repoPath;
    /**
     * Check if Git CLI is installed on the system
     */
    checkGitInstalled(): Promise<boolean>;
    /**
     * Initialize Git adapter for a specific repository
     */
    init(repoPath: string): Promise<void>;
    /**
     * Clone a repository
     */
    clone(remoteUrl: string, localPath: string, branch: string, pat?: string): Promise<void>;
    /**
     * Get repository status
     */
    status(): Promise<any>;
    /**
     * Pull from remote
     */
    pull(pat?: string): Promise<void>;
    /**
     * Push to remote
     */
    push(pat?: string): Promise<void>;
    /**
     * Fetch from remote (used for connection check)
     */
    fetch(): Promise<void>;
    /**
     * Add file to staging
     */
    add(filePath: string): Promise<void>;
    /**
     * Commit staged changes
     */
    commit(message: string): Promise<void>;
    /**
     * Get commit log for a file
     */
    log(filePath?: string): Promise<any[]>;
    /**
     * Show file content at specific commit
     */
    show(commitHash: string, filePath: string): Promise<string>;
    /**
     * Get diff between commits
     */
    diff(commit1: string, commit2: string, filePath?: string): Promise<string>;
    /**
     * Get count of commits ahead/behind remote
     */
    getAheadBehind(): Promise<{
        ahead: number;
        behind: number;
    }>;
    /**
     * Get current branch name
     */
    getCurrentBranch(): Promise<string>;
    private configureAuth;
    private ensureInitialized;
    private createError;
}
