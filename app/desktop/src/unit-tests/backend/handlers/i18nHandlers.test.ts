import { registerI18nHandlers } from "../../../backend/handlers/i18nHandlers";
import { ApiErrorCode, DEFAULT_APP_LANGUAGE } from "../../../shared/types";

describe("i18nHandlers", () => {
  const createIpcMain = () => {
    const handlers: Record<string, (...args: any[]) => any> = {};
    const ipcMain = {
      handle: jest.fn((channel: string, handler: (...args: any[]) => any) => {
        handlers[channel] = handler;
      }),
    } as any;

    return { ipcMain, handlers };
  };

  it("returns i18n metadata", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const translationService = {
      listSupportedLocales: jest.fn().mockResolvedValue(["de-DE", "en-GB"]),
      getFallbackLocale: jest.fn().mockReturnValue("en-GB"),
    } as any;
    const configService = {
      getAppSettings: jest.fn().mockResolvedValue({
        language: "de-DE",
      }),
    } as any;

    registerI18nHandlers(ipcMain, translationService, configService);

    const response = await handlers["i18n:getMeta"]();

    expect(response.ok).toBe(true);
    expect(response.data).toEqual({
      currentLocale: "de-DE",
      fallbackLocale: "en-GB",
      supportedLocales: ["de-DE", "en-GB"],
    });
  });

  it("returns fallback current locale when app language is missing", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const translationService = {
      listSupportedLocales: jest.fn().mockResolvedValue(["en-GB"]),
      getFallbackLocale: jest.fn().mockReturnValue("en-GB"),
    } as any;
    const configService = {
      getAppSettings: jest.fn().mockResolvedValue({}),
    } as any;

    registerI18nHandlers(ipcMain, translationService, configService);

    const response = await handlers["i18n:getMeta"]();

    expect(response.ok).toBe(true);
    expect(response.data?.currentLocale).toBe(DEFAULT_APP_LANGUAGE);
  });

  it("returns frontend bundle for configured language", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const bundle = {
      requestedLocale: "de-DE",
      locale: "de-DE",
      fallbackLocale: "en-GB",
      translations: { SettingsDialog: { title: "Einstellungen" } },
      namespaces: ["SettingsDialog"],
      validation: {
        missingKeys: [],
        extraKeys: [],
        typeMismatches: [],
        isValid: true,
      },
    };
    const translationService = {
      getBundle: jest.fn().mockResolvedValue(bundle),
      listSupportedLocales: jest.fn(),
      getFallbackLocale: jest.fn(),
    } as any;
    const configService = {
      getAppSettings: jest.fn().mockResolvedValue({ language: "de-DE" }),
    } as any;

    registerI18nHandlers(ipcMain, translationService, configService);

    const response = await handlers["i18n:getFrontendBundle"]();

    expect(response.ok).toBe(true);
    expect(response.data).toEqual(bundle);
    expect(translationService.getBundle).toHaveBeenCalledWith(
      "frontend",
      "de-DE",
    );
  });

  it("validates language before saving", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const translationService = {
      listSupportedLocales: jest.fn().mockResolvedValue(["en-GB", "tr-TR"]),
      getFallbackLocale: jest.fn(),
      getBundle: jest.fn(),
    } as any;
    const configService = {
      updateAppSettings: jest.fn().mockResolvedValue(undefined),
      getAppSettings: jest.fn(),
    } as any;

    registerI18nHandlers(ipcMain, translationService, configService);

    const response = await handlers["i18n:setLanguage"](null, "tr-TR");

    expect(response.ok).toBe(true);
    expect(configService.updateAppSettings).toHaveBeenCalledWith({
      language: "tr-TR",
    });
  });

  it("returns validation error for unsupported language", async () => {
    const { ipcMain, handlers } = createIpcMain();
    const translationService = {
      listSupportedLocales: jest.fn().mockResolvedValue(["en-GB", "de-DE"]),
      getFallbackLocale: jest.fn(),
      getBundle: jest.fn(),
    } as any;
    const configService = {
      updateAppSettings: jest.fn(),
      getAppSettings: jest.fn(),
    } as any;

    registerI18nHandlers(ipcMain, translationService, configService);

    const response = await handlers["i18n:setLanguage"](null, "tr-TR");

    expect(response.ok).toBe(false);
    expect(response.error?.code).toBe(ApiErrorCode.VALIDATION_ERROR);
    expect(configService.updateAppSettings).not.toHaveBeenCalled();
  });
});
