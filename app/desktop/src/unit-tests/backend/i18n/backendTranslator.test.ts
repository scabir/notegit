import { createBackendTranslator } from "../../../backend/i18n/backendTranslator";

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
});
