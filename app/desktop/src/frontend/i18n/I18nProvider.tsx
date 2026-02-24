import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { I18nBundle } from "../../shared/types";
import { DEFAULT_APP_LANGUAGE } from "../../shared/types";
import aboutDialogEnGb from "../i18n/en-GB/aboutDialog.json";
import commitDialogEnGb from "../i18n/en-GB/commitDialog.json";
import commonEnGb from "../i18n/en-GB/common.json";
import editorShellEnGb from "../i18n/en-GB/editorShell.json";
import fileTreeViewEnGb from "../i18n/en-GB/fileTreeView.json";
import repoSetupDialogEnGb from "../i18n/en-GB/repoSetupDialog.json";
import searchDialogEnGb from "../i18n/en-GB/searchDialog.json";
import settingsExportTabEnGb from "../i18n/en-GB/settingsExportTab.json";
import settingsLogsTabEnGb from "../i18n/en-GB/settingsLogsTab.json";
import settingsProfilesTabEnGb from "../i18n/en-GB/settingsProfilesTab.json";
import settingsRepositoryTabEnGb from "../i18n/en-GB/settingsRepositoryTab.json";
import settingsDialogEnGb from "../i18n/en-GB/settingsDialog.json";
import statusBarEnGb from "../i18n/en-GB/statusBar.json";
import { FrontendTranslationClient } from "./TranslationClient";

export interface I18nContextValue {
  ready: boolean;
  requestedLocale: string;
  locale: string;
  fallbackLocale: string;
  namespaces: string[];
  validation: I18nBundle["validation"];
  t: (key: string, fallback?: string) => string;
  has: (key: string) => boolean;
  reload: () => Promise<void>;
}

interface I18nProviderProps {
  children?: ReactNode;
  client?: FrontendTranslationClient;
}

const defaultTranslations = {
  aboutDialog: aboutDialogEnGb,
  commitDialog: commitDialogEnGb,
  common: commonEnGb,
  editorShell: editorShellEnGb,
  fileTreeView: fileTreeViewEnGb,
  repoSetupDialog: repoSetupDialogEnGb,
  searchDialog: searchDialogEnGb,
  settingsExportTab: settingsExportTabEnGb,
  settingsDialog: settingsDialogEnGb,
  settingsLogsTab: settingsLogsTabEnGb,
  settingsProfilesTab: settingsProfilesTabEnGb,
  settingsRepositoryTab: settingsRepositoryTabEnGb,
  statusBar: statusBarEnGb,
} as const;

const resolveDefaultTranslation = (key: string): string | undefined => {
  const segments = key
    .split(".")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return undefined;
  }

  let current: unknown = defaultTranslations;
  for (const segment of segments) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === "string" ? current : undefined;
};

const defaultContextValue: I18nContextValue = {
  ready: true,
  requestedLocale: DEFAULT_APP_LANGUAGE,
  locale: DEFAULT_APP_LANGUAGE,
  fallbackLocale: DEFAULT_APP_LANGUAGE,
  namespaces: Object.keys(defaultTranslations),
  validation: {
    missingKeys: [],
    extraKeys: [],
    typeMismatches: [],
    isValid: true,
  },
  t: (key: string) => resolveDefaultTranslation(key) || key,
  has: (key: string) => resolveDefaultTranslation(key) !== undefined,
  reload: async () => {},
};

const I18nContext = createContext<I18nContextValue>(defaultContextValue);

export function I18nProvider({
  children,
  client,
}: I18nProviderProps): JSX.Element {
  const translationClient = useMemo(
    () => client || new FrontendTranslationClient(),
    [client],
  );
  const [bundle, setBundle] = useState<I18nBundle>(() =>
    translationClient.getBundle(),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadBundle = async () => {
      const loadedBundle = await translationClient.initialize();
      if (!mounted) {
        return;
      }

      setBundle(loadedBundle);
      setReady(true);
    };

    void loadBundle();

    return () => {
      mounted = false;
    };
  }, [translationClient]);

  const value = useMemo<I18nContextValue>(
    () => ({
      ready,
      requestedLocale: bundle.requestedLocale || DEFAULT_APP_LANGUAGE,
      locale: bundle.locale || DEFAULT_APP_LANGUAGE,
      fallbackLocale: bundle.fallbackLocale || DEFAULT_APP_LANGUAGE,
      namespaces: bundle.namespaces,
      validation: bundle.validation,
      t: (key: string, fallback?: string) => translationClient.t(key, fallback),
      has: (key: string) => translationClient.has(key),
      reload: async () => {
        const nextBundle = await translationClient.initialize();
        setBundle(nextBundle);
      },
    }),
    [bundle, ready, translationClient],
  );

  return (
    <I18nContext.Provider value={value}>
      {children ?? null}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
