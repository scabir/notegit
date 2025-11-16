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
exports.FsAdapter = void 0;
const fs = __importStar(require("fs/promises"));
const fsSync = __importStar(require("fs"));
const path = __importStar(require("path"));
const types_1 = require("../../shared/types");
class FsAdapter {
    async readFile(filePath) {
        try {
            return await fs.readFile(filePath, 'utf-8');
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                throw this.createError(types_1.ApiErrorCode.FS_NOT_FOUND, `File not found: ${filePath}`, error);
            }
            if (error.code === 'EACCES') {
                throw this.createError(types_1.ApiErrorCode.FS_PERMISSION_DENIED, `Permission denied: ${filePath}`, error);
            }
            throw this.createError(types_1.ApiErrorCode.UNKNOWN_ERROR, `Failed to read file: ${filePath}`, error);
        }
    }
    async writeFile(filePath, content) {
        try {
            // Ensure directory exists
            const dir = path.dirname(filePath);
            await this.mkdir(dir, { recursive: true });
            await fs.writeFile(filePath, content, 'utf-8');
        }
        catch (error) {
            if (error.code === 'EACCES') {
                throw this.createError(types_1.ApiErrorCode.FS_PERMISSION_DENIED, `Permission denied: ${filePath}`, error);
            }
            throw this.createError(types_1.ApiErrorCode.UNKNOWN_ERROR, `Failed to write file: ${filePath}`, error);
        }
    }
    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                throw this.createError(types_1.ApiErrorCode.FS_NOT_FOUND, `File not found: ${filePath}`, error);
            }
            if (error.code === 'EACCES') {
                throw this.createError(types_1.ApiErrorCode.FS_PERMISSION_DENIED, `Permission denied: ${filePath}`, error);
            }
            throw this.createError(types_1.ApiErrorCode.UNKNOWN_ERROR, `Failed to delete file: ${filePath}`, error);
        }
    }
    async rename(oldPath, newPath) {
        try {
            await fs.rename(oldPath, newPath);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                throw this.createError(types_1.ApiErrorCode.FS_NOT_FOUND, `File not found: ${oldPath}`, error);
            }
            if (error.code === 'EACCES') {
                throw this.createError(types_1.ApiErrorCode.FS_PERMISSION_DENIED, `Permission denied: ${oldPath}`, error);
            }
            throw this.createError(types_1.ApiErrorCode.UNKNOWN_ERROR, `Failed to rename from ${oldPath} to ${newPath}`, error);
        }
    }
    async mkdir(dirPath, options) {
        try {
            await fs.mkdir(dirPath, options);
        }
        catch (error) {
            if (error.code === 'EEXIST') {
                // Directory already exists, that's fine
                return;
            }
            if (error.code === 'EACCES') {
                throw this.createError(types_1.ApiErrorCode.FS_PERMISSION_DENIED, `Permission denied: ${dirPath}`, error);
            }
            throw this.createError(types_1.ApiErrorCode.UNKNOWN_ERROR, `Failed to create directory: ${dirPath}`, error);
        }
    }
    async readdir(dirPath) {
        try {
            return await fs.readdir(dirPath);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                throw this.createError(types_1.ApiErrorCode.FS_NOT_FOUND, `Directory not found: ${dirPath}`, error);
            }
            if (error.code === 'EACCES') {
                throw this.createError(types_1.ApiErrorCode.FS_PERMISSION_DENIED, `Permission denied: ${dirPath}`, error);
            }
            throw this.createError(types_1.ApiErrorCode.UNKNOWN_ERROR, `Failed to read directory: ${dirPath}`, error);
        }
    }
    async stat(filePath) {
        try {
            return await fs.stat(filePath);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                throw this.createError(types_1.ApiErrorCode.FS_NOT_FOUND, `Path not found: ${filePath}`, error);
            }
            throw this.createError(types_1.ApiErrorCode.UNKNOWN_ERROR, `Failed to stat: ${filePath}`, error);
        }
    }
    async exists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async copyFile(src, dest) {
        try {
            const destDir = path.dirname(dest);
            await this.mkdir(destDir, { recursive: true });
            await fs.copyFile(src, dest);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                throw this.createError(types_1.ApiErrorCode.FS_NOT_FOUND, `Source file not found: ${src}`, error);
            }
            if (error.code === 'EACCES') {
                throw this.createError(types_1.ApiErrorCode.FS_PERMISSION_DENIED, `Permission denied`, error);
            }
            throw this.createError(types_1.ApiErrorCode.UNKNOWN_ERROR, `Failed to copy file from ${src} to ${dest}`, error);
        }
    }
    existsSync(filePath) {
        return fsSync.existsSync(filePath);
    }
    createError(code, message, details) {
        return {
            code,
            message,
            details,
        };
    }
}
exports.FsAdapter = FsAdapter;
