import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { MockGitAdapter } from "../../../backend/adapters/MockGitAdapter";

const makeTempDir = async (label: string): Promise<string> =>
  fs.mkdtemp(path.join(os.tmpdir(), `notegit-mock-git-${label}-`));

const writeFile = async (
  repoPath: string,
  relativePath: string,
  content: string,
): Promise<void> => {
  const absolutePath = path.join(repoPath, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, "utf8");
};

describe("MockGitAdapter", () => {
  const originalEnv = { ...process.env };
  const tempDirs: string[] = [];

  const createRepo = async (): Promise<{
    adapter: MockGitAdapter;
    repoPath: string;
  }> => {
    const repoPath = await makeTempDir("repo");
    tempDirs.push(repoPath);
    const adapter = new MockGitAdapter();
    await adapter.init(repoPath);
    return { adapter, repoPath };
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(async () => {
    process.env = originalEnv;
    await Promise.all(
      tempDirs.map((dirPath) =>
        fs.rm(dirPath, { recursive: true, force: true }),
      ),
    );
  });

  it("checks git installation based on env and requires init", async () => {
    const adapter = new MockGitAdapter();
    await expect(adapter.checkGitInstalled()).resolves.toBe(true);

    process.env.NOTEGIT_MOCK_GIT_INSTALLED = "0";
    await expect(adapter.checkGitInstalled()).resolves.toBe(false);
    await expect(adapter.status()).rejects.toThrow(
      "MockGitAdapter not initialized. Call init() first.",
    );
  });

  it("handles clone failure modes and successful clone state", async () => {
    const adapter = new MockGitAdapter();
    const localPath = await makeTempDir("clone");
    tempDirs.push(localPath);

    await expect(
      adapter.clone("https://host/auth-fail/repo.git", localPath, "main"),
    ).rejects.toThrow("Authentication failed");
    await expect(
      adapter.clone("https://host/invalid-url/repo.git", localPath, "main"),
    ).rejects.toThrow("Invalid repository URL");
    await expect(
      adapter.clone("https://host/empty-remote/repo.git", localPath, "main"),
    ).rejects.toThrow("Remote branch main not found");

    process.env.NOTEGIT_MOCK_GIT_INITIAL_BEHIND = "2";
    await adapter.clone("https://host/good/repo.git", localPath, "dev");

    await expect(adapter.getCurrentBranch()).resolves.toBe("dev");
    await expect(adapter.getAheadBehind()).resolves.toEqual({
      ahead: 0,
      behind: 2,
    });
  });

  it("adds, commits, logs, shows and diffs files", async () => {
    const { adapter, repoPath } = await createRepo();

    await writeFile(repoPath, "note.md", "hello");
    await adapter.add(".");
    await adapter.commit("first commit");

    let status = await adapter.status();
    expect(status.files).toHaveLength(0);
    expect(status.ahead).toBe(1);

    await writeFile(repoPath, "note.md", "hello world");
    await adapter.add("note.md");
    await adapter.commit("second commit");

    const logs = await adapter.log("note.md");
    expect(logs).toHaveLength(2);
    expect(logs[0].message).toBe("second commit");
    expect(logs[1].message).toBe("first commit");

    const olderHash = logs[1].hash;
    const newerHash = logs[0].hash;

    await expect(adapter.show(olderHash, "note.md")).resolves.toBe("hello");
    await expect(
      adapter.diff(olderHash, newerHash, "note.md"),
    ).resolves.toContain("@@ -1,1 +1,1 @@");
    await expect(adapter.diff("missing", newerHash, "note.md")).resolves.toBe(
      "",
    );

    await adapter.push();
    status = await adapter.status();
    expect(status.ahead).toBe(0);
  });

  it("supports staging a path and committing deletions", async () => {
    const { adapter, repoPath } = await createRepo();
    await writeFile(repoPath, "folder/a.md", "A");
    await adapter.add(".");
    await adapter.commit("add file");

    await fs.rm(path.join(repoPath, "folder/a.md"), { force: true });
    await adapter.add("folder/a.md");
    await adapter.commit("delete file");

    const logs = await adapter.log("folder/a.md");
    expect(logs).toHaveLength(2);
    await expect(adapter.show(logs[0].hash, "folder/a.md")).rejects.toThrow(
      "File not found in commit: folder/a.md",
    );
  });

  it("returns nothing to commit for empty staged set and unchanged staged file", async () => {
    const { adapter, repoPath } = await createRepo();
    await expect(adapter.commit("should fail")).rejects.toThrow(
      "Nothing to commit",
    );

    await writeFile(repoPath, "same.md", "same");
    await adapter.add(".");
    await adapter.commit("base");

    await adapter.add("same.md");
    await expect(adapter.commit("still same")).rejects.toThrow(
      "Nothing to commit",
    );
  });

  it("handles pull, fetch and push success and failure modes", async () => {
    const { adapter } = await createRepo();

    process.env.NOTEGIT_MOCK_GIT_OFFLINE = "1";
    await expect(adapter.pull()).rejects.toThrow("Network offline");
    await expect(adapter.fetch()).rejects.toThrow("Network offline");
    await expect(adapter.push()).rejects.toThrow("Network offline");

    process.env.NOTEGIT_MOCK_GIT_OFFLINE = "0";
    process.env.NOTEGIT_MOCK_GIT_FAIL_PULL = "conflict";
    await expect(adapter.pull()).rejects.toThrow("CONFLICT simulated conflict");

    process.env.NOTEGIT_MOCK_GIT_FAIL_PULL = "1";
    await expect(adapter.pull()).rejects.toThrow("Pull failed");

    process.env.NOTEGIT_MOCK_GIT_FAIL_PULL = "";
    process.env.NOTEGIT_MOCK_GIT_FETCH_SETS_BEHIND = "3";
    await adapter.fetch();
    await expect(adapter.getAheadBehind()).resolves.toEqual({
      ahead: 0,
      behind: 3,
    });

    process.env.NOTEGIT_MOCK_GIT_FAIL_FETCH = "true";
    await expect(adapter.fetch()).rejects.toThrow("Fetch failed");

    process.env.NOTEGIT_MOCK_GIT_FAIL_FETCH = "";
    process.env.NOTEGIT_MOCK_GIT_FAIL_PUSH = "true";
    await expect(adapter.push()).rejects.toThrow("Push failed");
  });

  it("fails commit via env and supports addRemote", async () => {
    const { adapter, repoPath } = await createRepo();
    await writeFile(repoPath, "env.md", "data");
    await adapter.add(".");

    process.env.NOTEGIT_MOCK_GIT_FAIL_COMMIT = "true";
    await expect(adapter.commit("blocked")).rejects.toThrow("Commit failed");

    await adapter.addRemote("https://example.com/repo.git");
    process.env.NOTEGIT_MOCK_GIT_FAIL_COMMIT = "";
    await adapter.commit("ok");
    await expect(adapter.log()).resolves.toHaveLength(1);
  });
});
