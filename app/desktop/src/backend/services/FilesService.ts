import * as path from "path";
import { FsAdapter } from "../adapters/FsAdapter";
import { ConfigService } from "./ConfigService";
import type { GitAdapter } from "../adapters/GitAdapter";
import {
  FileTreeNode,
  FileContent,
  FileType,
  ApiError,
  ApiErrorCode,
  RepoProviderType,
  REPO_PROVIDERS,
} from "../../shared/types";
import { logger } from "../utils/logger";

export class FilesService {
  private repoPath: string | null = null;
  private gitAdapter: GitAdapter | null = null;
  private repoProvider: RepoProviderType | null = null;

  constructor(
    private fsAdapter: FsAdapter,
    private configService: ConfigService,
  ) {}

  setGitAdapter(gitAdapter: GitAdapter): void {
    this.gitAdapter = gitAdapter;
  }

  async init(): Promise<void> {
    const repoSettings = await this.configService.getRepoSettings();
    if (repoSettings?.localPath) {
      this.repoPath = repoSettings.localPath;
      this.repoProvider = repoSettings.provider || null;
      logger.debug("FilesService initialized", { repoPath: this.repoPath });
    }
  }

  async listTree(): Promise<FileTreeNode[]> {
    await this.ensureRepoPath();

    logger.info("Building file tree", { repoPath: this.repoPath });

    try {
      const tree = await this.buildTree(this.repoPath!);
      logger.debug("File tree built", { nodeCount: this.countNodes(tree) });
      return tree;
    } catch (error: any) {
      logger.error("Failed to build file tree", { error });
      throw error;
    }
  }

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
      logger.error("Failed to read file", { filePath, error });
      throw error;
    }
  }

  async saveFile(filePath: string, content: string): Promise<void> {
    await this.ensureRepoPath();

    const fullPath = path.join(this.repoPath!, filePath);

    try {
      await this.fsAdapter.writeFile(fullPath, content);
      logger.info("File saved", { filePath });
    } catch (error: any) {
      logger.error("Failed to save file", { filePath, error });
      throw error;
    }
  }

  async commitFile(filePath: string, message: string): Promise<void> {
    await this.ensureRepoPath();
    await this.ensureGitRepo();

    if (!this.gitAdapter) {
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        "GitAdapter not initialized",
        null,
        {
          messageKey: "files.errors.gitAdapterNotInitialized",
        },
      );
    }

    try {
      await this.gitAdapter.init(this.repoPath!);

      await this.gitAdapter.add(filePath);

      await this.gitAdapter.commit(message);

      logger.info("File committed", { filePath, message });
    } catch (error: any) {
      logger.error("Failed to commit file", { filePath, error });
      throw error;
    }
  }

  async commitAll(message: string): Promise<void> {
    await this.ensureRepoPath();
    await this.ensureGitRepo();

    if (!this.gitAdapter) {
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        "GitAdapter not initialized",
        null,
        {
          messageKey: "files.errors.gitAdapterNotInitialized",
        },
      );
    }

    try {
      await this.gitAdapter.init(this.repoPath!);

      await this.gitAdapter.add(".");

      await this.gitAdapter.commit(message);

      logger.info("All changes committed", { message });
    } catch (error: any) {
      logger.error("Failed to commit all changes", { error });
      throw error;
    }
  }

  async getGitStatus(): Promise<{
    modified: string[];
    added: string[];
    deleted: string[];
  }> {
    await this.ensureRepoPath();
    await this.ensureGitRepo();

    if (!this.gitAdapter) {
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        "GitAdapter not initialized",
        null,
        {
          messageKey: "files.errors.gitAdapterNotInitialized",
        },
      );
    }

    try {
      await this.gitAdapter.init(this.repoPath!);

      const status = await this.gitAdapter.status();

      return {
        modified: status.modified || [],
        added: status.created || [],
        deleted: status.deleted || [],
      };
    } catch (error: any) {
      logger.error("Failed to get git status", { error });
      throw error;
    }
  }

  async saveWithGitWorkflow(
    filePath: string,
    content: string,
    isAutosave: boolean = false,
  ): Promise<{
    pullFailed?: boolean;
    pushFailed?: boolean;
    conflictDetected?: boolean;
  }> {
    await this.ensureRepoPath();
    await this.ensureGitRepo();

    if (!this.gitAdapter) {
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        "GitAdapter not initialized",
        null,
        {
          messageKey: "files.errors.gitAdapterNotInitialized",
        },
      );
    }

    const fileName = path.basename(filePath);
    const commitMessage = isAutosave
      ? `Autosave: ${fileName}`
      : `Update note: ${fileName}`;

    const result: {
      pullFailed?: boolean;
      pushFailed?: boolean;
      conflictDetected?: boolean;
    } = {};

    try {
      await this.saveFile(filePath, content);
      logger.debug("File saved to disk", { filePath });

      await this.gitAdapter.init(this.repoPath!);

      try {
        await this.gitAdapter.add(filePath);
        await this.gitAdapter.commit(commitMessage);
        logger.info("File committed", { filePath, message: commitMessage });
      } catch (commitError: any) {
        logger.warn("Commit failed or nothing to commit", {
          filePath,
          error: commitError,
        });
      }

      try {
        await this.gitAdapter.pull();
        logger.info("Pull successful", { filePath });
      } catch (pullError: any) {
        logger.error("Pull failed", { error: pullError });
        result.pullFailed = true;

        if (
          pullError.message &&
          pullError.message.toLowerCase().includes("conflict")
        ) {
          result.conflictDetected = true;
          logger.warn("Conflict detected during pull", { filePath });
        }
      }

      if (!result.conflictDetected) {
        try {
          await this.gitAdapter.push();
          logger.info("Push successful", { filePath });
        } catch (pushError: any) {
          logger.error("Push failed", { error: pushError });
          result.pushFailed = true;
        }
      }

      return result;
    } catch (error: any) {
      logger.error("Save with Git workflow failed", { filePath, error });
      throw error;
    }
  }

  async createFile(parentPath: string, name: string): Promise<void> {
    await this.ensureRepoPath();

    const fileName = this.normalizeNameForProvider(name);
    const filePath = parentPath ? path.join(parentPath, fileName) : fileName;
    const fullPath = path.join(this.repoPath!, filePath);

    try {
      let content = "";
      if (fileName.endsWith(".md")) {
        content = `# ${fileName.replace(".md", "")}\n\n`;
      }

      await this.fsAdapter.writeFile(fullPath, content);
      logger.info("File created", { filePath });
    } catch (error: any) {
      logger.error("Failed to create file", { filePath, error });
      throw error;
    }
  }

  async createFolder(parentPath: string, name: string): Promise<void> {
    await this.ensureRepoPath();

    const folderName = this.normalizeNameForProvider(name);
    const folderPath = parentPath
      ? path.join(parentPath, folderName)
      : folderName;
    const fullPath = path.join(this.repoPath!, folderPath);

    try {
      await this.fsAdapter.mkdir(fullPath, { recursive: false });
      logger.info("Folder created", { folderPath });
    } catch (error: any) {
      logger.error("Failed to create folder", { folderPath, error });
      throw error;
    }
  }

  async deletePath(filePath: string): Promise<void> {
    await this.ensureRepoPath();

    const fullPath = path.join(this.repoPath!, filePath);

    try {
      const stats = await this.fsAdapter.stat(fullPath);

      if (stats.isDirectory()) {
        await this.fsAdapter.rmdir(fullPath, { recursive: true });
      } else {
        await this.fsAdapter.deleteFile(fullPath);
      }

      logger.info("Path deleted", { filePath });
    } catch (error: any) {
      logger.error("Failed to delete path", { filePath, error });
      throw error;
    }
  }

  async renamePath(oldPath: string, newPath: string): Promise<void> {
    await this.ensureRepoPath();

    const fullOldPath = path.join(this.repoPath!, oldPath);
    const normalizedNewPath = this.normalizeNewPathForProvider(newPath);
    const fullNewPath = path.join(this.repoPath!, normalizedNewPath);

    try {
      await this.fsAdapter.rename(fullOldPath, fullNewPath);
      logger.info("Path renamed", { oldPath, newPath: normalizedNewPath });
    } catch (error: any) {
      logger.error("Failed to rename path", {
        oldPath,
        newPath: normalizedNewPath,
        error,
      });
      throw error;
    }
  }

  async saveFileAs(repoPath: string, destPath: string): Promise<void> {
    await this.ensureRepoPath();

    const fullRepoPath = path.join(this.repoPath!, repoPath);

    try {
      await this.fsAdapter.copyFile(fullRepoPath, destPath);
      logger.info("File saved as", { repoPath, destPath });
    } catch (error: any) {
      logger.error("Failed to save file as", { repoPath, destPath, error });
      throw error;
    }
  }

  async duplicateFile(repoPath: string): Promise<string> {
    await this.ensureRepoPath();

    const normalizedPath = this.normalizeNewPathForProvider(repoPath);
    const fullRepoPath = path.join(this.repoPath!, normalizedPath);

    const stats = await this.fsAdapter.stat(fullRepoPath);
    if (!stats.isFile()) {
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        "Only files can be duplicated",
        null,
        {
          messageKey: "files.errors.onlyFilesCanBeDuplicated",
        },
      );
    }

    const { dir, name, ext } = path.parse(normalizedPath);
    let counter = 1;
    let newRelativePath = path.join(dir, `${name}(${counter})${ext}`);
    let fullNewPath = path.join(this.repoPath!, newRelativePath);

    while (await this.fsAdapter.exists(fullNewPath)) {
      counter += 1;
      newRelativePath = path.join(dir, `${name}(${counter})${ext}`);
      fullNewPath = path.join(this.repoPath!, newRelativePath);
    }

    await this.fsAdapter.copyFile(fullRepoPath, fullNewPath);
    logger.info("File duplicated", {
      source: normalizedPath,
      target: newRelativePath,
    });

    return newRelativePath;
  }

  async importFile(sourcePath: string, targetPath: string): Promise<void> {
    await this.ensureRepoPath();

    const normalizedTargetPath = this.normalizeNewPathForProvider(targetPath);
    const fullTargetPath = path.join(this.repoPath!, normalizedTargetPath);

    try {
      const parentDir = path.dirname(fullTargetPath);
      await this.fsAdapter.mkdir(parentDir, { recursive: true });

      await this.fsAdapter.copyFile(sourcePath, fullTargetPath);
      logger.info("File imported", {
        sourcePath,
        targetPath: normalizedTargetPath,
      });
    } catch (error: any) {
      logger.error("Failed to import file", {
        sourcePath,
        targetPath: normalizedTargetPath,
        error,
      });
      throw error;
    }
  }

  private async buildTree(
    dirPath: string,
    relativePath: string = "",
  ): Promise<FileTreeNode[]> {
    const entries = await this.fsAdapter.readdir(dirPath);
    const nodes: FileTreeNode[] = [];

    for (const entry of entries) {
      if (entry.startsWith(".")) {
        continue;
      }

      const fullPath = path.join(dirPath, entry);
      const entryRelativePath = relativePath
        ? path.join(relativePath, entry)
        : entry;

      try {
        const stats = await this.fsAdapter.stat(fullPath);

        if (stats.isDirectory()) {
          const children = await this.buildTree(fullPath, entryRelativePath);

          nodes.push({
            id: entryRelativePath,
            name: entry,
            path: entryRelativePath,
            type: "folder",
            children,
            isExpanded: false,
          });
        } else {
          const fileType = this.getFileType(entry);

          nodes.push({
            id: entryRelativePath,
            name: entry,
            path: entryRelativePath,
            type: "file",
            fileType,
          });
        }
      } catch (error) {
        logger.warn("Skipping inaccessible file/folder", { entry, error });
      }
    }

    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return nodes;
  }

  getFileType(filename: string): FileType {
    const ext = path.extname(filename).toLowerCase();

    if (ext === ".md" || ext === ".markdown") {
      return FileType.MARKDOWN;
    }

    if (
      [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"].includes(ext)
    ) {
      return FileType.IMAGE;
    }

    if (ext === ".pdf") {
      return FileType.PDF;
    }

    if (ext === ".json") {
      return FileType.JSON;
    }

    if (
      [
        ".js",
        ".ts",
        ".jsx",
        ".tsx",
        ".py",
        ".java",
        ".c",
        ".cpp",
        ".h",
        ".cs",
        ".go",
        ".rs",
        ".rb",
        ".php",
        ".swift",
        ".kt",
        ".scala",
        ".sh",
        ".bash",
      ].includes(ext)
    ) {
      return FileType.CODE;
    }

    if (
      [
        ".txt",
        ".log",
        ".csv",
        ".xml",
        ".yml",
        ".yaml",
        ".toml",
        ".ini",
      ].includes(ext)
    ) {
      return FileType.TEXT;
    }

    return FileType.OTHER;
  }

  private countNodes(nodes: FileTreeNode[]): number {
    let count = nodes.length;
    for (const node of nodes) {
      if (node.children) {
        count += this.countNodes(node.children);
      }
    }
    return count;
  }

  private async ensureRepoPath(): Promise<void> {
    if (!this.repoPath) {
      await this.init();
    }

    if (!this.repoPath) {
      throw this.createError(
        ApiErrorCode.VALIDATION_ERROR,
        "No repository configured",
        null,
        {
          messageKey: "files.errors.noRepositoryConfigured",
        },
      );
    }
  }

  private async ensureGitRepo(): Promise<void> {
    const repoSettings = await this.configService.getRepoSettings();
    if (
      repoSettings?.provider &&
      repoSettings.provider !== REPO_PROVIDERS.git
    ) {
      throw this.createError(
        ApiErrorCode.REPO_PROVIDER_MISMATCH,
        "Git operations are only available for Git repositories",
        { provider: repoSettings.provider },
        {
          messageKey: "files.errors.gitOnlyOperation",
          messageParams: {
            provider: repoSettings.provider,
          },
        },
      );
    }
  }

  private normalizeNameForProvider(name: string): string {
    if (this.repoProvider !== REPO_PROVIDERS.s3) {
      return name;
    }
    return name.replace(/ /g, "-");
  }

  private normalizeNewPathForProvider(newPath: string): string {
    if (this.repoProvider !== REPO_PROVIDERS.s3) {
      return newPath;
    }
    const lastSlash = newPath.lastIndexOf("/");
    if (lastSlash === -1) {
      return this.normalizeNameForProvider(newPath);
    }
    const parentPath = newPath.slice(0, lastSlash);
    const name = newPath.slice(lastSlash + 1);
    const normalizedName = this.normalizeNameForProvider(name);
    return parentPath ? `${parentPath}/${normalizedName}` : normalizedName;
  }

  private createError(
    code: ApiErrorCode,
    message: string,
    details?: any,
    localization?: {
      messageKey: string;
      messageParams?: Record<string, string | number | boolean>;
    },
  ): ApiError {
    const baseDetails =
      details && typeof details === "object" && !Array.isArray(details)
        ? { ...details }
        : details !== undefined
          ? { cause: details }
          : {};

    const enrichedDetails = localization
      ? {
          ...baseDetails,
          messageKey: localization.messageKey,
          messageParams: localization.messageParams,
        }
      : details;

    return {
      code,
      message,
      details: enrichedDetails,
    };
  }
}
