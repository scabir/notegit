import simpleGit, { SimpleGit } from "simple-git";
import { exec } from "child_process";
import { promisify } from "util";
import { ApiError, ApiErrorCode } from "../../shared/types";
import { logger } from "../utils/logger";

const execAsync = promisify(exec);

export class GitAdapter {
  private git: SimpleGit | null = null;
  private repoPath: string | null = null;

  async checkGitInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execAsync("git --version");
      logger.info("Git CLI found", { version: stdout.trim() });
      return true;
    } catch (error) {
      logger.error("Git CLI not found", { error });
      return false;
    }
  }

  async init(repoPath: string): Promise<void> {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
    await this.sanitizeOriginUrlIfNeeded();
    logger.debug("GitAdapter initialized", { repoPath });
  }

  async clone(
    remoteUrl: string,
    localPath: string,
    branch: string,
    pat?: string,
  ): Promise<void> {
    try {
      logger.info("Cloning repository", { localPath, branch });

      let authUrl = remoteUrl;
      if (pat && remoteUrl.startsWith("https://")) {
        authUrl = this.injectPatIntoUrl(remoteUrl, pat);
      }

      await simpleGit().clone(authUrl, localPath, ["--branch", branch]);

      await this.init(localPath);
      await this.clearAuth();

      logger.info("Repository cloned successfully");
    } catch (error: any) {
      logger.error("Failed to clone repository", { error });

      if (error.message?.includes("Authentication failed")) {
        throw this.createError(
          ApiErrorCode.GIT_AUTH_FAILED,
          "Authentication failed. Please check your credentials.",
          error,
          {
            messageKey: "git.errors.authenticationFailed",
          },
        );
      }

      throw this.createError(
        ApiErrorCode.GIT_CLONE_FAILED,
        `Failed to clone repository: ${error.message}`,
        error,
        {
          messageKey: "git.errors.failedCloneRepository",
          messageParams: { message: error.message },
        },
      );
    }
  }

  async status(): Promise<any> {
    this.ensureInitialized();

    try {
      const status = await this.git!.status();
      logger.debug("Git status", { status });
      return status;
    } catch (error: any) {
      logger.error("Failed to get git status", { error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to get git status: ${error.message}`,
        error,
        {
          messageKey: "git.errors.failedGetStatus",
          messageParams: { message: error.message },
        },
      );
    }
  }

  async pull(pat?: string): Promise<void> {
    this.ensureInitialized();

    try {
      logger.info("Pulling from remote");

      await this.runWithTemporaryAuth(pat, async () => {
        await this.git!.pull();
      });
      logger.info("Pull completed successfully");
    } catch (error: any) {
      logger.error("Failed to pull", { error });

      if (
        error.message?.includes("Authentication failed") ||
        error.message?.includes("403")
      ) {
        throw this.createError(
          ApiErrorCode.GIT_AUTH_FAILED,
          "Authentication failed during pull",
          error,
          {
            messageKey: "git.errors.authenticationFailedPull",
          },
        );
      }

      if (error.message?.includes("CONFLICT")) {
        throw this.createError(
          ApiErrorCode.GIT_CONFLICT,
          "Merge conflict detected. Please resolve conflicts manually.",
          error,
          {
            messageKey: "git.errors.mergeConflictDetected",
          },
        );
      }

      throw this.createError(
        ApiErrorCode.GIT_PULL_FAILED,
        `Failed to pull: ${error.message}`,
        error,
        {
          messageKey: "git.errors.failedPull",
          messageParams: { message: error.message },
        },
      );
    }
  }

  async push(pat?: string): Promise<void> {
    this.ensureInitialized();

    try {
      logger.info("Pushing to remote");

      await this.runWithTemporaryAuth(pat, async () => {
        await this.git!.push();
      });
      logger.info("Push completed successfully");
    } catch (error: any) {
      logger.error("Failed to push", { error });

      if (
        error.message?.includes("Authentication failed") ||
        error.message?.includes("403")
      ) {
        throw this.createError(
          ApiErrorCode.GIT_AUTH_FAILED,
          "Authentication failed during push",
          error,
          {
            messageKey: "git.errors.authenticationFailedPush",
          },
        );
      }

      throw this.createError(
        ApiErrorCode.GIT_PUSH_FAILED,
        `Failed to push: ${error.message}`,
        error,
        {
          messageKey: "git.errors.failedPush",
          messageParams: { message: error.message },
        },
      );
    }
  }

  async fetch(): Promise<void> {
    this.ensureInitialized();

    try {
      logger.debug("Fetching from remote");
      await this.git!.fetch();
    } catch (error: any) {
      logger.debug("Fetch failed (may be offline)", { error });
      throw error;
    }
  }

  async add(filePath: string): Promise<void> {
    this.ensureInitialized();

    try {
      await this.git!.add(filePath);
      logger.debug("File added to staging", { filePath });
    } catch (error: any) {
      logger.error("Failed to add file", { filePath, error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to add file: ${error.message}`,
        error,
        {
          messageKey: "git.errors.failedAddFile",
          messageParams: { message: error.message },
        },
      );
    }
  }

  async commit(message: string): Promise<void> {
    this.ensureInitialized();

    try {
      await this.git!.commit(message);
      logger.info("Commit created", { message });
    } catch (error: any) {
      logger.error("Failed to commit", { error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to commit: ${error.message}`,
        error,
        {
          messageKey: "git.errors.failedCommit",
          messageParams: { message: error.message },
        },
      );
    }
  }

  async addRemote(remoteUrl: string, name: string = "origin"): Promise<void> {
    this.ensureInitialized();

    try {
      await this.git!.addRemote(name, remoteUrl);
      logger.info("Remote added", { name, remoteUrl });
    } catch (error: any) {
      logger.error("Failed to add remote", { error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to add remote: ${error.message}`,
        error,
        {
          messageKey: "git.errors.failedAddRemote",
          messageParams: { message: error.message },
        },
      );
    }
  }

  async log(filePath?: string): Promise<any[]> {
    this.ensureInitialized();

    try {
      const options: any = {
        file: filePath,
        maxCount: 100,
      };

      const log = await this.git!.log(options);
      logger.debug("Retrieved git log", { fileCount: log.all.length });
      return [...log.all];
    } catch (error: any) {
      logger.error("Failed to get git log", { error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to get git log: ${error.message}`,
        error,
        {
          messageKey: "git.errors.failedGetLog",
          messageParams: { message: error.message },
        },
      );
    }
  }

  async show(commitHash: string, filePath: string): Promise<string> {
    this.ensureInitialized();

    try {
      const content = await this.git!.show([`${commitHash}:${filePath}`]);
      logger.debug("Retrieved file content from commit", {
        commitHash,
        filePath,
      });
      return content;
    } catch (error: any) {
      logger.error("Failed to show file from commit", {
        commitHash,
        filePath,
        error,
      });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to show file: ${error.message}`,
        error,
        {
          messageKey: "git.errors.failedShowFile",
          messageParams: { message: error.message },
        },
      );
    }
  }

  async diff(
    commit1: string,
    commit2: string,
    filePath?: string,
  ): Promise<string> {
    this.ensureInitialized();

    try {
      const args = [commit1, commit2];
      if (filePath) {
        args.push("--", filePath);
      }

      const diff = await this.git!.diff(args);
      logger.debug("Retrieved diff", { commit1, commit2, filePath });
      return diff;
    } catch (error: any) {
      logger.error("Failed to get diff", { commit1, commit2, error });
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Failed to get diff: ${error.message}`,
        error,
        {
          messageKey: "git.errors.failedGetDiff",
          messageParams: { message: error.message },
        },
      );
    }
  }

  async getAheadBehind(): Promise<{ ahead: number; behind: number }> {
    this.ensureInitialized();

    try {
      const status = await this.git!.status();
      return {
        ahead: status.ahead,
        behind: status.behind,
      };
    } catch (error: any) {
      logger.error("Failed to get ahead/behind count", { error });
      return { ahead: 0, behind: 0 };
    }
  }

  async getCurrentBranch(): Promise<string> {
    this.ensureInitialized();

    try {
      const status = await this.git!.status();
      return status.current || "main";
    } catch (error: any) {
      logger.error("Failed to get current branch", { error });
      return "main";
    }
  }

  private async runWithTemporaryAuth(
    pat: string | undefined,
    operation: () => Promise<void>,
  ): Promise<void> {
    let operationError: unknown = null;

    if (pat) {
      await this.configureAuth(pat);
    }

    try {
      await operation();
    } catch (error) {
      operationError = error;
    }

    if (pat) {
      try {
        await this.clearAuth();
      } catch (error) {
        logger.error("Failed to clear temporary Git credentials", { error });
        if (!operationError) {
          throw error;
        }
      }
    }

    if (operationError) {
      throw operationError;
    }
  }

  private async sanitizeOriginUrlIfNeeded(): Promise<void> {
    try {
      await this.clearAuth();
    } catch (error) {
      logger.debug("Skipping remote URL credential sanitization", { error });
    }
  }

  private async configureAuth(pat: string): Promise<void> {
    if (!pat) {
      return;
    }

    const remoteUrl = (await this.git!.remote(["get-url", "origin"]))?.trim();
    if (!remoteUrl || !remoteUrl.startsWith("https://")) {
      return;
    }

    const sanitizedUrl = this.stripCredentialsFromUrl(remoteUrl);
    const authUrl = this.injectPatIntoUrl(sanitizedUrl, pat);
    await this.git!.remote(["set-url", "origin", authUrl]);
  }

  private async clearAuth(): Promise<void> {
    const remoteUrl = (await this.git!.remote(["get-url", "origin"]))?.trim();
    if (!remoteUrl) {
      return;
    }

    const sanitizedUrl = this.stripCredentialsFromUrl(remoteUrl);
    if (sanitizedUrl !== remoteUrl) {
      await this.git!.remote(["set-url", "origin", sanitizedUrl]);
    }
  }

  private injectPatIntoUrl(remoteUrl: string, pat: string): string {
    try {
      const parsed = new URL(remoteUrl);
      if (parsed.protocol !== "https:") {
        return remoteUrl;
      }

      parsed.username = pat;
      parsed.password = "";
      return parsed.toString();
    } catch {
      return remoteUrl.replace(
        "https://",
        `https://${encodeURIComponent(pat)}@`,
      );
    }
  }

  private stripCredentialsFromUrl(remoteUrl: string): string {
    if (!remoteUrl.startsWith("https://")) {
      return remoteUrl;
    }

    try {
      const parsed = new URL(remoteUrl);
      if (!parsed.username && !parsed.password) {
        return remoteUrl;
      }

      parsed.username = "";
      parsed.password = "";
      return parsed.toString();
    } catch {
      return remoteUrl.replace(/^https:\/\/[^@/]+@/u, "https://");
    }
  }

  private ensureInitialized(): void {
    if (!this.git || !this.repoPath) {
      throw this.createError(
        ApiErrorCode.UNKNOWN_ERROR,
        "GitAdapter not initialized. Call init() first.",
        null,
        {
          messageKey: "git.errors.notInitialized",
        },
      );
    }
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
