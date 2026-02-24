import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { I18nProvider, useI18n } from "../../../frontend/i18n";
import {
  FrontendTranslationClient,
  createDefaultBundle,
} from "../../../frontend/i18n/TranslationClient";
import type { ApiResponse, I18nBundle } from "../../../shared/types";

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const flattenText = (node: any): string => {
  if (!node) {
    return "";
  }
  if (typeof node === "string") {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(flattenText).join("");
  }
  return node.children ? node.children.map(flattenText).join("") : "";
};

const createBundle = (locale = "tr-TR"): I18nBundle => ({
  ...createDefaultBundle(),
  requestedLocale: locale,
  locale,
  translations: {
    common: {
      app: {
        title: "Uygulama",
      },
    },
  },
});

const Consumer = () => {
  const { ready, locale, t } = useI18n();
  return React.createElement(
    "div",
    null,
    `${ready ? "ready" : "loading"}|${locale}|${t("common.app.title", "Default")}`,
  );
};

describe("I18nProvider", () => {
  it("loads bundle and exposes translations through context", async () => {
    const bundle = createBundle();
    const loader = jest.fn<Promise<ApiResponse<I18nBundle>>, []>(async () => ({
      ok: true,
      data: bundle,
    }));
    const client = new FrontendTranslationClient(loader);
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(
          I18nProvider,
          { client },
          React.createElement(Consumer),
        ),
      );
    });

    await act(async () => {
      await flushPromises();
    });

    expect(loader).toHaveBeenCalledTimes(1);
    expect(flattenText(renderer!.toJSON())).toContain("ready|tr-TR|Uygulama");
  });

  it("keeps app stable when loading fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const loader = jest.fn<Promise<ApiResponse<I18nBundle>>, []>(async () => {
      throw new Error("unable to load");
    });
    const client = new FrontendTranslationClient(loader);
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(
          I18nProvider,
          { client },
          React.createElement(Consumer),
        ),
      );
    });

    await act(async () => {
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain("ready|en-GB|Default");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
