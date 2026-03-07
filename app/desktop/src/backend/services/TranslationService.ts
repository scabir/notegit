import * as path from "path";
import type { FsAdapter } from "../adapters/FsAdapter";
import {
  mergeTranslationsWithFallback,
  validateTranslationKeys,
} from "../../shared/i18n-core";
import type {
  TranslationDictionary,
  TranslationValidationResult,
} from "../../shared/i18n-core";

const DEFAULT_FALLBACK_LOCALE = "en-GB";
const I18N_DIR_NAME = "i18n";
const TRANSLATION_EXTENSIONS = [".json", ".yaml", ".yml"] as const;

export type TranslationDomain = "frontend" | "backend";

export interface TranslationServiceOptions {
  localesRootDir: string;
  fallbackLocale?: string;
}

export interface TranslationBundle {
  requestedLocale: string;
  locale: string;
  fallbackLocale: string;
  translations: TranslationDictionary;
  namespaces: string[];
  validation: TranslationValidationResult;
}

interface LocaleDictionary {
  dictionary: TranslationDictionary;
  namespaces: string[];
}

type YamlModule = { parse: (content: string) => unknown };

let cachedYamlModule: YamlModule | null = null;

const emptyValidationResult = (): TranslationValidationResult => ({
  missingKeys: [],
  extraKeys: [],
  typeMismatches: [],
  isValid: true,
});

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isValidLocaleCode = (value: string): boolean =>
  /^[A-Za-z0-9-]+$/.test(value);

const cloneDictionary = (
  dictionary: TranslationDictionary,
): TranslationDictionary => {
  return mergeTranslationsWithFallback(dictionary, null);
};

export class TranslationService {
  private readonly fallbackLocale: string;
  private readonly localesRootDir: string;

  constructor(
    private readonly fsAdapter: Pick<
      FsAdapter,
      "exists" | "readdir" | "readFile"
    >,
    options: TranslationServiceOptions,
  ) {
    this.localesRootDir = options.localesRootDir;
    this.fallbackLocale = options.fallbackLocale || DEFAULT_FALLBACK_LOCALE;
  }

  getFallbackLocale(): string {
    return this.fallbackLocale;
  }

  async listSupportedLocales(domain: TranslationDomain): Promise<string[]> {
    const domainI18nDir = path.join(this.localesRootDir, domain, I18N_DIR_NAME);

    if (!(await this.fsAdapter.exists(domainI18nDir))) {
      return [this.fallbackLocale];
    }

    const entries = await this.fsAdapter.readdir(domainI18nDir);
    const locales = entries
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0 && isValidLocaleCode(entry));

    if (!locales.includes(this.fallbackLocale)) {
      locales.push(this.fallbackLocale);
    }

    return Array.from(new Set(locales)).sort((left, right) =>
      left.localeCompare(right),
    );
  }

  async getBundle(
    domain: TranslationDomain,
    requestedLocale: string,
  ): Promise<TranslationBundle> {
    const normalizedRequestedLocale = this.normalizeLocale(requestedLocale);
    const fallbackLocale = this.normalizeLocale(this.fallbackLocale);

    const fallbackDictionary = await this.loadLocaleDictionary(
      domain,
      fallbackLocale,
    );

    if (Object.keys(fallbackDictionary.dictionary).length === 0) {
      throw new Error(
        `Fallback locale "${fallbackLocale}" has no translation files for ${domain}`,
      );
    }

    if (normalizedRequestedLocale === fallbackLocale) {
      return {
        requestedLocale: normalizedRequestedLocale,
        locale: fallbackLocale,
        fallbackLocale,
        translations: cloneDictionary(fallbackDictionary.dictionary),
        namespaces: [...fallbackDictionary.namespaces],
        validation: emptyValidationResult(),
      };
    }

    const requestedDictionary = await this.loadLocaleDictionary(
      domain,
      normalizedRequestedLocale,
    );

    if (requestedDictionary.namespaces.length === 0) {
      return {
        requestedLocale: normalizedRequestedLocale,
        locale: fallbackLocale,
        fallbackLocale,
        translations: cloneDictionary(fallbackDictionary.dictionary),
        namespaces: [...fallbackDictionary.namespaces],
        validation: emptyValidationResult(),
      };
    }

    const translations = mergeTranslationsWithFallback(
      fallbackDictionary.dictionary,
      requestedDictionary.dictionary,
    );

    const validation = validateTranslationKeys(
      fallbackDictionary.dictionary,
      requestedDictionary.dictionary,
    );

    const namespaces = Array.from(
      new Set([
        ...fallbackDictionary.namespaces,
        ...requestedDictionary.namespaces,
      ]),
    ).sort((left, right) => left.localeCompare(right));

    return {
      requestedLocale: normalizedRequestedLocale,
      locale: normalizedRequestedLocale,
      fallbackLocale,
      translations,
      namespaces,
      validation,
    };
  }

  private async loadLocaleDictionary(
    domain: TranslationDomain,
    locale: string,
  ): Promise<LocaleDictionary> {
    const localeDir = path.join(
      this.localesRootDir,
      domain,
      I18N_DIR_NAME,
      locale,
    );

    if (!(await this.fsAdapter.exists(localeDir))) {
      return {
        dictionary: {},
        namespaces: [],
      };
    }

    const entries = await this.fsAdapter.readdir(localeDir);
    const translationFiles = entries
      .filter((entry) =>
        TRANSLATION_EXTENSIONS.some((extension) => entry.endsWith(extension)),
      )
      .sort((left, right) => left.localeCompare(right));

    const dictionary: TranslationDictionary = {};
    const namespaces: string[] = [];

    for (const fileName of translationFiles) {
      const namespace = this.getNamespaceFromFileName(fileName);
      const filePath = path.join(localeDir, fileName);
      const content = await this.fsAdapter.readFile(filePath);
      const parsed = await this.parseTranslationFile(fileName, content);

      if (!isPlainObject(parsed)) {
        throw new Error(
          `Translation file "${filePath}" must contain an object at root`,
        );
      }

      if (namespace in dictionary) {
        throw new Error(
          `Duplicate translation namespace "${namespace}" in locale "${locale}" (${domain})`,
        );
      }

      dictionary[namespace] = parsed as TranslationDictionary;
      namespaces.push(namespace);
    }

    return {
      dictionary,
      namespaces: namespaces.sort((left, right) => left.localeCompare(right)),
    };
  }

  private getNamespaceFromFileName(fileName: string): string {
    for (const extension of TRANSLATION_EXTENSIONS) {
      if (fileName.endsWith(extension)) {
        return fileName.slice(0, -extension.length);
      }
    }

    return fileName;
  }

  private async parseTranslationFile(
    fileName: string,
    content: string,
  ): Promise<unknown> {
    if (fileName.endsWith(".json")) {
      return JSON.parse(content);
    }

    if (fileName.endsWith(".yaml") || fileName.endsWith(".yml")) {
      const yaml = this.getYamlModule();
      return yaml.parse(content);
    }

    return {};
  }

  private getYamlModule(): YamlModule {
    if (cachedYamlModule) {
      return cachedYamlModule;
    }

    try {
      cachedYamlModule = require("yaml") as YamlModule;
      return cachedYamlModule;
    } catch (error: any) {
      throw new Error(
        `YAML parser is not available: ${error?.message || "Unknown error"}`,
      );
    }
  }

  private normalizeLocale(locale: string): string {
    const normalized = locale.trim();

    if (!normalized) {
      throw new Error("Locale is required");
    }

    if (!isValidLocaleCode(normalized)) {
      throw new Error(`Invalid locale code: ${locale}`);
    }

    return normalized;
  }
}
