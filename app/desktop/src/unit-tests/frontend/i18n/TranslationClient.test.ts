import {
  FrontendTranslationClient,
  createDefaultBundle,
} from "../../../frontend/i18n/TranslationClient";
import type { ApiResponse, I18nBundle } from "../../../shared/types";

const createBundle = (locale = "tr-TR"): I18nBundle => ({
  ...createDefaultBundle(),
  requestedLocale: locale,
  locale,
  translations: {
    common: {
      app: {
        name: "NoteBranch-tr",
        retryCount: 3,
        enabled: true,
      },
    },
  } as any,
});

describe("FrontendTranslationClient", () => {
  afterEach(() => {
    delete (global as any).window.NoteBranchApi;
  });

  it("uses a loaded bundle and resolves nested keys", async () => {
    const bundle = createBundle();
    const loadBundle = jest.fn<Promise<ApiResponse<I18nBundle>>, []>(
      async () => ({
        ok: true,
        data: bundle,
      }),
    );
    const client = new FrontendTranslationClient(loadBundle);

    await client.initialize();

    expect(loadBundle).toHaveBeenCalledTimes(1);
    expect(client.getBundle().locale).toBe("tr-TR");
    expect(client.t("common.app.name")).toBe("NoteBranch-tr");
    expect(client.t("common.app.retryCount")).toBe("3");
    expect(client.t("common.app.enabled")).toBe("true");
    expect(client.has("common.app.name")).toBe(true);
  });

  it("falls back to key or fallback text for missing translations", () => {
    const client = new FrontendTranslationClient(null);

    expect(client.t("common.app.missing")).toBe("common.app.missing");
    expect(client.t("common.app.missing", "Fallback text")).toBe(
      "Fallback text",
    );
    expect(client.has("common.app.missing")).toBe(false);
  });

  it("keeps default bundle when bundle loading fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const loadBundle = jest.fn<Promise<ApiResponse<I18nBundle>>, []>(
      async () => {
        throw new Error("boom");
      },
    );
    const client = new FrontendTranslationClient(loadBundle);

    const loadedBundle = await client.initialize();

    expect(loadedBundle.locale).toBe("en-GB");
    expect(client.t("common.app.name", "Default Name")).toBe("Default Name");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("keeps the existing bundle when loader returns unsuccessful response", async () => {
    const loadBundle = jest.fn<Promise<ApiResponse<I18nBundle>>, []>(
      async () => ({
        ok: false,
      }),
    );
    const client = new FrontendTranslationClient(loadBundle);

    const loadedBundle = await client.initialize();

    expect(loadBundle).toHaveBeenCalledTimes(1);
    expect(loadedBundle.locale).toBe("en-GB");
    expect(client.t("common.app.name", "Default Name")).toBe("Default Name");
  });

  it("returns fallback for nested lookups when an intermediate path is not an object", async () => {
    const bundle = createBundle();
    bundle.translations = {
      common: {
        app: "plain text",
      },
    };
    const loadBundle = jest.fn<Promise<ApiResponse<I18nBundle>>, []>(
      async () => ({
        ok: true,
        data: bundle,
      }),
    );
    const client = new FrontendTranslationClient(loadBundle);

    await client.initialize();

    expect(client.has("common.app.name")).toBe(false);
    expect(client.t("common.app.name", "Fallback value")).toBe(
      "Fallback value",
    );
  });

  it("uses window loader when no loader is provided explicitly", async () => {
    const bundle = createBundle("fr-FR");
    const getFrontendBundle = jest.fn(async () => ({
      ok: true,
      data: bundle,
    }));
    (global as any).window.NoteBranchApi = {
      i18n: {
        getFrontendBundle,
      },
    };

    const client = new FrontendTranslationClient();
    const loadedBundle = await client.initialize();

    expect(getFrontendBundle).toHaveBeenCalledTimes(1);
    expect(loadedBundle.locale).toBe("fr-FR");
  });

  it("returns default bundle when window loader is unavailable", async () => {
    delete (global as any).window.NoteBranchApi;

    const client = new FrontendTranslationClient();
    const loadedBundle = await client.initialize();

    expect(loadedBundle.locale).toBe("en-GB");
  });

  it("treats blank keys and dot-only keys as missing", () => {
    const client = new FrontendTranslationClient(null);

    expect(client.has("   ")).toBe(false);
    expect(client.t("   ", "Blank")).toBe("Blank");
    expect(client.has(" . . ")).toBe(false);
    expect(client.t(" . . ", "Dots")).toBe("Dots");
  });
});
