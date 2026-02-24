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
        name: "notegit-tr",
        retryCount: "3",
        enabled: "true",
      },
    },
  },
});

describe("FrontendTranslationClient", () => {
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
    expect(client.t("common.app.name")).toBe("notegit-tr");
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
});
