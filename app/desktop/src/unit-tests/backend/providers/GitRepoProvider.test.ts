import * as path from "path";
import { GitRepoProvider } from "../../../backend/providers/GitRepoProvider";
import {
  ApiErrorCode,
  AuthMethod,
  GitRepoSettings,
  REPO_PROVIDERS,
} from "../../../shared/types";

describe("GitRepoProvider", () => {
  const baseSettings: GitRepoSettings = {
    provider: REPO_PROVIDERS.git,
    remoteUrl: "https://github.com/user/my-notes.git",
    branch: "main",
    pat: "token",
    authMethod: AuthMethod.PAT,
    localPath: "/repo",
  };

  const createProvider = () => {
    const gitAdapter = {
      clone: jest.fn(),
      init: jest.fn(),
      addRemote: jest.fn(),
      add: jest.fn(),
      commit: jest.fn(),
      push: jest.fn(),
      fetch: jest.fn(),
      pull: jest.fn(),
      status: jest.fn(),
      getCurrentBranch: jest.fn(),
      getAheadBehind: jest.fn(),
    };
    const fsAdapter = {
      exists: jest.fn(),
      mkdir: jest.fn(),
      writeFile: jest.fn(),
    };

    const provider = new GitRepoProvider(gitAdapter as any, fsAdapter as any);
    return { provider, gitAdapter, fsAdapter };
  };

  it("rejects when configured with non-git settings", async () => {
    const { provider } = createProvider();

    await expect(
      provider.open({ provider: REPO_PROVIDERS.s3 } as any),
    ).rejects.toMatchObject({
      code: ApiErrorCode.REPO_PROVIDER_MISMATCH,
    });
  });

  it("rejects configure calls with non-git settings", () => {
    const { provider } = createProvider();

    expect(() =>
      provider.configure({ provider: REPO_PROVIDERS.s3 } as any),
    ).toThrow();
  });

  it("rejects when local path is missing", async () => {
    const { provider } = createProvider();
    const settings = { ...baseSettings, localPath: "" };

    await expect(provider.open(settings)).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  });

  it("clones when repo does not exist locally", async () => {
    const { provider, gitAdapter, fsAdapter } = createProvider();
    fsAdapter.exists.mockResolvedValue(false);
    gitAdapter.clone.mockResolvedValue(undefined);

    await provider.open(baseSettings);

    expect(fsAdapter.exists).toHaveBeenCalledWith("/repo");
    expect(gitAdapter.clone).toHaveBeenCalledWith(
      baseSettings.remoteUrl,
      baseSettings.localPath,
      baseSettings.branch,
      baseSettings.pat,
    );
    expect(gitAdapter.init).not.toHaveBeenCalled();
  });

  it("initializes empty remote repositories with a README commit", async () => {
    const { provider, gitAdapter, fsAdapter } = createProvider();
    fsAdapter.exists.mockResolvedValue(false);
    gitAdapter.clone.mockRejectedValue(
      new Error("Remote branch main not found in upstream origin"),
    );

    await provider.open(baseSettings);

    expect(fsAdapter.mkdir).toHaveBeenCalledWith("/repo", { recursive: true });
    expect(gitAdapter.init).toHaveBeenCalledWith("/repo");
    expect(fsAdapter.writeFile).toHaveBeenCalledWith(
      path.join("/repo", "README.md"),
      "# my-notes\n\nThis repository was initialized by NoteBranch.\n",
    );
    expect(gitAdapter.addRemote).toHaveBeenCalledWith(baseSettings.remoteUrl);
    expect(gitAdapter.add).toHaveBeenCalledWith("README.md");
    expect(gitAdapter.commit).toHaveBeenCalledWith(
      "Initial commit from NoteBranch",
    );
    expect(gitAdapter.push).toHaveBeenCalledWith(baseSettings.pat);
  });

  it("opens existing repositories by initializing git", async () => {
    const { provider, gitAdapter, fsAdapter } = createProvider();
    fsAdapter.exists.mockResolvedValue(true);

    await provider.open(baseSettings);

    expect(gitAdapter.init).toHaveBeenCalledWith("/repo");
    expect(gitAdapter.clone).not.toHaveBeenCalled();
  });

  it("returns git status with ahead/behind and pending counts", async () => {
    const { provider, gitAdapter } = createProvider();
    provider.configure(baseSettings);

    gitAdapter.init.mockResolvedValue(undefined);
    gitAdapter.status.mockResolvedValue({ files: ["notes.md"] });
    gitAdapter.getCurrentBranch.mockResolvedValue("main");
    gitAdapter.getAheadBehind.mockResolvedValue({ ahead: 2, behind: 1 });

    const status = await provider.getStatus();

    expect(status).toMatchObject({
      provider: REPO_PROVIDERS.git,
      branch: "main",
      ahead: 2,
      behind: 1,
      pendingPushCount: 2,
      needsPull: true,
      hasUncommitted: true,
    });
  });

  it("commits conflicts and still pushes on pull errors", async () => {
    const { provider, gitAdapter } = createProvider();
    provider.configure(baseSettings);

    gitAdapter.init.mockResolvedValue(undefined);
    gitAdapter.fetch.mockResolvedValue(undefined);
    gitAdapter.getAheadBehind.mockResolvedValue({ ahead: 0, behind: 1 });
    gitAdapter.pull.mockRejectedValue(
      new Error("CONFLICT (content): merge failed"),
    );
    gitAdapter.add.mockResolvedValue(undefined);
    gitAdapter.commit.mockResolvedValue(undefined);
    gitAdapter.push.mockResolvedValue(undefined);

    await provider.push();

    expect(gitAdapter.add).toHaveBeenCalledWith(".");
    expect(gitAdapter.commit).toHaveBeenCalledWith(
      "Merge remote changes - conflicts present",
    );
    expect(gitAdapter.push).toHaveBeenCalledWith(baseSettings.pat);
  });

  it("skips auto-push when no commits are ahead", async () => {
    const { provider, gitAdapter } = createProvider();
    provider.configure(baseSettings);

    gitAdapter.init.mockResolvedValue(undefined);
    gitAdapter.status.mockResolvedValue({ files: [] });
    gitAdapter.getCurrentBranch.mockResolvedValue("main");
    gitAdapter.getAheadBehind.mockResolvedValue({ ahead: 0, behind: 0 });

    await (provider as any).tryAutoPush();

    expect(gitAdapter.fetch).not.toHaveBeenCalled();
    expect(gitAdapter.push).not.toHaveBeenCalled();
  });

  it("auto-pushes when commits are ahead", async () => {
    const { provider, gitAdapter } = createProvider();
    provider.configure(baseSettings);

    gitAdapter.init.mockResolvedValue(undefined);
    gitAdapter.status.mockResolvedValue({ files: [] });
    gitAdapter.getCurrentBranch.mockResolvedValue("main");
    gitAdapter.getAheadBehind.mockResolvedValue({ ahead: 1, behind: 0 });
    gitAdapter.fetch.mockResolvedValue(undefined);
    gitAdapter.pull.mockResolvedValue(undefined);
    gitAdapter.push.mockResolvedValue(undefined);

    await (provider as any).tryAutoPush();

    expect(gitAdapter.fetch).toHaveBeenCalledTimes(2);
    expect(gitAdapter.push).toHaveBeenCalledWith(baseSettings.pat);
  });

  it("restarts the auto-sync timer when startAutoSync is called again", () => {
    jest.useFakeTimers();

    const { provider } = createProvider();
    const setIntervalSpy = jest.spyOn(global, "setInterval");
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");

    provider.startAutoSync();
    const firstTimer = (provider as any).autoSyncTimer;
    provider.startAutoSync();

    expect(setIntervalSpy).toHaveBeenCalledTimes(2);
    expect(clearIntervalSpy).toHaveBeenCalledWith(firstTimer);
    expect((provider as any).autoSyncTimer).not.toBe(firstTimer);

    provider.stopAutoSync();

    expect(clearIntervalSpy).toHaveBeenCalledTimes(2);

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
    jest.useRealTimers();
  });

  it("uses the provided interval when starting auto-sync", () => {
    jest.useFakeTimers();

    const { provider } = createProvider();
    const setIntervalSpy = jest.spyOn(global, "setInterval");

    provider.startAutoSync(45000);

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 45000);

    setIntervalSpy.mockRestore();
    jest.useRealTimers();
  });

  it("fetches from remote and returns status", async () => {
    const { provider, gitAdapter } = createProvider();
    provider.configure(baseSettings);

    gitAdapter.init.mockResolvedValue(undefined);
    gitAdapter.fetch.mockResolvedValue(undefined);
    gitAdapter.status.mockResolvedValue({ files: [] });
    gitAdapter.getCurrentBranch.mockResolvedValue("main");
    gitAdapter.getAheadBehind.mockResolvedValue({ ahead: 0, behind: 0 });

    const status = await provider.fetch();

    expect(gitAdapter.fetch).toHaveBeenCalled();
    expect(status.branch).toBe("main");
  });

  it("throws when pulling without settings", async () => {
    const { provider } = createProvider();
    (provider as any).repoPath = "/repo";

    await expect(provider.pull()).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  });

  it("pulls successfully when settings are available", async () => {
    const { provider, gitAdapter } = createProvider();
    provider.configure(baseSettings);

    gitAdapter.init.mockResolvedValue(undefined);
    gitAdapter.pull.mockResolvedValue(undefined);

    await provider.pull();

    expect(gitAdapter.pull).toHaveBeenCalledWith(baseSettings.pat);
  });

  it("hydrates repoPath from settings during ensureRepoReady", async () => {
    const { provider, gitAdapter } = createProvider();
    provider.configure(baseSettings);
    (provider as any).repoPath = null;

    gitAdapter.init.mockResolvedValue(undefined);
    gitAdapter.status.mockResolvedValue({ files: [] });
    gitAdapter.getCurrentBranch.mockResolvedValue("main");
    gitAdapter.getAheadBehind.mockResolvedValue({ ahead: 0, behind: 0 });

    await provider.getStatus();

    expect(gitAdapter.init).toHaveBeenCalledWith("/repo");
  });

  it("throws when no repository is configured", async () => {
    const { provider } = createProvider();

    await expect(provider.getStatus()).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  });

  it("pushes without pulling when remote is up to date", async () => {
    const { provider, gitAdapter } = createProvider();
    provider.configure(baseSettings);

    gitAdapter.init.mockResolvedValue(undefined);
    gitAdapter.fetch.mockResolvedValue(undefined);
    gitAdapter.getAheadBehind.mockResolvedValue({ ahead: 1, behind: 0 });
    gitAdapter.push.mockResolvedValue(undefined);

    await provider.push();

    expect(gitAdapter.pull).not.toHaveBeenCalled();
    expect(gitAdapter.push).toHaveBeenCalledWith(baseSettings.pat);
  });

  it("rethrows non-conflict pull errors", async () => {
    const { provider, gitAdapter } = createProvider();
    provider.configure(baseSettings);

    gitAdapter.init.mockResolvedValue(undefined);
    gitAdapter.fetch.mockResolvedValue(undefined);
    gitAdapter.getAheadBehind.mockResolvedValue({ ahead: 0, behind: 1 });
    gitAdapter.pull.mockRejectedValue(new Error("network down"));

    await expect(provider.push()).rejects.toThrow("network down");
  });

  it("falls back to a hash when extracting repo name", () => {
    const { provider } = createProvider();
    const value = (provider as any).extractRepoName("invalid-url");
    expect(value).toHaveLength(8);
  });
});
