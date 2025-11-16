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
exports.FilesService = void 0;
const path = __importStar(require("path"));
const types_1 = require("../../shared/types");
const logger_1 = require("../utils/logger");
class FilesService {
    constructor(fsAdapter, configService) {
        this.fsAdapter = fsAdapter;
        this.configService = configService;
        this.repoPath = null;
        this.gitAdapter = null;
    }
    /**
     * Set GitAdapter (to avoid circular dependency)
     */
    setGitAdapter(gitAdapter) {
        this.gitAdapter = gitAdapter;
    }
    /**
     * Initialize with repository path
     */
    async init() {
        const repoSettings = await this.configService.getRepoSettings();
        if (repoSettings?.localPath) {
            this.repoPath = repoSettings.localPath;
            logger_1.logger.debug('FilesService initialized', { repoPath: this.repoPath });
        }
    }
    /**
     * List complete file tree
     */
    async listTree() {
        await this.ensureRepoPath();
        logger_1.logger.info('Building file tree', { repoPath: this.repoPath });
        try {
            const tree = await this.buildTree(this.repoPath);
            logger_1.logger.debug('File tree built', { nodeCount: this.countNodes(tree) });
            return tree;
        }
        catch (error) {
            logger_1.logger.error('Failed to build file tree', { error });
            throw error;
        }
    }
    /**
     * Read file content
     */
    async readFile(filePath) {
        await this.ensureRepoPath();
        const fullPath = path.join(this.repoPath, filePath);
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
        }
        catch (error) {
            logger_1.logger.error('Failed to read file', { filePath, error });
            throw error;
        }
    }
    /**
     * Save file content (no Git operations)
     */
    async saveFile(filePath, content) {
        await this.ensureRepoPath();
        const fullPath = path.join(this.repoPath, filePath);
        try {
            await this.fsAdapter.writeFile(fullPath, content);
            logger_1.logger.info('File saved', { filePath });
        }
        catch (error) {
            logger_1.logger.error('Failed to save file', { filePath, error });
            throw error;
        }
    }
    /**
     * Commit file changes to Git
     */
    async commitFile(filePath, message) {
        await this.ensureRepoPath();
        if (!this.gitAdapter) {
            throw this.createError(types_1.ApiErrorCode.UNKNOWN_ERROR, 'GitAdapter not initialized', null);
        }
        try {
            // Initialize Git adapter with repo path
            await this.gitAdapter.init(this.repoPath);
            // Stage the file
            await this.gitAdapter.add(filePath);
            // Commit
            await this.gitAdapter.commit(message);
            logger_1.logger.info('File committed', { filePath, message });
        }
        catch (error) {
            logger_1.logger.error('Failed to commit file', { filePath, error });
            throw error;
        }
    }
    /**
     * Create a new file
     */
    async createFile(parentPath, name) {
        await this.ensureRepoPath();
        const filePath = parentPath ? path.join(parentPath, name) : name;
        const fullPath = path.join(this.repoPath, filePath);
        try {
            // Create with default content based on file type
            let content = '';
            if (name.endsWith('.md')) {
                content = `# ${name.replace('.md', '')}\n\n`;
            }
            await this.fsAdapter.writeFile(fullPath, content);
            logger_1.logger.info('File created', { filePath });
        }
        catch (error) {
            logger_1.logger.error('Failed to create file', { filePath, error });
            throw error;
        }
    }
    /**
     * Create a new folder
     */
    async createFolder(parentPath, name) {
        await this.ensureRepoPath();
        const folderPath = parentPath ? path.join(parentPath, name) : name;
        const fullPath = path.join(this.repoPath, folderPath);
        try {
            await this.fsAdapter.mkdir(fullPath, { recursive: false });
            logger_1.logger.info('Folder created', { folderPath });
        }
        catch (error) {
            logger_1.logger.error('Failed to create folder', { folderPath, error });
            throw error;
        }
    }
    /**
     * Delete a file or folder
     */
    async deletePath(filePath) {
        await this.ensureRepoPath();
        const fullPath = path.join(this.repoPath, filePath);
        try {
            const stats = await this.fsAdapter.stat(fullPath);
            if (stats.isDirectory()) {
                // For directories, we need to recursively delete
                // This is a simple implementation - production would need better handling
                await this.deleteDirectory(fullPath);
            }
            else {
                await this.fsAdapter.deleteFile(fullPath);
            }
            logger_1.logger.info('Path deleted', { filePath });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete path', { filePath, error });
            throw error;
        }
    }
    /**
     * Rename a file or folder
     */
    async renamePath(oldPath, newPath) {
        await this.ensureRepoPath();
        const fullOldPath = path.join(this.repoPath, oldPath);
        const fullNewPath = path.join(this.repoPath, newPath);
        try {
            await this.fsAdapter.rename(fullOldPath, fullNewPath);
            logger_1.logger.info('Path renamed', { oldPath, newPath });
        }
        catch (error) {
            logger_1.logger.error('Failed to rename path', { oldPath, newPath, error });
            throw error;
        }
    }
    /**
     * Copy file to external location (for saveAs)
     */
    async saveFileAs(repoPath, destPath) {
        await this.ensureRepoPath();
        const fullRepoPath = path.join(this.repoPath, repoPath);
        try {
            await this.fsAdapter.copyFile(fullRepoPath, destPath);
            logger_1.logger.info('File saved as', { repoPath, destPath });
        }
        catch (error) {
            logger_1.logger.error('Failed to save file as', { repoPath, destPath, error });
            throw error;
        }
    }
    /**
     * Recursively delete directory
     */
    async deleteDirectory(dirPath) {
        const entries = await this.fsAdapter.readdir(dirPath);
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry);
            const stats = await this.fsAdapter.stat(fullPath);
            if (stats.isDirectory()) {
                await this.deleteDirectory(fullPath);
            }
            else {
                await this.fsAdapter.deleteFile(fullPath);
            }
        }
        // Delete the directory itself
        await this.fsAdapter.deleteFile(dirPath);
    }
    /**
     * Recursively build file tree
     */
    async buildTree(dirPath, relativePath = '') {
        const entries = await this.fsAdapter.readdir(dirPath);
        const nodes = [];
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
                }
                else {
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
            }
            catch (error) {
                logger_1.logger.warn('Skipping inaccessible file/folder', { entry, error });
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
    getFileType(filename) {
        const ext = path.extname(filename).toLowerCase();
        // Markdown
        if (ext === '.md' || ext === '.markdown') {
            return types_1.FileType.MARKDOWN;
        }
        // Images
        if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'].includes(ext)) {
            return types_1.FileType.IMAGE;
        }
        // PDF
        if (ext === '.pdf') {
            return types_1.FileType.PDF;
        }
        // JSON
        if (ext === '.json') {
            return types_1.FileType.JSON;
        }
        // Code files
        if ([
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
        ].includes(ext)) {
            return types_1.FileType.CODE;
        }
        // Text files
        if (['.txt', '.log', '.csv', '.xml', '.yml', '.yaml', '.toml', '.ini'].includes(ext)) {
            return types_1.FileType.TEXT;
        }
        return types_1.FileType.OTHER;
    }
    /**
     * Count total nodes in tree (for debugging)
     */
    countNodes(nodes) {
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
exports.FilesService = FilesService;
