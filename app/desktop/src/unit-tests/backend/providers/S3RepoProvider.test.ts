import * as crypto from "crypto";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { S3RepoProvider } from "../../../backend/providers/S3RepoProvider";
import {
  ApiErrorCode,
  S3RepoSettings,
  REPO_PROVIDERS,
} from "../../../shared/types";

const hashContent = (content: string) =>
  crypto.createHash("sha256").update(content).digest("hex");

const manifestPath = (dir: string) =>
  path.join(dir, ".notegit", "s3-sync.json");

const readManifest = async (dir: string) => {
  const content = await fs.readFile(manifestPath(dir), "utf-8");
  return JSON.parse(content);
};

type AdapterOverrides = Partial<{
  configure: jest.Mock;
  getBucketVersioning: jest.Mock;
  listObjects: jest.Mock;
  getObject: jest.Mock;
  putObject: jest.Mock;
  headObject: jest.Mock;
  deleteObject: jest.Mock;
}>;

const createAdapter = (overrides: AdapterOverrides = {}) => {
  return {
    configure: jest.fn(),
    getBucketVersioning: jest.fn().mockResolvedValue("Enabled"),
    listObjects: jest.fn().mockResolvedValue([]),
    getObject: jest.fn(),
    putObject: jest.fn().mockResolvedValue(undefined),
    headObject: jest.fn().mockImplementation(async (key: string) => ({
      key,
      eTag: '"etag-default"',
      lastModified: new Date("2024-01-01T00:00:00Z"),
    })),
    deleteObject: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
};

describe("S3RepoProvider", () => {
  const baseSettings: S3RepoSettings = {
    provider: REPO_PROVIDERS.s3,
    bucket: "notes-bucket",
    region: "us-east-1",
    prefix: "notes",
    localPath: "",
    accessKeyId: "access-key",
    secretAccessKey: "secret-key",
    sessionToken: "",
  };

  const tempDirs: string[] = [];

  const createTempDir = async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "notegit-s3-"));
    tempDirs.push(dir);
    return dir;
  };

  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map(async (dir) => {
        await fs.rm(dir, { recursive: true, force: true });
      }),
    );
    jest.useRealTimers();
  });

  it("rejects when bucket versioning is not enabled", async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const s3Adapter = createAdapter({
      getBucketVersioning: jest.fn().mockResolvedValue("Suspended"),
    });

    const provider = new S3RepoProvider(s3Adapter as any);

    await expect(provider.open(settings)).rejects.toMatchObject({
      code: ApiErrorCode.S3_VERSIONING_REQUIRED,
    });
  });

  it("pulls remote objects on open and records a manifest", async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const remoteTime = new Date("2024-01-01T10:00:00Z");
    const s3Adapter = createAdapter({
      listObjects: jest.fn().mockResolvedValue([
        {
          key: "notes/test.md",
          lastModified: remoteTime,
          eTag: '"etag-1"',
        },
      ]),
      getObject: jest.fn().mockResolvedValue(Buffer.from("# Hello from S3")),
    });

    const provider = new S3RepoProvider(s3Adapter as any);

    await provider.open(settings);

    const saved = await fs.readFile(path.join(tempDir, "test.md"), "utf-8");
    expect(saved).toBe("# Hello from S3");
    expect(s3Adapter.getObject).toHaveBeenCalledWith("notes/test.md");

    const manifest = await readManifest(tempDir);
    expect(manifest.files["test.md"].remoteETag).toBe("etag-1");
    expect(manifest.files["test.md"].localHash).toBe(
      hashContent("# Hello from S3"),
    );
  });

  it("uploads local changes on push and stores remote metadata", async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const s3Adapter = createAdapter({
      headObject: jest.fn().mockResolvedValue({
        key: "notes/note.md",
        eTag: '"etag-upload"',
        lastModified: new Date("2024-01-02T10:00:00Z"),
      }),
    });

    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure(settings);

    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(path.join(tempDir, "note.md"), "Local note");

    await provider.push();

    expect(s3Adapter.putObject).toHaveBeenCalledWith(
      "notes/note.md",
      expect.any(Buffer),
    );
    expect(s3Adapter.headObject).toHaveBeenCalledWith("notes/note.md");

    const manifest = await readManifest(tempDir);
    expect(manifest.files["note.md"].remoteETag).toBe("etag-upload");
  });

  it("downloads remote objects during sync", async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const remoteTime = new Date("2024-01-03T10:00:00Z");
    const s3Adapter = createAdapter({
      listObjects: jest.fn().mockResolvedValue([
        {
          key: "notes/new.md",
          lastModified: remoteTime,
          eTag: '"etag-remote"',
        },
      ]),
      getObject: jest.fn().mockResolvedValue(Buffer.from("Remote note")),
    });

    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure(settings);
    await fs.mkdir(tempDir, { recursive: true });

    await provider.push();

    const saved = await fs.readFile(path.join(tempDir, "new.md"), "utf-8");
    expect(saved).toBe("Remote note");
    expect(s3Adapter.getObject).toHaveBeenCalledWith("notes/new.md");
  });

  it("deletes remote objects removed locally after a baseline sync", async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const baseContent = "Base note";
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(path.join(tempDir, "obsolete.md"), baseContent);
    await fs.stat(path.join(tempDir, "obsolete.md"));

    const manifest = {
      version: 1,
      updatedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
      files: {
        "obsolete.md": {
          localHash: hashContent(baseContent),
          localMtimeMs: 0,
          remoteETag: "etag-base",
          remoteLastModifiedMs: new Date("2024-01-01T00:00:00Z").getTime(),
          deleted: false,
        },
      },
    };

    await fs.mkdir(path.join(tempDir, ".notegit"), { recursive: true });
    await fs.writeFile(
      manifestPath(tempDir),
      JSON.stringify(manifest, null, 2),
      "utf-8",
    );
    await fs.rm(path.join(tempDir, "obsolete.md"));

    const s3Adapter = createAdapter({
      listObjects: jest.fn().mockResolvedValue([
        {
          key: "notes/obsolete.md",
          lastModified: new Date("2024-01-01T00:00:00Z"),
          eTag: '"etag-base"',
        },
      ]),
    });

    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure(settings);

    await provider.push();

    expect(s3Adapter.deleteObject).toHaveBeenCalledWith("notes/obsolete.md");

    const updated = await readManifest(tempDir);
    expect(updated.files["obsolete.md"].deleted).toBe(true);
  });

  it("creates a conflict copy when both local and remote changed", async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const baseContent = "Base";
    const localContent = "Local v2";
    const remoteContent = "Remote v2";
    const remoteTime = new Date("2024-01-02T03:04:05Z");

    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(path.join(tempDir, "note.md"), localContent);
    const stats = await fs.stat(path.join(tempDir, "note.md"));

    const manifest = {
      version: 1,
      updatedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
      files: {
        "note.md": {
          localHash: hashContent(baseContent),
          localMtimeMs: stats.mtimeMs - 1000,
          remoteETag: "etag-base",
          remoteLastModifiedMs: new Date("2024-01-01T00:00:00Z").getTime(),
          deleted: false,
        },
      },
    };

    await fs.mkdir(path.join(tempDir, ".notegit"), { recursive: true });
    await fs.writeFile(
      manifestPath(tempDir),
      JSON.stringify(manifest, null, 2),
      "utf-8",
    );

    const s3Adapter = createAdapter({
      listObjects: jest.fn().mockResolvedValue([
        {
          key: "notes/note.md",
          lastModified: remoteTime,
          eTag: '"etag-remote"',
        },
      ]),
      getObject: jest.fn().mockResolvedValue(Buffer.from(remoteContent)),
    });

    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure(settings);

    await provider.push();

    const conflictFile = path.join(
      tempDir,
      "note.s3-conflict-20240102-030405.md",
    );
    const conflictContent = await fs.readFile(conflictFile, "utf-8");
    const localContentAfter = await fs.readFile(
      path.join(tempDir, "note.md"),
      "utf-8",
    );

    expect(conflictContent).toBe(remoteContent);
    expect(localContentAfter).toBe(localContent);

    const updated = await readManifest(tempDir);
    expect(updated.files["note.md"].conflict).toBe(true);
    expect(updated.files["note.md"].conflictRemoteETag).toBe("etag-remote");
    expect(updated.files["note.md"].conflictLocalHash).toBe(
      hashContent(localContent),
    );
  });

  it("ignores conflict copies when uploading", async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(
      path.join(tempDir, "note.s3-conflict-20240102-030405.md"),
      "Conflict copy",
    );

    const s3Adapter = createAdapter();

    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure(settings);

    await provider.push();

    expect(s3Adapter.putObject).not.toHaveBeenCalled();
    expect(s3Adapter.headObject).not.toHaveBeenCalled();
  });

  it("marks a conflict when remote is deleted and local changed", async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const baseContent = "Base";
    const localContent = "Local v2";

    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(path.join(tempDir, "note.md"), localContent);
    await fs.stat(path.join(tempDir, "note.md"));

    const manifest = {
      version: 1,
      updatedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
      files: {
        "note.md": {
          localHash: hashContent(baseContent),
          localMtimeMs: 0,
          remoteETag: "etag-base",
          remoteLastModifiedMs: new Date("2024-01-01T00:00:00Z").getTime(),
          deleted: false,
        },
      },
    };

    await fs.mkdir(path.join(tempDir, ".notegit"), { recursive: true });
    await fs.writeFile(
      manifestPath(tempDir),
      JSON.stringify(manifest, null, 2),
      "utf-8",
    );

    const s3Adapter = createAdapter({
      listObjects: jest.fn().mockResolvedValue([]),
    });

    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure(settings);

    await provider.push();

    expect(s3Adapter.deleteObject).not.toHaveBeenCalled();
    expect(s3Adapter.getObject).not.toHaveBeenCalled();

    const updated = await readManifest(tempDir);
    expect(updated.files["note.md"].conflict).toBe(true);
    expect(updated.files["note.md"].conflictRemoteDeleted).toBe(true);
  });

  it("uses the provided interval for auto sync", () => {
    jest.useFakeTimers();

    const tempDir = "/tmp/notegit-s3";
    const settings = { ...baseSettings, localPath: tempDir };

    const s3Adapter = createAdapter();
    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure(settings);

    jest.spyOn(provider, "pull").mockResolvedValue(undefined);

    const setIntervalSpy = jest.spyOn(global, "setInterval");

    provider.startAutoSync(45000);

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 45000);

    provider.stopAutoSync();
    setIntervalSpy.mockRestore();
  });

  it("restarts the auto sync timer when called again", () => {
    jest.useFakeTimers();

    const tempDir = "/tmp/notegit-s3";
    const settings = { ...baseSettings, localPath: tempDir };

    const s3Adapter = createAdapter();
    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure(settings);

    jest.spyOn(provider, "pull").mockResolvedValue(undefined);

    const setIntervalSpy = jest.spyOn(global, "setInterval");
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");

    provider.startAutoSync(30000);
    provider.startAutoSync(60000);

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);

    provider.stopAutoSync();
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it("normalizes prefixes and maps keys", () => {
    const s3Adapter = createAdapter();
    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure({ ...baseSettings, prefix: "/notes/" });

    const normalizedPrefix = (provider as any).normalizedPrefix();
    expect(normalizedPrefix).toBe("notes/");

    const key = (provider as any).toS3Key("folder/note.md");
    expect(key).toBe("notes/folder/note.md");

    const relative = (provider as any).fromS3Key("notes/folder/note.md");
    expect(relative).toBe("folder/note.md");
  });

  it("ignores special entries when listing local files", async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const provider = new S3RepoProvider(createAdapter() as any);
    provider.configure(settings);

    await fs.mkdir(path.join(tempDir, ".git"), { recursive: true });
    await fs.mkdir(path.join(tempDir, ".notegit"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "sub"), { recursive: true });
    await fs.writeFile(path.join(tempDir, ".DS_Store"), "ignore");
    await fs.writeFile(path.join(tempDir, ".notegit", "s3-sync.json"), "{}");
    await fs.writeFile(
      path.join(tempDir, "note.s3-conflict-20240101-000000.md"),
      "conflict",
    );
    await fs.writeFile(path.join(tempDir, "keep.md"), "keep");
    await fs.writeFile(path.join(tempDir, "sub", "keep2.md"), "keep2");

    const files = await (provider as any).listLocalFiles(tempDir);
    const sorted = files.sort();

    expect(sorted).toEqual(["keep.md", "sub/keep2.md"]);
  });

  it("returns null when conflict file already exists", async () => {
    const tempDir = await createTempDir();
    const settings = { ...baseSettings, localPath: tempDir };

    const provider = new S3RepoProvider(createAdapter() as any);
    provider.configure(settings);

    const conflictPath = path.join(
      tempDir,
      "note.s3-conflict-20240101-000000.md",
    );
    await fs.writeFile(conflictPath, "conflict");

    const resolved = await (provider as any).resolveConflictPath(
      "note.md",
      "20240101-000000",
    );
    expect(resolved).toBeNull();
  });

  it("rejects non-s3 configuration", () => {
    const provider = new S3RepoProvider(createAdapter() as any);
    try {
      provider.configure({ provider: REPO_PROVIDERS.git } as any);
      throw new Error("Expected configuration to fail");
    } catch (error: any) {
      expect(error.code).toBe(ApiErrorCode.REPO_PROVIDER_MISMATCH);
    }
  });

  it("rejects opening without a local path", async () => {
    const provider = new S3RepoProvider(createAdapter() as any);
    await expect(
      provider.open({ ...baseSettings, localPath: "" }),
    ).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  });

  it("rejects opening non-s3 settings", async () => {
    const provider = new S3RepoProvider(createAdapter() as any);
    await expect(
      provider.open({ provider: REPO_PROVIDERS.git } as any),
    ).rejects.toMatchObject({
      code: ApiErrorCode.REPO_PROVIDER_MISMATCH,
    });
  });

  it("returns status using calculated change counts", async () => {
    const provider = new S3RepoProvider(createAdapter() as any);
    provider.configure({ ...baseSettings, localPath: "/tmp/notegit-s3" });
    (provider as any).ensureRepoReady = jest.fn().mockResolvedValue(undefined);
    (provider as any).calculateChangeCounts = jest
      .fn()
      .mockResolvedValue({ localChanges: 2, remoteChanges: 1 });

    const status = await provider.getStatus();

    expect(status.ahead).toBe(2);
    expect(status.behind).toBe(1);
    expect(status.needsPull).toBe(true);
    expect(status.pendingPushCount).toBe(2);
  });

  it("fetch delegates to getStatus after ensureRepoReady", async () => {
    const provider = new S3RepoProvider(createAdapter() as any);
    provider.configure({ ...baseSettings, localPath: "/tmp/notegit-s3" });
    const ensureRepoReady = jest.fn().mockResolvedValue(undefined);
    (provider as any).ensureRepoReady = ensureRepoReady;
    const getStatus = jest.fn().mockResolvedValue({
      provider: REPO_PROVIDERS.s3,
      branch: "bucket",
      ahead: 0,
      behind: 0,
      hasUncommitted: false,
      pendingPushCount: 0,
      needsPull: false,
      isConnected: true,
    });
    (provider as any).getStatus = getStatus;

    await provider.fetch();

    expect(ensureRepoReady).toHaveBeenCalled();
    expect(getStatus).toHaveBeenCalled();
  });

  it("schedules a pending sync when a queued sync fails", async () => {
    const provider = new S3RepoProvider(createAdapter() as any);
    provider.configure({ ...baseSettings, localPath: "/tmp/notegit-s3" });
    (provider as any).sync = jest.fn().mockRejectedValue(new Error("boom"));
    const schedulePendingSync = jest.spyOn(
      provider as any,
      "schedulePendingSync",
    );

    await expect(provider.queueUpload("note.md")).rejects.toThrow("boom");
    expect(schedulePendingSync).toHaveBeenCalled();
  });

  it("upgrades queued sync mode while an active cycle is running", async () => {
    const provider = new S3RepoProvider(createAdapter() as any);
    provider.configure({ ...baseSettings, localPath: "/tmp/notegit-s3" });
    const callModes: Array<"pull" | "sync"> = [];
    let queuedSync: Promise<void> | null = null;

    jest
      .spyOn(provider as any, "performSync")
      .mockImplementation(async (mode: unknown) => {
        callModes.push(mode as "pull" | "sync");
        if (callModes.length === 1) {
          queuedSync = (provider as any).sync("sync");
          await Promise.resolve();
        }
      });

    await (provider as any).sync("pull");
    if (!queuedSync) {
      throw new Error("Expected a queued sync call");
    }
    await queuedSync;

    expect(callModes).toEqual(["pull", "sync"]);
  });

  it("collects remote info while ignoring folders and metadata paths", async () => {
    const s3Adapter = createAdapter({
      listObjects: jest.fn().mockResolvedValue([
        {
          key: "notes/folder/",
          lastModified: new Date("2024-01-01T00:00:00Z"),
        },
        {
          key: "notes/.notegit/meta.json",
          eTag: '"etag-ignore"',
          lastModified: new Date(),
        },
        {
          key: "notes/keep.md",
          eTag: '"etag-keep"',
          lastModified: new Date("2024-01-01T01:00:00Z"),
        },
      ]),
    });
    const provider = new S3RepoProvider(s3Adapter as any);
    provider.configure({ ...baseSettings, localPath: "/tmp/notegit-s3" });

    const result = await (provider as any).collectRemoteInfo();

    expect(result.has("keep.md")).toBe(true);
    expect(result.get("keep.md")?.eTag).toBe("etag-keep");
  });

  it("counts conflicts and change sets when calculating status", async () => {
    const provider = new S3RepoProvider(createAdapter() as any);
    provider.configure({ ...baseSettings, localPath: "/tmp/notegit-s3" });
    (provider as any).ensureRepoReady = jest.fn().mockResolvedValue(undefined);
    (provider as any).loadManifest = jest.fn().mockResolvedValue({
      version: 1,
      updatedAt: "",
      files: {
        "note.md": {
          localHash: "base",
          remoteETag: "base",
          deleted: false,
          conflict: true,
        },
        "other.md": {
          localHash: "base",
          remoteETag: "base",
          deleted: false,
        },
      },
    });
    (provider as any).collectLocalInfo = jest
      .fn()
      .mockResolvedValue(
        new Map([
          ["other.md", { relativePath: "other.md", hash: "local", mtimeMs: 1 }],
        ]),
      );
    (provider as any).collectRemoteInfo = jest
      .fn()
      .mockResolvedValue(
        new Map([
          [
            "other.md",
            { key: "notes/other.md", eTag: "remote", lastModifiedMs: 2 },
          ],
        ]),
      );

    const counts = await (provider as any).calculateChangeCounts();

    expect(counts.localChanges).toBe(2);
    expect(counts.remoteChanges).toBe(2);
  });

  it("does not schedule pending sync when one is already queued", () => {
    jest.useFakeTimers();
    const provider = new S3RepoProvider(createAdapter() as any);
    provider.configure({ ...baseSettings, localPath: "/tmp/notegit-s3" });
    (provider as any).pendingSyncTimer = {} as any;
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");

    (provider as any).schedulePendingSync();

    expect(setTimeoutSpy).not.toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
    jest.useRealTimers();
  });

  it("reconciles conflicts when both local and remote changed", async () => {
    const provider = new S3RepoProvider(createAdapter() as any);
    provider.configure({ ...baseSettings, localPath: "/tmp/notegit-s3" });

    const localInfo = new Map([
      ["note.md", { relativePath: "note.md", hash: "local", mtimeMs: 100 }],
    ]);
    const remoteInfo = new Map([
      [
        "note.md",
        { key: "notes/note.md", eTag: "remote", lastModifiedMs: 200 },
      ],
    ]);
    const manifest = {
      version: 1,
      updatedAt: "",
      files: {
        "note.md": {
          localHash: "base",
          localMtimeMs: 50,
          remoteETag: "base",
          remoteLastModifiedMs: 50,
          deleted: false,
        },
      },
    };

    const createConflictCopy = jest.fn().mockResolvedValue(undefined);
    (provider as any).createConflictCopy = createConflictCopy;

    await (provider as any).reconcilePath(
      "note.md",
      localInfo,
      remoteInfo,
      manifest,
      "sync",
    );

    expect(createConflictCopy).toHaveBeenCalled();
  });

  it("downloads remote updates when no baseline exists and remote is newer", async () => {
    const provider = new S3RepoProvider(createAdapter() as any);
    provider.configure({ ...baseSettings, localPath: "/tmp/notegit-s3" });

    const localInfo = new Map([
      ["note.md", { relativePath: "note.md", hash: "local", mtimeMs: 100 }],
    ]);
    const remoteInfo = new Map([
      [
        "note.md",
        { key: "notes/note.md", eTag: "remote", lastModifiedMs: 200 },
      ],
    ]);
    const manifest = { version: 1, updatedAt: "", files: {} };

    const downloadRemoteFile = jest.fn().mockResolvedValue({
      relativePath: "note.md",
      hash: "remote",
      mtimeMs: 200,
    });
    const updateManifestEntry = jest.fn();
    (provider as any).downloadRemoteFile = downloadRemoteFile;
    (provider as any).updateManifestEntry = updateManifestEntry;

    await (provider as any).reconcilePath(
      "note.md",
      localInfo,
      remoteInfo,
      manifest,
      "sync",
    );

    expect(downloadRemoteFile).toHaveBeenCalled();
    expect(updateManifestEntry).toHaveBeenCalled();
  });

  it("uploads local updates when no baseline exists and local is newer", async () => {
    const provider = new S3RepoProvider(createAdapter() as any);
    provider.configure({ ...baseSettings, localPath: "/tmp/notegit-s3" });

    const localInfo = new Map([
      ["note.md", { relativePath: "note.md", hash: "local", mtimeMs: 300 }],
    ]);
    const remoteInfo = new Map([
      [
        "note.md",
        { key: "notes/note.md", eTag: "remote", lastModifiedMs: 100 },
      ],
    ]);
    const manifest = { version: 1, updatedAt: "", files: {} };

    const uploadLocalFile = jest.fn().mockResolvedValue({
      key: "notes/note.md",
      eTag: "remote",
      lastModifiedMs: 300,
    });
    const updateManifestEntry = jest.fn();
    (provider as any).uploadLocalFile = uploadLocalFile;
    (provider as any).updateManifestEntry = updateManifestEntry;

    await (provider as any).reconcilePath(
      "note.md",
      localInfo,
      remoteInfo,
      manifest,
      "sync",
    );

    expect(uploadLocalFile).toHaveBeenCalled();
    expect(updateManifestEntry).toHaveBeenCalled();
  });

  it("deletes local files when remote removes a baseline file", async () => {
    const provider = new S3RepoProvider(createAdapter() as any);
    provider.configure({ ...baseSettings, localPath: "/tmp/notegit-s3" });

    const localInfo = new Map([
      ["note.md", { relativePath: "note.md", hash: "base", mtimeMs: 100 }],
    ]);
    const remoteInfo = new Map<string, any>();
    const manifest = {
      version: 1,
      updatedAt: "",
      files: {
        "note.md": {
          localHash: "base",
          localMtimeMs: 100,
          remoteETag: "etag",
          remoteLastModifiedMs: 100,
          deleted: false,
        },
      },
    };

    const deleteLocalFile = jest.fn().mockResolvedValue(undefined);
    const markDeleted = jest.fn();
    (provider as any).deleteLocalFile = deleteLocalFile;
    (provider as any).markDeleted = markDeleted;

    await (provider as any).reconcilePath(
      "note.md",
      localInfo,
      remoteInfo,
      manifest,
      "sync",
    );

    expect(deleteLocalFile).toHaveBeenCalled();
    expect(markDeleted).toHaveBeenCalled();
  });

  it("deletes remote files when local baseline is missing", async () => {
    const provider = new S3RepoProvider(createAdapter() as any);
    provider.configure({ ...baseSettings, localPath: "/tmp/notegit-s3" });

    const localInfo = new Map<string, any>();
    const remoteInfo = new Map([
      ["note.md", { key: "notes/note.md", eTag: "etag", lastModifiedMs: 100 }],
    ]);
    const manifest = {
      version: 1,
      updatedAt: "",
      files: {
        "note.md": {
          localHash: "base",
          localMtimeMs: 100,
          remoteETag: "etag",
          remoteLastModifiedMs: 100,
          deleted: false,
        },
      },
    };

    const deleteRemoteKey = jest.fn().mockResolvedValue(undefined);
    const markDeleted = jest.fn();
    (provider as any).deleteRemoteKey = deleteRemoteKey;
    (provider as any).markDeleted = markDeleted;

    await (provider as any).reconcilePath(
      "note.md",
      localInfo,
      remoteInfo,
      manifest,
      "sync",
    );

    expect(deleteRemoteKey).toHaveBeenCalledWith("note.md");
    expect(markDeleted).toHaveBeenCalled();
  });

  it("marks deletions when both local and remote are missing", async () => {
    const provider = new S3RepoProvider(createAdapter() as any);
    provider.configure({ ...baseSettings, localPath: "/tmp/notegit-s3" });

    const localInfo = new Map<string, any>();
    const remoteInfo = new Map<string, any>();
    const manifest = {
      version: 1,
      updatedAt: "",
      files: {
        "note.md": {
          localHash: "base",
          localMtimeMs: 100,
          remoteETag: "etag",
          remoteLastModifiedMs: 100,
          deleted: false,
        },
      },
    };

    const markDeleted = jest.fn();
    (provider as any).markDeleted = markDeleted;

    await (provider as any).reconcilePath(
      "note.md",
      localInfo,
      remoteInfo,
      manifest,
      "sync",
    );

    expect(markDeleted).toHaveBeenCalled();
  });
});
