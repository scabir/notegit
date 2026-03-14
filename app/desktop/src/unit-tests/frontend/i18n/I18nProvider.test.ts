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

const ReloadConsumer = () => {
  const { ready, locale, t, reload } = useI18n();
  return React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        void reload();
      },
    },
    `${ready ? "ready" : "loading"}|${locale}|${t("common.app.title", "Default")}`,
  );
};

const DefaultContextConsumer = () => {
  const { ready, locale, has, reload, t } = useI18n();
  return React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        void reload();
      },
    },
    `${ready ? "ready" : "loading"}|${locale}|${has("common.app.name") ? "has" : "missing"}|${t("common.app.name")}`,
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

  it("reloads translations and updates the active locale", async () => {
    const loader = jest
      .fn<Promise<ApiResponse<I18nBundle>>, []>()
      .mockResolvedValueOnce({
        ok: true,
        data: createBundle("tr-TR"),
      })
      .mockResolvedValueOnce({
        ok: true,
        data: createBundle("en-GB"),
      });
    const client = new FrontendTranslationClient(loader);
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(
          I18nProvider,
          { client },
          React.createElement(ReloadConsumer),
        ),
      );
    });

    await act(async () => {
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain("ready|tr-TR|Uygulama");

    await act(async () => {
      const reloadButton = renderer!.root.findByType("button");
      reloadButton.props.onClick();
      await flushPromises();
    });

    expect(loader).toHaveBeenCalledTimes(2);
    expect(flattenText(renderer!.toJSON())).toContain("ready|en-GB|Uygulama");
  });

  it("exposes default context values when used without provider", () => {
    const renderer = TestRenderer.create(
      React.createElement(DefaultContextConsumer),
    );

    const button = renderer.root.findByType("button");
    act(() => {
      button.props.onClick();
    });

    expect(flattenText(renderer.toJSON())).toContain(
      "ready|en-GB|has|NoteBranch",
    );
  });

  it("renders null when no children are provided", async () => {
    const client = new FrontendTranslationClient(null);
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(I18nProvider, { client }),
      );
      await flushPromises();
    });

    expect(renderer!.toJSON()).toBeNull();
  });

  it("does not update state after unmount when bundle loading resolves late", async () => {
    let resolveLoader: ((value: ApiResponse<I18nBundle>) => void) | null = null;
    const loader = jest.fn(
      () =>
        new Promise<ApiResponse<I18nBundle>>((resolve) => {
          resolveLoader = resolve;
        }),
    );
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

    renderer!.unmount();

    await act(async () => {
      resolveLoader?.({
        ok: true,
        data: createBundle("tr-TR"),
      });
      await flushPromises();
    });

    expect(loader).toHaveBeenCalledTimes(1);
  });
});
