"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepoService = void 0;
const path = __importStar(require("path"));
const electron_1 = require("electron");
const types_1 = require("../../shared/types");
const logger_1 = require("../utils/logger");
class RepoService {
    constructor(gitAdapter, fsAdapter, configService) {
        this.gitAdapter = gitAdapter;
        this.fsAdapter = fsAdapter;
        this.configService = configService;
        this.autoPushTimer = null;
        this.AUTO_PUSH_INTERVAL = 30000; // 30 seconds
        this.currentRepoPath = null;
        this.filesService = null;
    }
    /**
     * Set FilesService (to avoid circular dependency)
     */
    setFilesService(filesService) {
        this.filesService = filesService;
    }
    /**
     * Open existing repo or clone new one
     */
    async openOrClone(settings) {
        logger_1.logger.info('Opening or cloning repository', {
            remoteUrl: settings.remoteUrl,
            branch: settings.branch,
        });
        // Determine local path (in app data directory)
        const reposDir = path.join(electron_1.app.getPath('userData'), 'repos');
        await this.fsAdapter.mkdir(reposDir, { recursive: true });
        // Extract repo name from URL
        const repoName = this.extractRepoName(settings.remoteUrl);
        const localPath = path.join(reposDir, repoName);
        try {
            // Check if repo already exists
            const exists = await this.fsAdapter.exists(localPath);
            if (!exists) {
                // Clone the repository
                logger_1.logger.info('Repository not found locally, cloning...', { localPath });
                await this.gitAdapter.clone(settings.remoteUrl, localPath, settings.branch, settings.pat);
            }
            else {
                // Initialize Git adapter for existing repo
                logger_1.logger.info('Repository exists locally, opening...', { localPath });
                await this.gitAdapter.init(localPath);
            }
            this.currentRepoPath = localPath;
            // Update local path in settings
            settings.localPath = localPath;
            await this.configService.updateRepoSettings(settings);
            // Get initial status
            const status = await this.getStatus();
            // Build file tree
            let tree = [];
            if (this.filesService) {
                await this.filesService.init();
                tree = await this.filesService.listTree();
            }
            // Start auto-push mechanism
            this.startAutoPush();
            return {
                localPath,
                tree,
                status,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to open or clone repository', { error });
            throw error;
        }
    }
    /**
     * Get current repository status
     */
    async getStatus() {
        if (!this.currentRepoPath) {
            const repoSettings = await this.configService.getRepoSettings();
            if (repoSettings?.localPath) {
                this.currentRepoPath = repoSettings.localPath;
                await this.gitAdapter.init(this.currentRepoPath);
            }
            else {
                throw this.createError(types_1.ApiErrorCode.VALIDATION_ERROR, 'No repository configured', null);
            }
        }
        try {
            const gitStatus = await this.gitAdapter.status();
            const branch = await this.gitAdapter.getCurrentBranch();
            const { ahead, behind } = await this.gitAdapter.getAheadBehind();
            const status = {
                branch,
                ahead,
                behind,
                hasUncommitted: gitStatus.files.length > 0,
                pendingPushCount: ahead,
            };
            logger_1.logger.debug('Repository status', { status });
            return status;
        }
        catch (error) {
            logger_1.logger.error('Failed to get repository status', { error });
            throw error;
        }
    }
    /**
     * Pull from remote
     */
    async pull() {
        if (!this.currentRepoPath) {
            throw this.createError(types_1.ApiErrorCode.VALIDATION_ERROR, 'No repository configured', null);
        }
        try {
            const repoSettings = await this.configService.getRepoSettings();
            if (!repoSettings) {
                throw this.createError(types_1.ApiErrorCode.VALIDATION_ERROR, 'Repository settings not found', null);
            }
            logger_1.logger.info('Pulling from remote');
            await this.gitAdapter.pull(repoSettings.pat);
            logger_1.logger.info('Pull completed successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to pull', { error });
            throw error;
        }
    }
    /**
     * Push to remote
     */
    async push() {
        if (!this.currentRepoPath) {
            throw this.createError(types_1.ApiErrorCode.VALIDATION_ERROR, 'No repository configured', null);
        }
        try {
            const repoSettings = await this.configService.getRepoSettings();
            if (!repoSettings) {
                throw this.createError(types_1.ApiErrorCode.VALIDATION_ERROR, 'Repository settings not found', null);
            }
            logger_1.logger.info('Pushing to remote');
            await this.gitAdapter.push(repoSettings.pat);
            logger_1.logger.info('Push completed successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to push', { error });
            // Don't throw - let auto-push handle it
            throw error;
        }
    }
    /**
     * Start auto-push timer
     * Periodically checks connection and pushes if there are commits waiting
     */
    startAutoPush() {
        if (this.autoPushTimer) {
            logger_1.logger.debug('Auto-push timer already running');
            return;
        }
        logger_1.logger.info('Starting auto-push timer', {
            intervalMs: this.AUTO_PUSH_INTERVAL,
        });
        this.autoPushTimer = setInterval(async () => {
            try {
                await this.tryAutoPush();
            }
            catch (error) {
                // Silently fail - will retry on next interval
                logger_1.logger.debug('Auto-push attempt failed, will retry', { error });
            }
        }, this.AUTO_PUSH_INTERVAL);
    }
    /**
     * Stop auto-push timer
     */
    stopAutoPush() {
        if (this.autoPushTimer) {
            logger_1.logger.info('Stopping auto-push timer');
            clearInterval(this.autoPushTimer);
            this.autoPushTimer = null;
        }
    }
    /**
     * Try to push pending commits if connection is available
     */
    async tryAutoPush() {
        if (!this.currentRepoPath) {
            return;
        }
        try {
            // Get current status
            const status = await this.getStatus();
            // If there are no commits to push, do nothing
            if (status.ahead === 0) {
                return;
            }
            logger_1.logger.debug('Auto-push: commits waiting', { ahead: status.ahead });
            // Try to fetch to check connection
            const repoSettings = await this.configService.getRepoSettings();
            if (!repoSettings) {
                return;
            }
            await this.gitAdapter.fetch();
            // If fetch succeeded, try to push
            logger_1.logger.info('Auto-push: connection available, pushing...', {
                commitsCount: status.ahead,
            });
            await this.push();
            logger_1.logger.info('Auto-push: push successful', {
                commitsCount: status.ahead,
            });
        }
        catch (error) {
            // Failed to fetch or push - probably offline
            logger_1.logger.debug('Auto-push: offline or failed', { error });
        }
    }
    /**
     * Extract repository name from Git URL
     */
    extractRepoName(remoteUrl) {
        // Extract repo name from URLs like:
        // https://github.com/user/repo.git
        // git@github.com:user/repo.git
        const match = remoteUrl.match(/\/([^\/]+?)(?:\.git)?$/);
        if (match) {
            return match[1];
        }
        // Fallback to hash of URL
        const crypto = require('crypto');
        return crypto.createHash('md5').update(remoteUrl).digest('hex').substring(0, 8);
    }
    createError(code, message, details) {
        return {
            code,
            message,
            details,
        };
    }
    /**
     * Cleanup on shutdown
     */
    destroy() {
        this.stopAutoPush();
    }
}
exports.RepoService = RepoService;
