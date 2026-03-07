import { RepoService } from "../../../backend/services/RepoService";
import { ApiErrorCode, REPO_PROVIDERS } from "../../../shared/types";
import type { ConfigService } from "../../../backend/services/ConfigService";
import type { FsAdapter } from "../../../backend/adapters/FsAdapter";

describe("RepoService", () => {
  const createRepoService = () => {
    const gitProvider = {
      type: REPO_PROVIDERS.git,
      configure: jest.fn(),
      open: jest.fn(),
      getStatus: jest.fn().mockResolvedValue({}),
      fetch: jest.fn(),
      pull: jest.fn(),
      push: jest.fn(),
      startAutoSync: jest.fn(),
      stopAutoSync: jest.fn(),
    };

    const s3Provider = {
      type: REPO_PROVIDERS.s3,
      configure: jest.fn(),
      open: jest.fn(),
      getStatus: jest.fn().mockResolvedValue({}),
      fetch: jest.fn(),
      pull: jest.fn(),
      push: jest.fn(),
      startAutoSync: jest.fn(),
      stopAutoSync: jest.fn(),
      queueDelete: jest.fn(),
      queueMove: jest.fn(),
      queueUpload: jest.fn(),
    };

    const localProvider = {
      type: REPO_PROVIDERS.local,
      configure: jest.fn(),
      open: jest.fn(),
      getStatus: jest.fn().mockResolvedValue({}),
      fetch: jest.fn(),
      pull: jest.fn(),
      push: jest.fn(),
      startAutoSync: jest.fn(),
      stopAutoSync: jest.fn(),
    };

    const mockConfigService = {
      getRepoSettings: jest.fn(),
      getAppSettings: jest.fn(),
      updateRepoSettings: jest.fn(),
    } as unknown as ConfigService;

    const mockFsAdapter = {
      mkdir: jest.fn(),
      exists: jest.fn().mockResolvedValue(false),
    } as unknown as FsAdapter;

    const repoService = new RepoService(
      {
        git: gitProvider as any,
        s3: s3Provider as any,
        local: localProvider as any,
      },
      mockFsAdapter,
      mockConfigService,
    );

    return {
      repoService,
      gitProvider,
      s3Provider,
      localProvider,
      mockConfigService,
      mockFsAdapter,
    };
  };

  it("queueS3Delete uses the s3 provider when repo is s3", async () => {
    const { repoService, s3Provider, mockConfigService } = createRepoService();

    const repoSettings = {
      provider: REPO_PROVIDERS.s3,
      localPath: "/repo",
      bucket: "notes-bucket",
      region: "us-east-1",
      prefix: "",
      accessKeyId: "access-key",
      secretAccessKey: "secret-key",
      sessionToken: "",
    };

    mockConfigService.getRepoSettings = jest
      .fn()
      .mockResolvedValue(repoSettings as any);

    await repoService.queueS3Delete("notes/file.md");

    expect(s3Provider.configure).toHaveBeenCalledWith(repoSettings);
    expect(s3Provider.queueDelete).toHaveBeenCalledWith("notes/file.md");
  });

  it("queueS3Delete is a no-op for git repos", async () => {
    const { repoService, s3Provider, mockConfigService } = createRepoService();

    const repoSettings = {
      provider: REPO_PROVIDERS.git,
      localPath: "/repo",
      remoteUrl: "url",
      branch: "main",
      pat: "token",
      authMethod: "pat",
    };

    mockConfigService.getRepoSettings = jest
      .fn()
      .mockResolvedValue(repoSettings as any);

    await repoService.queueS3Delete("notes/file.md");

    expect(s3Provider.queueDelete).not.toHaveBeenCalled();
  });

  it("queueS3Move normalizes spaces in new path", async () => {
    const { repoService, s3Provider, mockConfigService } = createRepoService();

    const repoSettings = {
      provider: REPO_PROVIDERS.s3,
      localPath: "/repo",
      bucket: "notes-bucket",
      region: "us-east-1",
      prefix: "",
      accessKeyId: "access-key",
      secretAccessKey: "secret-key",
      sessionToken: "",
    };

    mockConfigService.getRepoSettings = jest
      .fn()
      .mockResolvedValue(repoSettings as any);

    await repoService.queueS3Move("old.md", "folder/new name.md");

    expect(s3Provider.queueMove).toHaveBeenCalledWith(
      "old.md",
      "folder/new-name.md",
    );
  });

  it("refreshAutoSyncSettings starts s3 auto sync when enabled", async () => {
    const { repoService, s3Provider, mockConfigService } = createRepoService();

    const repoSettings = {
      provider: REPO_PROVIDERS.s3,
      localPath: "/repo",
      bucket: "notes-bucket",
      region: "us-east-1",
      prefix: "",
      accessKeyId: "access-key",
      secretAccessKey: "secret-key",
      sessionToken: "",
    };

    mockConfigService.getRepoSettings = jest
      .fn()
      .mockResolvedValue(repoSettings as any);
    mockConfigService.getAppSettings = jest.fn().mockResolvedValue({
      s3AutoSyncEnabled: true,
      s3AutoSyncIntervalSec: 45,
    });

    await repoService.getStatus().catch(() => undefined);
    await repoService.refreshAutoSyncSettings();

    expect(s3Provider.startAutoSync).toHaveBeenCalledWith(45000);
    expect(s3Provider.stopAutoSync).not.toHaveBeenCalled();
  });

  it("refreshAutoSyncSettings stops s3 auto sync when disabled", async () => {
    const { repoService, s3Provider, mockConfigService } = createRepoService();

    const repoSettings = {
      provider: REPO_PROVIDERS.s3,
      localPath: "/repo",
      bucket: "notes-bucket",
      region: "us-east-1",
      prefix: "",
      accessKeyId: "access-key",
      secretAccessKey: "secret-key",
      sessionToken: "",
    };

    mockConfigService.getRepoSettings = jest
      .fn()
      .mockResolvedValue(repoSettings as any);
    mockConfigService.getAppSettings = jest.fn().mockResolvedValue({
      s3AutoSyncEnabled: false,
      s3AutoSyncIntervalSec: 30,
    });

    await repoService.getStatus().catch(() => undefined);
    await repoService.refreshAutoSyncSettings();

    expect(s3Provider.stopAutoSync).toHaveBeenCalled();
    expect(s3Provider.startAutoSync).not.toHaveBeenCalled();
  });

  it("opens a git repo and loads tree", async () => {
    const { repoService, gitProvider, mockConfigService, mockFsAdapter } =
      createRepoService();
    const filesService = {
      init: jest.fn().mockResolvedValue(undefined),
      listTree: jest.fn().mockResolvedValue([{ id: "a.md" }]),
    } as any;
    repoService.setFilesService(filesService);

    const response = await repoService.openOrClone({
      provider: REPO_PROVIDERS.git,
      remoteUrl: "https://github.com/user/repo.git",
      branch: "main",
      localPath: "",
      pat: "token",
      authMethod: "pat",
    } as any);

    expect(mockFsAdapter.mkdir).toHaveBeenCalled();
    expect(gitProvider.configure).toHaveBeenCalled();
    expect(gitProvider.open).toHaveBeenCalled();
    expect(mockConfigService.updateRepoSettings).toHaveBeenCalled();
    expect(response.tree).toEqual([{ id: "a.md" }]);
  });

  it("opens a local repo and updates config", async () => {
    const { repoService, localProvider, mockConfigService } =
      createRepoService();
    localProvider.open = jest
      .fn()
      .mockResolvedValue({ localPath: "/local/repo" });

    await repoService.openOrClone({
      provider: REPO_PROVIDERS.local,
      localPath: "My Notes",
    } as any);

    expect(localProvider.configure).toHaveBeenCalledWith(
      expect.objectContaining({ provider: REPO_PROVIDERS.local }),
    );
    expect(localProvider.open).toHaveBeenCalled();
    expect(mockConfigService.updateRepoSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: REPO_PROVIDERS.local,
        localPath: expect.any(String),
      }),
    );
  });

  it("returns errors when no repo is configured", async () => {
    const { repoService, mockConfigService } = createRepoService();
    mockConfigService.getRepoSettings = jest.fn().mockResolvedValue(null);

    await expect(repoService.getStatus()).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  });

  it("routes fetch, pull, push, and provider type through active provider", async () => {
    const { repoService, gitProvider, mockConfigService } = createRepoService();

    mockConfigService.getRepoSettings = jest.fn().mockResolvedValue({
      provider: REPO_PROVIDERS.git,
      localPath: "/repo",
      remoteUrl: "url",
      branch: "main",
      pat: "token",
      authMethod: "pat",
    });

    await repoService.fetch();
    await repoService.pull();
    await repoService.push();
    const providerType = await repoService.getProviderType();

    expect(gitProvider.fetch).toHaveBeenCalled();
    expect(gitProvider.pull).toHaveBeenCalled();
    expect(gitProvider.push).toHaveBeenCalled();
    expect(providerType).toBe(REPO_PROVIDERS.git);
  });

  it("throws for unsupported providers", async () => {
    const s3Provider = {
      type: REPO_PROVIDERS.s3,
      configure: jest.fn(),
      open: jest.fn(),
      getStatus: jest.fn().mockResolvedValue({}),
      fetch: jest.fn(),
      pull: jest.fn(),
      push: jest.fn(),
      startAutoSync: jest.fn(),
      stopAutoSync: jest.fn(),
    };
    const localProvider = {
      type: REPO_PROVIDERS.local,
      configure: jest.fn(),
      open: jest.fn(),
      getStatus: jest.fn().mockResolvedValue({}),
      fetch: jest.fn(),
      pull: jest.fn(),
      push: jest.fn(),
      startAutoSync: jest.fn(),
      stopAutoSync: jest.fn(),
    };
    const mockConfigService = {
      updateRepoSettings: jest.fn(),
      getAppSettings: jest.fn().mockResolvedValue({
        s3AutoSyncEnabled: false,
        s3AutoSyncIntervalSec: 30,
      }),
    } as unknown as ConfigService;
    const mockFsAdapter = {
      mkdir: jest.fn(),
      exists: jest.fn().mockResolvedValue(false),
    } as unknown as FsAdapter;
    const repoService = new RepoService(
      { s3: s3Provider as any, local: localProvider as any } as any,
      mockFsAdapter,
      mockConfigService,
    );

    await expect(
      repoService.openOrClone({
        provider: REPO_PROVIDERS.git,
        remoteUrl: "url",
        branch: "main",
        localPath: "",
        pat: "token",
        authMethod: "pat",
      } as any),
    ).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  });

  it("queues s3 upload when provider is s3", async () => {
    const { repoService, s3Provider, mockConfigService } = createRepoService();

    mockConfigService.getRepoSettings = jest.fn().mockResolvedValue({
      provider: REPO_PROVIDERS.s3,
      localPath: "/repo",
      bucket: "notes-bucket",
      region: "us-east-1",
      prefix: "",
      accessKeyId: "access-key",
      secretAccessKey: "secret-key",
      sessionToken: "",
    });

    await repoService.queueS3Upload("notes/a.md");

    expect(s3Provider.queueUpload).toHaveBeenCalledWith("notes/a.md");
  });

  it("ignores s3 queue operations for non-s3 providers", async () => {
    const { repoService, s3Provider, mockConfigService } = createRepoService();

    mockConfigService.getRepoSettings = jest.fn().mockResolvedValue({
      provider: REPO_PROVIDERS.git,
      localPath: "/repo",
      remoteUrl: "url",
      branch: "main",
      pat: "token",
      authMethod: "pat",
    });

    await repoService.queueS3Move("old.md", "new.md");
    await repoService.queueS3Upload("notes/a.md");

    expect(s3Provider.queueMove).not.toHaveBeenCalled();
    expect(s3Provider.queueUpload).not.toHaveBeenCalled();
  });

  it("normalizes s3 paths without parent folders", async () => {
    const { repoService, s3Provider, mockConfigService } = createRepoService();

    mockConfigService.getRepoSettings = jest.fn().mockResolvedValue({
      provider: REPO_PROVIDERS.s3,
      localPath: "/repo",
      bucket: "notes-bucket",
      region: "us-east-1",
      prefix: "",
      accessKeyId: "access-key",
      secretAccessKey: "secret-key",
      sessionToken: "",
    });

    await repoService.queueS3Move("old.md", "new name.md");

    expect(s3Provider.queueMove).toHaveBeenCalledWith("old.md", "new-name.md");
  });

  it("prepareRepo restores previous provider", async () => {
    const { repoService, gitProvider, s3Provider } = createRepoService();
    gitProvider.getStatus = jest
      .fn()
      .mockResolvedValue({ provider: REPO_PROVIDERS.git });
    s3Provider.open = jest.fn().mockRejectedValue(new Error("open failed"));

    await repoService.openOrClone({
      provider: REPO_PROVIDERS.git,
      remoteUrl: "https://github.com/user/repo.git",
      branch: "main",
      localPath: "/repo",
      pat: "token",
      authMethod: "pat",
    } as any);

    await repoService
      .prepareRepo({
        provider: REPO_PROVIDERS.s3,
        localPath: "/s3",
        bucket: "bucket",
        region: "region",
        prefix: "",
        accessKeyId: "key",
        secretAccessKey: "secret",
        sessionToken: "",
      } as any)
      .catch(() => undefined);

    expect(gitProvider.startAutoSync).toHaveBeenCalled();
  });

  it("logs failures when restore status fails after prepare", async () => {
    const { repoService, gitProvider, s3Provider } = createRepoService();
    gitProvider.getStatus = jest
      .fn()
      .mockResolvedValueOnce({ provider: REPO_PROVIDERS.git })
      .mockRejectedValueOnce(new Error("status failed"));
    s3Provider.open = jest.fn().mockRejectedValue(new Error("open failed"));

    await repoService.openOrClone({
      provider: REPO_PROVIDERS.git,
      remoteUrl: "https://github.com/user/repo.git",
      branch: "main",
      localPath: "/repo",
      pat: "token",
      authMethod: "pat",
    } as any);

    await repoService
      .prepareRepo({
        provider: REPO_PROVIDERS.s3,
        localPath: "/s3",
        bucket: "bucket",
        region: "region",
        prefix: "",
        accessKeyId: "key",
        secretAccessKey: "secret",
        sessionToken: "",
      } as any)
      .catch(() => undefined);

    expect(gitProvider.getStatus).toHaveBeenCalledTimes(2);
  });

  it("clears active provider when prepareRepo has no previous repo", async () => {
    const { repoService } = createRepoService();

    await repoService.prepareRepo({
      provider: REPO_PROVIDERS.git,
      remoteUrl: "https://github.com/user/repo.git",
      branch: "main",
      localPath: "/repo",
      pat: "token",
      authMethod: "pat",
    } as any);

    await expect(repoService.getStatus()).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  });

  it("generates a local path for s3 repos when missing", async () => {
    const { repoService, s3Provider, mockConfigService, mockFsAdapter } =
      createRepoService();
    jest.spyOn(mockFsAdapter, "exists").mockResolvedValue(false);
    mockConfigService.getAppSettings = jest.fn().mockResolvedValue({
      s3AutoSyncEnabled: false,
      s3AutoSyncIntervalSec: 30,
    });

    await repoService.openOrClone({
      provider: REPO_PROVIDERS.s3,
      bucket: "bucket",
      region: "region",
      prefix: "notes/2024",
      localPath: "",
      accessKeyId: "key",
      secretAccessKey: "secret",
      sessionToken: "",
    } as any);

    expect(s3Provider.configure).toHaveBeenCalledWith(
      expect.objectContaining({
        localPath: expect.stringContaining("bucket-notes-2024-s3"),
      }),
    );
  });

  it("returns early when refreshing auto sync without a repo", async () => {
    const { repoService } = createRepoService();

    await expect(
      repoService.refreshAutoSyncSettings(),
    ).resolves.toBeUndefined();
  });

  it("stops auto sync when destroyed", async () => {
    const { repoService, gitProvider } = createRepoService();

    await repoService.openOrClone({
      provider: REPO_PROVIDERS.git,
      remoteUrl: "https://github.com/user/repo.git",
      branch: "main",
      localPath: "/repo",
      pat: "token",
      authMethod: "pat",
    } as any);

    repoService.destroy();

    expect(gitProvider.stopAutoSync).toHaveBeenCalled();
  });
});
