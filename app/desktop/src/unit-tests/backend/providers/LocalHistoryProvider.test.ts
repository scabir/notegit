import { LocalHistoryProvider } from "../../../backend/providers/LocalHistoryProvider";
import {
  ApiErrorCode,
  LocalRepoSettings,
  REPO_PROVIDERS,
} from "../../../shared/types";

describe("LocalHistoryProvider", () => {
  const settings: LocalRepoSettings = {
    provider: REPO_PROVIDERS.local,
    localPath: "/repo",
  };

  it("rejects non-local settings in configure", () => {
    const provider = new LocalHistoryProvider();

    try {
      provider.configure({ provider: REPO_PROVIDERS.git } as any);
      throw new Error("Expected configure to throw");
    } catch (error: any) {
      expect(error).toMatchObject({
        code: ApiErrorCode.REPO_PROVIDER_MISMATCH,
      });
    }
  });

  it("returns empty history for local repositories", async () => {
    const provider = new LocalHistoryProvider();
    provider.configure(settings);

    const history = await provider.getForFile("notes.md");

    expect(history).toEqual([]);
  });

  it("rejects version requests for local repositories", async () => {
    const provider = new LocalHistoryProvider();
    provider.configure(settings);

    await expect(provider.getVersion("v1", "notes.md")).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  });

  it("rejects diff requests for local repositories", async () => {
    const provider = new LocalHistoryProvider();
    provider.configure(settings);

    await expect(provider.getDiff("a", "b", "notes.md")).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  });
});
