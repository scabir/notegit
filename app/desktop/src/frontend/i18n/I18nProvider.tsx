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
import { FrontendTranslationClient } from "./TranslationClient";
import {
  defaultTranslations,
  resolveDefaultTranslation,
} from "./defaultTranslations";

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
