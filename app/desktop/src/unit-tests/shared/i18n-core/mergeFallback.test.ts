import { mergeTranslationsWithFallback } from "../../../shared/i18n-core";
import type { TranslationDictionary } from "../../../shared/i18n-core";

describe("mergeTranslationsWithFallback", () => {
  const fallback: TranslationDictionary = {
    settings: {
      title: "Settings",
      save: "Save",
      section: {
        app: "App Settings",
      },
    },
    common: {
      cancel: "Cancel",
    },
  };

  it("returns a clone of fallback when override is empty", () => {
    const merged = mergeTranslationsWithFallback(fallback, null);

    expect(merged).toEqual(fallback);
    expect(merged).not.toBe(fallback);
  });

  it("overrides matching keys and keeps fallback keys", () => {
    const merged = mergeTranslationsWithFallback(fallback, {
      settings: {
        title: "Einstellungen",
      },
    });

    expect(merged).toEqual({
      settings: {
        title: "Einstellungen",
        save: "Save",
        section: {
          app: "App Settings",
        },
      },
      common: {
        cancel: "Cancel",
      },
    });
  });

  it("merges nested dictionaries recursively", () => {
    const merged = mergeTranslationsWithFallback(fallback, {
      settings: {
        section: {
          app: "Application",
        },
      },
    });

    expect(merged.settings).toEqual({
      title: "Settings",
      save: "Save",
      section: {
        app: "Application",
      },
    });
  });

  it("includes override-only keys", () => {
    const merged = mergeTranslationsWithFallback(fallback, {
      settings: {
        subtitle: "Configure your app",
      },
      profile: {
        title: "Profile",
      },
    });

    expect(merged).toEqual({
      settings: {
        title: "Settings",
        save: "Save",
        section: {
          app: "App Settings",
        },
        subtitle: "Configure your app",
      },
      common: {
        cancel: "Cancel",
      },
      profile: {
        title: "Profile",
      },
    });
  });

  it("does not mutate fallback or override dictionaries", () => {
    const override: TranslationDictionary = {
      settings: {
        title: "Einstellungen",
      },
    };

    const fallbackSnapshot = JSON.parse(JSON.stringify(fallback));
    const overrideSnapshot = JSON.parse(JSON.stringify(override));

    void mergeTranslationsWithFallback(fallback, override);

    expect(fallback).toEqual(fallbackSnapshot);
    expect(override).toEqual(overrideSnapshot);
  });
});
