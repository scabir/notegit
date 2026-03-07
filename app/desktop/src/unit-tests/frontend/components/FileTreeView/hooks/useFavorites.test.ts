import React, { forwardRef, useImperativeHandle } from "react";
import TestRenderer, { act } from "react-test-renderer";
import { useFavorites } from "../../../../../frontend/components/FileTreeView/hooks/useFavorites";
import { FAVORITES_STORAGE_KEY } from "../../../../../frontend/components/FileTreeView/constants";
import type { FileTreeNode } from "../../../../../shared/types";

const tree: FileTreeNode[] = [
  {
    id: "folder",
    name: "folder",
    path: "folder",
    type: "folder",
    children: [
      {
        id: "folder/note.md",
        name: "note.md",
        path: "folder/note.md",
        type: "file",
      },
    ],
  },
];

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const createLocalStorageMock = () => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => (key in store ? store[key] : null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
};

type HookHandle = ReturnType<typeof useFavorites>;

type HookHarnessProps = {
  selectedNode: FileTreeNode | null;
};

const HookHarness = forwardRef<HookHandle, HookHarnessProps>(
  ({ selectedNode }, ref) => {
    const hook = useFavorites(tree, selectedNode);
    useImperativeHandle(ref, () => hook, [hook]);
    return null;
  },
);

HookHarness.displayName = "HookHarness";

describe("useFavorites", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const localStorage = createLocalStorageMock();
    Object.defineProperty(window, "localStorage", {
      value: localStorage,
      configurable: true,
    });

    (window as any).notegitApi = {
      config: {
        getFavorites: jest.fn().mockResolvedValue({ ok: true, data: [] }),
        updateFavorites: jest.fn().mockResolvedValue({ ok: true }),
      },
    };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("loads favorites from the config api when available", async () => {
    (window as any).notegitApi.config.getFavorites.mockResolvedValue({
      ok: true,
      data: ["folder/note.md", "missing.md"],
    });

    const ref = React.createRef<HookHandle>();
    TestRenderer.create(
      React.createElement(HookHarness, { ref, selectedNode: null }),
    );

    await act(async () => {
      await flushPromises();
    });

    expect(
      ref.current?.favoriteNodes.map((node: FileTreeNode) => node.path),
    ).toEqual(["folder/note.md"]);
  });

  it("falls back to localStorage when config api fails", async () => {
    (window as any).notegitApi.config.getFavorites.mockRejectedValue(
      new Error("fail"),
    );
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(["folder/note.md"]),
    );

    const ref = React.createRef<HookHandle>();
    TestRenderer.create(
      React.createElement(HookHarness, { ref, selectedNode: null }),
    );

    await act(async () => {
      await flushPromises();
    });

    expect(
      ref.current?.favoriteNodes.map((node: FileTreeNode) => node.path),
    ).toEqual(["folder/note.md"]);
  });

  it("ignores invalid localStorage data", async () => {
    (window as any).notegitApi.config.getFavorites.mockResolvedValue({
      ok: false,
    });
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, "not-json");

    const ref = React.createRef<HookHandle>();
    TestRenderer.create(
      React.createElement(HookHarness, { ref, selectedNode: null }),
    );

    await act(async () => {
      await flushPromises();
    });

    expect(ref.current?.favoriteNodes).toEqual([]);
  });

  it("toggles favorites and persists to config and localStorage", async () => {
    const selectedNode = tree[0].children?.[0] || null;
    const ref = React.createRef<HookHandle>();
    TestRenderer.create(
      React.createElement(HookHarness, { ref, selectedNode }),
    );

    await act(async () => {
      await flushPromises();
    });

    act(() => {
      ref.current?.toggleFavorite();
    });

    expect(
      (window as any).notegitApi.config.updateFavorites,
    ).toHaveBeenCalledWith(["folder/note.md"]);
    expect(window.localStorage.setItem).toHaveBeenCalled();
  });

  it("updates favorites on path changes and removes nested paths", async () => {
    (window as any).notegitApi.config.getFavorites.mockResolvedValue({
      ok: true,
      data: ["folder/note.md", "folder/sub/file.md"],
    });

    const ref = React.createRef<HookHandle>();
    TestRenderer.create(
      React.createElement(HookHarness, { ref, selectedNode: null }),
    );

    await act(async () => {
      await flushPromises();
    });

    act(() => {
      ref.current?.updateFavoritesForPathChange("folder", "renamed");
    });

    expect(
      (window as any).notegitApi.config.updateFavorites,
    ).toHaveBeenCalledWith(["renamed/note.md", "renamed/sub/file.md"]);

    act(() => {
      ref.current?.removeFavoritesUnderPath("renamed/sub");
    });

    expect(
      (window as any).notegitApi.config.updateFavorites,
    ).toHaveBeenCalledWith(["renamed/note.md"]);
  });

  it("removes favorites through the context menu", async () => {
    (window as any).notegitApi.config.getFavorites.mockResolvedValue({
      ok: true,
      data: ["folder/note.md"],
    });

    const ref = React.createRef<HookHandle>();
    TestRenderer.create(
      React.createElement(HookHarness, { ref, selectedNode: null }),
    );

    await act(async () => {
      await flushPromises();
    });

    const preventDefault = jest.fn();
    act(() => {
      ref.current?.handleFavoriteContextMenu(
        {
          preventDefault,
          currentTarget: {} as HTMLElement,
        } as any,
        "folder/note.md",
      );
    });

    act(() => {
      ref.current?.handleRemoveFavorite();
    });

    expect(
      (window as any).notegitApi.config.updateFavorites,
    ).toHaveBeenCalledWith([]);
  });
});
