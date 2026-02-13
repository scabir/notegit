import { LocalRepoProvider } from "../../../backend/providers/LocalRepoProvider";
import {
  ApiErrorCode,
  LocalRepoSettings,
  REPO_PROVIDERS,
} from "../../../shared/types";

describe("LocalRepoProvider", () => {
  const createProvider = () => {
    const fsAdapter = {
      exists: jest.fn(),
      mkdir: jest.fn(),
      stat: jest.fn(),
    };

    const provider = new LocalRepoProvider(fsAdapter as any);
    return { provider, fsAdapter };
  };

  const settings: LocalRepoSettings = {
    provider: REPO_PROVIDERS.local,
    localPath: "/repo",
  };

  it("rejects non-local settings", async () => {
    const { provider } = createProvider();

    await expect(
      provider.open({ provider: REPO_PROVIDERS.git } as any),
    ).rejects.toMatchObject({
      code: ApiErrorCode.REPO_PROVIDER_MISMATCH,
    });
  });

  it("rejects when local path is missing", async () => {
    const { provider } = createProvider();

    await expect(
      provider.open({ provider: REPO_PROVIDERS.local, localPath: "" } as any),
    ).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  });

  it("creates the local folder when it does not exist", async () => {
    const { provider, fsAdapter } = createProvider();
    fsAdapter.exists.mockResolvedValue(false);
    fsAdapter.mkdir.mockResolvedValue(undefined);

    const response = await provider.open(settings);

    expect(fsAdapter.exists).toHaveBeenCalledWith("/repo");
    expect(fsAdapter.mkdir).toHaveBeenCalledWith("/repo", { recursive: true });
    expect(response.localPath).toBe("/repo");
  });

  it("rejects when local path is not a directory", async () => {
    const { provider, fsAdapter } = createProvider();
    fsAdapter.exists.mockResolvedValue(true);
    fsAdapter.stat.mockResolvedValue({ isDirectory: () => false });

    await expect(provider.open(settings)).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  });

  it("returns a local status snapshot", async () => {
    const { provider } = createProvider();
    provider.configure(settings);

    const status = await provider.getStatus();

    expect(status).toMatchObject({
      provider: REPO_PROVIDERS.local,
      branch: REPO_PROVIDERS.local,
      ahead: 0,
      behind: 0,
      hasUncommitted: false,
      pendingPushCount: 0,
      needsPull: false,
    });
  });

  it("throws when status is requested without configuration", async () => {
    const { provider } = createProvider();

    await expect(provider.getStatus()).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  });

  it("rejects unsupported sync operations", async () => {
    const { provider } = createProvider();
    provider.configure(settings);

    await expect(provider.fetch()).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
    await expect(provider.pull()).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
    await expect(provider.push()).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  });

  it("treats auto sync methods as no-ops", () => {
    const { provider } = createProvider();

    expect(() => provider.startAutoSync()).not.toThrow();
    expect(() => provider.stopAutoSync()).not.toThrow();
  });
});
