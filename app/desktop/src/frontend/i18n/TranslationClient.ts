import { DEFAULT_APP_LANGUAGE } from "../../shared/types";
import type { ApiResponse, I18nBundle } from "../../shared/types";

type BundleLoader = () => Promise<ApiResponse<I18nBundle>>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const createDefaultBundle = (): I18nBundle => ({
  requestedLocale: DEFAULT_APP_LANGUAGE,
  locale: DEFAULT_APP_LANGUAGE,
  fallbackLocale: DEFAULT_APP_LANGUAGE,
  translations: {},
  namespaces: [],
  validation: {
    missingKeys: [],
    extraKeys: [],
    typeMismatches: [],
    isValid: true,
  },
});

const resolveWindowBundleLoader = (): BundleLoader | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.notegitApi?.i18n?.getFrontendBundle || null;
};

export class FrontendTranslationClient {
  private bundle: I18nBundle;
  private readonly bundleLoader: BundleLoader | null;

  constructor(bundleLoader?: BundleLoader | null) {
    this.bundle = createDefaultBundle();
    this.bundleLoader =
      bundleLoader === undefined ? resolveWindowBundleLoader() : bundleLoader;
  }

  getBundle(): I18nBundle {
    return this.bundle;
  }

  has(key: string): boolean {
    return this.getRawValue(key) !== undefined;
  }

  t(key: string, fallback?: string): string {
    const value = this.getRawValue(key);

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    return fallback ?? key;
  }

  async initialize(): Promise<I18nBundle> {
    if (!this.bundleLoader) {
      return this.bundle;
    }

    try {
      const response = await this.bundleLoader();
      if (response.ok && response.data) {
        this.bundle = response.data;
      }
    } catch (error) {
      console.error("Failed to initialize frontend translations:", error);
    }

    return this.bundle;
  }

  private getRawValue(key: string): unknown {
    const normalizedKey = key.trim();
    if (!normalizedKey) {
      return undefined;
    }

    const segments = normalizedKey
      .split(".")
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);

    if (segments.length === 0) {
      return undefined;
    }

    let current: unknown = this.bundle.translations;

    for (const segment of segments) {
      if (!isRecord(current)) {
        return undefined;
      }

      if (!(segment in current)) {
        return undefined;
      }

      current = current[segment];
    }

    return current;
  }
}

export { createDefaultBundle };
