"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryService = void 0;
const types_1 = require("../../shared/types");
const logger_1 = require("../utils/logger");
class HistoryService {
    constructor(gitAdapter, configService) {
        this.gitAdapter = gitAdapter;
        this.configService = configService;
        this.repoPath = null;
    }
    /**
     * Initialize with repository path
     */
    async init() {
        const repoSettings = await this.configService.getRepoSettings();
        if (repoSettings?.localPath) {
            this.repoPath = repoSettings.localPath;
            await this.gitAdapter.init(this.repoPath);
            logger_1.logger.debug('HistoryService initialized', { repoPath: this.repoPath });
        }
    }
    /**
     * Get commit history for a specific file
     */
    async getForFile(filePath) {
        await this.ensureRepoPath();
        try {
            const commits = await this.gitAdapter.log(filePath);
            return commits.map((commit) => ({
                hash: commit.hash,
                author: commit.author_name,
                email: commit.author_email,
                date: new Date(commit.date),
                message: commit.message,
                files: [], // Not populated for performance
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get file history', { filePath, error });
            throw error;
        }
    }
    /**
     * Get file content at a specific commit
     */
    async getVersion(commitHash, filePath) {
        await this.ensureRepoPath();
        try {
            const content = await this.gitAdapter.show(commitHash, filePath);
            return content;
        }
        catch (error) {
            logger_1.logger.error('Failed to get file version', { commitHash, filePath, error });
            throw error;
        }
    }
    /**
     * Get diff between two commits for a file
     */
    async getDiff(hash1, hash2, filePath) {
        await this.ensureRepoPath();
        try {
            const diffText = await this.gitAdapter.diff(hash1, hash2, filePath);
            // Parse diff text into structured format (simplified)
            const hunks = [];
            const lines = diffText.split('\n');
            let currentHunk = null;
            for (const line of lines) {
                // Match hunk header: @@ -oldStart,oldLines +newStart,newLines @@
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
                    let type;
                    if (line.startsWith('+')) {
                        type = 'add';
                    }
                    else if (line.startsWith('-')) {
                        type = 'remove';
                    }
                    else {
                        type = 'context';
                    }
                    currentHunk.lines.push({
                        type,
                        content: line.substring(1), // Remove prefix character
                    });
                }
            }
            if (currentHunk) {
                hunks.push(currentHunk);
            }
            return hunks;
        }
        catch (error) {
            logger_1.logger.error('Failed to get diff', { hash1, hash2, filePath, error });
            throw error;
        }
    }
    async ensureRepoPath() {
        if (!this.repoPath) {
            await this.init();
        }
        if (!this.repoPath) {
            throw this.createError(types_1.ApiErrorCode.VALIDATION_ERROR, 'No repository configured', null);
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
exports.HistoryService = HistoryService;
