import { createBackendTranslator } from "../../../backend/i18n/backendTranslator";
import { createFallbackBackendTranslator } from "../../../backend/i18n/backendTranslator";

describe("backendTranslator", () => {
  it("returns localized backend text for the configured language", async () => {
    const translationService = {
      getBundle: jest.fn().mockResolvedValue({
        locale: "tr-TR",
        translations: {
          files: {
            success: {
              syncedSuccessfully: "Basariyla senkronize edildi",
            },
          },
        },
      }),
    };

    const configService = {
      getAppSettings: jest.fn().mockResolvedValue({
        language: "tr-TR",
      }),
    };

    const t = createBackendTranslator(
      translationService as any,
      configService as any,
    );

    await expect(t("files.success.syncedSuccessfully")).resolves.toBe(
      "Basariyla senkronize edildi",
    );
    expect(translationService.getBundle).toHaveBeenCalledWith(
      "backend",
      "tr-TR",
    );
  });

  it("interpolates params into translated templates", async () => {
    const translationService = {
      getBundle: jest.fn().mockResolvedValue({
        locale: "tr-TR",
        translations: {
          i18n: {
            errors: {
              unsupportedLanguage: "Desteklenmeyen dil: {language}",
            },
          },
        },
      }),
    };

    const configService = {
      getAppSettings: jest.fn().mockResolvedValue({
        language: "tr-TR",
      }),
    };

    const t = createBackendTranslator(
      translationService as any,
      configService as any,
    );

    await expect(
      t("i18n.errors.unsupportedLanguage", {
        params: {
          language: "fr-FR",
        },
      }),
    ).resolves.toBe("Desteklenmeyen dil: fr-FR");
  });

  it("falls back to default language when config lookup fails", async () => {
    const translationService = {
      getBundle: jest.fn().mockResolvedValue({
        locale: "en-GB",
        translations: {
          files: {
            success: {
              syncedSuccessfully: "Synced successfully",
            },
          },
        },
      }),
    };

    const configService = {
      getAppSettings: jest.fn().mockRejectedValue(new Error("boom")),
    };

    const t = createBackendTranslator(
      translationService as any,
      configService as any,
    );

    await expect(t("files.success.syncedSuccessfully")).resolves.toBe(
      "Synced successfully",
    );
    expect(translationService.getBundle).toHaveBeenCalledWith(
      "backend",
      "en-GB",
    );
  });

  it("falls back to the provided fallback text when translation path does not resolve", async () => {
    const translationService = {
      getBundle: jest.fn().mockResolvedValue({
        locale: "tr-TR",
        translations: {
          files: {
            success: "plain-text",
          },
        },
      }),
    };

    const configService = {
      getAppSettings: jest.fn().mockResolvedValue({
        language: "tr-TR",
      }),
    };

    const t = createBackendTranslator(
      translationService as any,
      configService as any,
    );

    await expect(
      t("files.success.syncedSuccessfully", {
        fallback: "Fallback message",
      }),
    ).resolves.toBe("Fallback message");
  });

  it("stringifies numeric and boolean translation values", async () => {
    const translationService = {
      getBundle: jest.fn().mockResolvedValue({
        locale: "tr-TR",
        translations: {
          metrics: {
            retries: 3,
            enabled: true,
          },
        },
      }),
    };

    const configService = {
      getAppSettings: jest.fn().mockResolvedValue({
        language: "tr-TR",
      }),
    };

    const t = createBackendTranslator(
      translationService as any,
      configService as any,
    );

    await expect(t("metrics.retries")).resolves.toBe("3");
    await expect(t("metrics.enabled")).resolves.toBe("true");
  });

  it("uses explicit locale and cached bundle on repeated lookups", async () => {
    const translationService = {
      getBundle: jest.fn().mockResolvedValue({
        locale: "fr-FR",
        translations: {
          common: {
            greeting: "Bonjour",
          },
        },
      }),
    };

    const configService = {
      getAppSettings: jest.fn().mockResolvedValue({
        language: "tr-TR",
      }),
    };

    const t = createBackendTranslator(
      translationService as any,
      configService as any,
    );

    await expect(
      t("common.greeting", {
        locale: "fr-FR",
      }),
    ).resolves.toBe("Bonjour");
    await expect(
      t("common.greeting", {
        locale: "fr-FR",
      }),
    ).resolves.toBe("Bonjour");

    expect(translationService.getBundle).toHaveBeenCalledTimes(1);
    expect(translationService.getBundle).toHaveBeenCalledWith(
      "backend",
      "fr-FR",
    );
  });

  it("falls back to en-GB bundle when requested locale bundle fails", async () => {
    const translationService = {
      getBundle: jest
        .fn()
        .mockRejectedValueOnce(new Error("missing locale"))
        .mockResolvedValueOnce({
          locale: "en-GB",
          translations: {
            common: {
              title: "Default title",
            },
          },
        }),
    };

    const configService = {
      getAppSettings: jest.fn().mockResolvedValue({
        language: "tr-TR",
      }),
    };

    const t = createBackendTranslator(
      translationService as any,
      configService as any,
    );

    await expect(t("common.title")).resolves.toBe("Default title");
    expect(translationService.getBundle).toHaveBeenNthCalledWith(
      1,
      "backend",
      "tr-TR",
    );
    expect(translationService.getBundle).toHaveBeenNthCalledWith(
      2,
      "backend",
      "en-GB",
    );
  });

  it("fallback translator interpolates fallback text and key", async () => {
    const t = createFallbackBackendTranslator();

    await expect(
      t("i18n.errors.unsupportedLanguage", {
        fallback: "Unsupported language: {language}",
        params: { language: "de-DE" },
      }),
    ).resolves.toBe("Unsupported language: de-DE");

    await expect(
      t("plain.key", {
        params: { language: "ignored" },
      }),
    ).resolves.toBe("plain.key");
  });
});
