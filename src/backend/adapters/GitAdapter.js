"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitAdapter = void 0;
const simple_git_1 = __importDefault(require("simple-git"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const types_1 = require("../../shared/types");
const logger_1 = require("../utils/logger");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class GitAdapter {
    constructor() {
        this.git = null;
        this.repoPath = null;
    }
    /**
     * Check if Git CLI is installed on the system
     */
    async checkGitInstalled() {
        try {
            const { stdout } = await execAsync('git --version');
            logger_1.logger.info('Git CLI found', { version: stdout.trim() });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Git CLI not found', { error });
            return false;
        }
    }
    /**
     * Initialize Git adapter for a specific repository
     */
    async init(repoPath) {
        this.repoPath = repoPath;
        this.git = (0, simple_git_1.default)(repoPath);
        logger_1.logger.debug('GitAdapter initialized', { repoPath });
    }
    /**
     * Clone a repository
     */
    async clone(remoteUrl, localPath, branch, pat) {
        try {
            logger_1.logger.info('Cloning repository', { remoteUrl, localPath, branch });
            // If PAT is provided, inject it into the URL for HTTPS auth
            let authUrl = remoteUrl;
            if (pat && remoteUrl.startsWith('https://')) {
                // Format: https://PAT@github.com/user/repo.git
                authUrl = remoteUrl.replace('https://', `https://${pat}@`);
            }
            await (0, simple_git_1.default)().clone(authUrl, localPath, ['--branch', branch]);
            // Initialize for this repo
            await this.init(localPath);
            logger_1.logger.info('Repository cloned successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to clone repository', { error });
            if (error.message?.includes('Authentication failed')) {
                throw this.createError(types_1.ApiErrorCode.GIT_AUTH_FAILED, 'Authentication failed. Please check your credentials.', error);
            }
            throw this.createError(types_1.ApiErrorCode.GIT_CLONE_FAILED, `Failed to clone repository: ${error.message}`, error);
        }
    }
    /**
     * Get repository status
     */
    async status() {
        this.ensureInitialized();
        try {
            const status = await this.git.status();
            logger_1.logger.debug('Git status', { status });
            return status;
        }
        catch (error) {
            logger_1.logger.error('Failed to get git status', { error });
            throw this.createError(types_1.ApiErrorCode.UNKNOWN_ERROR, `Failed to get git status: ${error.message}`, error);
        }
    }
    /**
     * Pull from remote
     */
    async pull(pat) {
        this.ensureInitialized();
        try {
            logger_1.logger.info('Pulling from remote');
            // Set up credentials if PAT provided
            if (pat) {
                await this.configureAuth(pat);
            }
            await this.git.pull();
            logger_1.logger.info('Pull completed successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to pull', { error });
            if (error.message?.includes('Authentication failed') || error.message?.includes('403')) {
                throw this.createError(types_1.ApiErrorCode.GIT_AUTH_FAILED, 'Authentication failed during pull', error);
            }
            if (error.message?.includes('CONFLICT')) {
                throw this.createError(types_1.ApiErrorCode.GIT_CONFLICT, 'Merge conflict detected. Please resolve conflicts manually.', error);
            }
            throw this.createError(types_1.ApiErrorCode.GIT_PULL_FAILED, `Failed to pull: ${error.message}`, error);
        }
    }
    /**
     * Push to remote
     */
    async push(pat) {
        this.ensureInitialized();
        try {
            logger_1.logger.info('Pushing to remote');
            // Set up credentials if PAT provided
            if (pat) {
                await this.configureAuth(pat);
            }
            await this.git.push();
            logger_1.logger.info('Push completed successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to push', { error });
            if (error.message?.includes('Authentication failed') || error.message?.includes('403')) {
                throw this.createError(types_1.ApiErrorCode.GIT_AUTH_FAILED, 'Authentication failed during push', error);
            }
            throw this.createError(types_1.ApiErrorCode.GIT_PUSH_FAILED, `Failed to push: ${error.message}`, error);
        }
    }
    /**
     * Fetch from remote (used for connection check)
     */
    async fetch() {
        this.ensureInitialized();
        try {
            logger_1.logger.debug('Fetching from remote');
            await this.git.fetch();
        }
        catch (error) {
            logger_1.logger.debug('Fetch failed (may be offline)', { error });
            throw error;
        }
    }
    /**
     * Add file to staging
     */
    async add(filePath) {
        this.ensureInitialized();
        try {
            await this.git.add(filePath);
            logger_1.logger.debug('File added to staging', { filePath });
        }
        catch (error) {
            logger_1.logger.error('Failed to add file', { filePath, error });
            throw this.createError(types_1.ApiErrorCode.UNKNOWN_ERROR, `Failed to add file: ${error.message}`, error);
        }
    }
    /**
     * Commit staged changes
     */
    async commit(message) {
        this.ensureInitialized();
        try {
            await this.git.commit(message);
            logger_1.logger.info('Commit created', { message });
        }
        catch (error) {
            logger_1.logger.error('Failed to commit', { error });
            throw this.createError(types_1.ApiErrorCode.UNKNOWN_ERROR, `Failed to commit: ${error.message}`, error);
        }
    }
    /**
     * Get commit log for a file
     */
    async log(filePath) {
        this.ensureInitialized();
        try {
            const options = {
                file: filePath,
                maxCount: 100, // Limit to last 100 commits
            };
            const log = await this.git.log(options);
            logger_1.logger.debug('Retrieved git log', { fileCount: log.all.length });
            return [...log.all]; // Create mutable copy
        }
        catch (error) {
            logger_1.logger.error('Failed to get git log', { error });
            throw this.createError(types_1.ApiErrorCode.UNKNOWN_ERROR, `Failed to get git log: ${error.message}`, error);
        }
    }
    /**
     * Show file content at specific commit
     */
    async show(commitHash, filePath) {
        this.ensureInitialized();
        try {
            const content = await this.git.show([`${commitHash}:${filePath}`]);
            logger_1.logger.debug('Retrieved file content from commit', { commitHash, filePath });
            return content;
        }
        catch (error) {
            logger_1.logger.error('Failed to show file from commit', { commitHash, filePath, error });
            throw this.createError(types_1.ApiErrorCode.UNKNOWN_ERROR, `Failed to show file: ${error.message}`, error);
        }
    }
    /**
     * Get diff between commits
     */
    async diff(commit1, commit2, filePath) {
        this.ensureInitialized();
        try {
            const args = [commit1, commit2];
            if (filePath) {
                args.push('--', filePath);
            }
            const diff = await this.git.diff(args);
            logger_1.logger.debug('Retrieved diff', { commit1, commit2, filePath });
            return diff;
        }
        catch (error) {
            logger_1.logger.error('Failed to get diff', { commit1, commit2, error });
            throw this.createError(types_1.ApiErrorCode.UNKNOWN_ERROR, `Failed to get diff: ${error.message}`, error);
        }
    }
    /**
     * Get count of commits ahead/behind remote
     */
    async getAheadBehind() {
        this.ensureInitialized();
        try {
            const status = await this.git.status();
            return {
                ahead: status.ahead,
                behind: status.behind,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get ahead/behind count', { error });
            return { ahead: 0, behind: 0 };
        }
    }
    /**
     * Get current branch name
     */
    async getCurrentBranch() {
        this.ensureInitialized();
        try {
            const status = await this.git.status();
            return status.current || 'main';
        }
        catch (error) {
            logger_1.logger.error('Failed to get current branch', { error });
            return 'main';
        }
    }
    async configureAuth(pat) {
        // Configure git credential helper to use PAT
        // This is a simple approach - for production, might want credential caching
        await this.git.addConfig('credential.helper', 'store');
    }
    ensureInitialized() {
        if (!this.git || !this.repoPath) {
            throw this.createError(types_1.ApiErrorCode.UNKNOWN_ERROR, 'GitAdapter not initialized. Call init() first.', null);
        }
    }
    createError(code, message, details) {
        return {
            code,
            message,
            details,
        };
    }
}
exports.GitAdapter = GitAdapter;
