import * as crypto from "crypto";
import * as fs from "fs/promises";
import * as path from "path";
import { GitAdapter } from "./GitAdapter";

type Snapshot = Map<string, string>;

type MockCommit = {
  hash: string;
  message: string;
  date: string;
  snapshot: Snapshot;
  changedPaths: Set<string>;
};

type MockRepoState = {
  repoPath: string;
  branch: string;
  remoteUrl: string | null;
  commits: MockCommit[];
  pushedCommitCount: number;
  stagedPaths: Set<string>;
};

type ChangedPaths = {
  modified: string[];
  created: string[];
  deleted: string[];
};

const ROOT_STAGE_TOKEN = ".";

export class MockGitAdapter extends GitAdapter {
  private repos = new Map<string, MockRepoState>();
  private activeRepoPath: string | null = null;

  async checkGitInstalled(): Promise<boolean> {
    return true;
  }

  async init(repoPath: string): Promise<void> {
    this.activeRepoPath = repoPath;
    if (!this.repos.has(repoPath)) {
      this.repos.set(repoPath, {
        repoPath,
        branch: "main",
        remoteUrl: null,
        commits: [],
        pushedCommitCount: 0,
        stagedPaths: new Set<string>(),
      });
    }
  }

  async clone(
    remoteUrl: string,
    localPath: string,
    branch: string,
    _pat?: string,
  ): Promise<void> {
    await fs.mkdir(localPath, { recursive: true });
    this.repos.set(localPath, {
      repoPath: localPath,
      branch: branch || "main",
      remoteUrl,
      commits: [],
      pushedCommitCount: 0,
      stagedPaths: new Set<string>(),
    });
    await this.init(localPath);
  }

  async status(): Promise<any> {
    const state = await this.ensureActiveState();
    const headSnapshot = this.getHeadSnapshot(state);
    const workingSnapshot = await this.readWorkingSnapshot(state.repoPath);
    const changed = this.computeChangedPaths(headSnapshot, workingSnapshot);
    const { ahead, behind } = await this.getAheadBehind();

    const files = [
      ...changed.modified,
      ...changed.created,
      ...changed.deleted,
    ].map((filePath) => ({ path: filePath }));

    return {
      current: state.branch,
      ahead,
      behind,
      files,
      modified: changed.modified,
      created: changed.created,
      deleted: changed.deleted,
      not_added: changed.created,
    };
  }

  async pull(_pat?: string): Promise<void> {
    return;
  }

  async push(_pat?: string): Promise<void> {
    const state = await this.ensureActiveState();
    state.pushedCommitCount = state.commits.length;
  }

  async fetch(): Promise<void> {
    return;
  }

  async add(filePath: string): Promise<void> {
    const state = await this.ensureActiveState();
    state.stagedPaths.add(this.normalizePath(filePath));
  }

  async commit(message: string): Promise<void> {
    const state = await this.ensureActiveState();
    if (state.stagedPaths.size === 0) {
      throw new Error("Nothing to commit");
    }

    const headSnapshot = this.getHeadSnapshot(state);
    const workingSnapshot = await this.readWorkingSnapshot(state.repoPath);
    const nextSnapshot = this.applyStagedChanges(
      headSnapshot,
      workingSnapshot,
      state.stagedPaths,
    );
    const changed = this.computeChangedPaths(headSnapshot, nextSnapshot);
    const changedSet = new Set([
      ...changed.modified,
      ...changed.created,
      ...changed.deleted,
    ]);

    if (changedSet.size === 0) {
      state.stagedPaths.clear();
      throw new Error("Nothing to commit");
    }

    const date = new Date().toISOString();
    const hash = crypto
      .createHash("sha1")
      .update(
        `${state.repoPath}|${message}|${date}|${Array.from(changedSet).join(",")}`,
      )
      .digest("hex")
      .slice(0, 12);

    state.commits.push({
      hash,
      message,
      date,
      snapshot: nextSnapshot,
      changedPaths: changedSet,
    });
    state.stagedPaths.clear();
  }

  async addRemote(remoteUrl: string, _name = "origin"): Promise<void> {
    const state = await this.ensureActiveState();
    state.remoteUrl = remoteUrl;
  }

  async log(filePath?: string): Promise<any[]> {
    const state = await this.ensureActiveState();
    const normalizedFilter = filePath ? this.normalizePath(filePath) : null;
    return [...state.commits]
      .reverse()
      .filter((commit) => {
        if (!normalizedFilter) {
          return true;
        }
        return commit.changedPaths.has(normalizedFilter);
      })
      .map((commit) => ({
        hash: commit.hash,
        author_name: "notegit-integration",
        author_email: "integration@notegit.local",
        date: commit.date,
        message: commit.message,
      }));
  }

  async show(commitHash: string, filePath: string): Promise<string> {
    const state = await this.ensureActiveState();
    const commit = state.commits.find((entry) => entry.hash === commitHash);
    if (!commit) {
      throw new Error(`Commit not found: ${commitHash}`);
    }

    const content = commit.snapshot.get(this.normalizePath(filePath));
    if (content === undefined) {
      throw new Error(`File not found in commit: ${filePath}`);
    }
    return content;
  }

  async diff(
    commit1: string,
    commit2: string,
    filePath?: string,
  ): Promise<string> {
    const state = await this.ensureActiveState();
    const a = state.commits.find((entry) => entry.hash === commit1);
    const b = state.commits.find((entry) => entry.hash === commit2);
    if (!a || !b) {
      return "";
    }

    const targetPath = filePath ? this.normalizePath(filePath) : null;
    const before = targetPath
      ? a.snapshot.get(targetPath) || ""
      : this.serializeSnapshot(a.snapshot);
    const after = targetPath
      ? b.snapshot.get(targetPath) || ""
      : this.serializeSnapshot(b.snapshot);

    if (before === after) {
      return "";
    }

    return `@@ -1,1 +1,1 @@\n-${before}\n+${after}`;
  }

  async getAheadBehind(): Promise<{ ahead: number; behind: number }> {
    const state = await this.ensureActiveState();
    return {
      ahead: Math.max(0, state.commits.length - state.pushedCommitCount),
      behind: 0,
    };
  }

  async getCurrentBranch(): Promise<string> {
    const state = await this.ensureActiveState();
    return state.branch || "main";
  }

  private async ensureActiveState(): Promise<MockRepoState> {
    if (!this.activeRepoPath) {
      throw new Error("MockGitAdapter not initialized. Call init() first.");
    }
    const state = this.repos.get(this.activeRepoPath);
    if (!state) {
      throw new Error("MockGitAdapter repository state not found.");
    }
    return state;
  }

  private getHeadSnapshot(state: MockRepoState): Snapshot {
    const latest = state.commits[state.commits.length - 1];
    return latest ? new Map(latest.snapshot) : new Map<string, string>();
  }

  private applyStagedChanges(
    headSnapshot: Snapshot,
    workingSnapshot: Snapshot,
    stagedPaths: Set<string>,
  ): Snapshot {
    if (stagedPaths.has(ROOT_STAGE_TOKEN)) {
      return new Map(workingSnapshot);
    }

    const next = new Map(headSnapshot);
    for (const stagedPath of stagedPaths) {
      const target = this.normalizePath(stagedPath);
      const nextEntries = Array.from(workingSnapshot.keys()).filter(
        (filePath) => filePath === target || filePath.startsWith(`${target}/`),
      );

      if (nextEntries.length > 0) {
        nextEntries.forEach((entry) => {
          next.set(entry, workingSnapshot.get(entry)!);
        });
      } else {
        next.delete(target);
      }
    }
    return next;
  }

  private computeChangedPaths(before: Snapshot, after: Snapshot): ChangedPaths {
    const modified: string[] = [];
    const created: string[] = [];
    const deleted: string[] = [];

    for (const [filePath, beforeContent] of before.entries()) {
      const afterContent = after.get(filePath);
      if (afterContent === undefined) {
        deleted.push(filePath);
        continue;
      }
      if (afterContent !== beforeContent) {
        modified.push(filePath);
      }
    }

    for (const filePath of after.keys()) {
      if (!before.has(filePath)) {
        created.push(filePath);
      }
    }

    return { modified, created, deleted };
  }

  private async readWorkingSnapshot(repoPath: string): Promise<Snapshot> {
    const snapshot = new Map<string, string>();

    const walk = async (currentDir: string): Promise<void> => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === ".git") {
          continue;
        }
        const absolutePath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await walk(absolutePath);
          continue;
        }
        if (!entry.isFile()) {
          continue;
        }

        const relativePath = this.normalizePath(
          path.relative(repoPath, absolutePath),
        );
        const content = await fs.readFile(absolutePath, "utf8");
        snapshot.set(relativePath, content);
      }
    };

    await walk(repoPath);
    return snapshot;
  }

  private normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, "/");
  }

  private serializeSnapshot(snapshot: Snapshot): string {
    return JSON.stringify(
      Array.from(snapshot.entries()).sort(([a], [b]) => a.localeCompare(b)),
    );
  }
}
