import {
  extractTranslationKeys,
  validateTranslationKeys,
} from "../../../shared/i18n-core";
import type { TranslationDictionary } from "../../../shared/i18n-core";

describe("translation key validation", () => {
  const fallback: TranslationDictionary = {
    settings: {
      title: "Settings",
      save: "Save",
      tab: {
        app: "App Settings",
      },
    },
    common: {
      cancel: "Cancel",
    },
  };

  it("extracts nested leaf keys", () => {
    expect(extractTranslationKeys(fallback)).toEqual([
      "common.cancel",
      "settings.save",
      "settings.tab.app",
      "settings.title",
    ]);
  });

  it("returns valid result when keys match", () => {
    const result = validateTranslationKeys(fallback, {
      settings: {
        title: "Einstellungen",
        save: "Speichern",
        tab: {
          app: "App-Einstellungen",
        },
      },
      common: {
        cancel: "Abbrechen",
      },
    });

    expect(result).toEqual({
      missingKeys: [],
      extraKeys: [],
      typeMismatches: [],
      isValid: true,
    });
  });

  it("detects missing and extra keys", () => {
    const result = validateTranslationKeys(fallback, {
      settings: {
        title: "Einstellungen",
      },
      common: {
        cancel: "Abbrechen",
      },
      profile: {
        title: "Profil",
      },
    });

    expect(result.missingKeys).toEqual(["settings.save", "settings.tab.app"]);
    expect(result.extraKeys).toEqual(["profile.title"]);
    expect(result.typeMismatches).toEqual([]);
    expect(result.isValid).toBe(false);
  });

  it("detects type mismatches for same key path", () => {
    const result = validateTranslationKeys(fallback, {
      settings: {
        title: "Einstellungen",
        save: "Speichern",
        tab: "Tabs",
      },
      common: {
        cancel: "Abbrechen",
      },
    });

    expect(result.typeMismatches).toEqual([
      {
        key: "settings.tab",
        expected: "object",
        actual: "leaf",
      },
    ]);
    expect(result.isValid).toBe(false);
  });
});
