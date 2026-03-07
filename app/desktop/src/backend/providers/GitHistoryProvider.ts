import { GitAdapter } from "../adapters/GitAdapter";
import {
  CommitEntry,
  DiffHunk,
  ApiError,
  ApiErrorCode,
  RepoSettings,
  GitRepoSettings,
  REPO_PROVIDERS,
} from "../../shared/types";
import type { HistoryProvider } from "./types";

export class GitHistoryProvider implements HistoryProvider {
  readonly type = REPO_PROVIDERS.git;
  private settings: GitRepoSettings | null = null;
  private repoPath: string | null = null;

  constructor(private gitAdapter: GitAdapter) {}

  configure(settings: RepoSettings): void {
    if (settings.provider !== REPO_PROVIDERS.git) {
      throw this.createError(
        ApiErrorCode.REPO_PROVIDER_MISMATCH,
        "GitHistoryProvider configured with non-git settings",
        { provider: settings.provider },
      );
    }

    this.settings = settings;
    this.repoPath = settings.localPath || null;
  }

  async getForFile(filePath: string): Promise<CommitEntry[]> {
    await this.ensureRepoReady();

    const commits = await this.gitAdapter.log(filePath);
    return commits.map((commit: any) => ({
      hash: commit.hash,
      author: commit.author_name,
      email: commit.author_email,
      date: new Date(commit.date),
      message: commit.message,
      files: [],
    }));
  }

  async getVersion(versionId: string, filePath: string): Promise<string> {
    await this.ensureRepoReady();
    return await this.gitAdapter.show(versionId, filePath);
  }

  async getDiff(
    versionA: string,
    versionB: string,
    filePath: string,
  ): Promise<DiffHunk[]> {
    await this.ensureRepoReady();

    const diffText = await this.gitAdapter.diff(versionA, versionB, filePath);

    const hunks: DiffHunk[] = [];
    const lines = diffText.split("\n");

    let currentHunk: DiffHunk | null = null;

    for (const line of lines) {
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
        let type: "add" | "remove" | "context";
        if (line.startsWith("+")) {
          type = "add";
        } else if (line.startsWith("-")) {
          type = "remove";
        } else {
          type = "context";
        }

        currentHunk.lines.push({
          type,
          content: line.substring(1),
        });
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk);
    }

    return hunks;
  }

  private async ensureRepoReady(): Promise<void> {
    if (!this.repoPath) {
      if (this.settings?.localPath) {
        this.repoPath = this.settings.localPath;
      } else {
        throw this.createError(
          ApiErrorCode.VALIDATION_ERROR,
          "No repository configured",
          null,
        );
      }
    }

    await this.gitAdapter.init(this.repoPath);
  }

  private createError(
    code: ApiErrorCode,
    message: string,
    details?: any,
  ): ApiError {
    return {
      code,
      message,
      details,
    };
  }
}
