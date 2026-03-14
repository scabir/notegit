import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Button } from "@mui/material";
import App from "../../frontend/App";
import { REPO_PROVIDERS } from "../../shared/types";

jest.mock("@mui/material", () => {
  const React = require("react");
  const actual = jest.requireActual("@mui/material");
  return {
    ...actual,
    useMediaQuery: jest.fn(() => false),
    ThemeProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    CssBaseline: () => null,
  };
});

jest.mock("../../frontend/components/RepoSetupDialog", () => ({
  RepoSetupDialog: ({
    open,
    onSuccess,
  }: {
    open: boolean;
    onSuccess: () => void;
  }) =>
    React.createElement(
      "div",
      { "data-testid": "repo-setup-dialog", "data-open": String(open) },
      React.createElement(
        "button",
        {
          type: "button",
          onClick: onSuccess,
        },
        "repo-setup-success",
      ),
    ),
}));

jest.mock("../../frontend/components/EditorShell", () => ({
  EditorShell: ({
    onThemeChange,
  }: {
    onThemeChange: (theme: "light" | "dark" | "system") => void;
  }) =>
    React.createElement(
      "button",
      {
        type: "button",
        "data-testid": "editor-shell",
        onClick: () => onThemeChange("dark"),
      },
      "editor-shell",
    ),
}));

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const flattenText = (node: any): string => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(flattenText).join("");
  return node.children ? node.children.map(flattenText).join("") : "";
};

describe("App", () => {
  beforeEach(() => {
    (global as any).window = {
      NoteBranchApi: {
        config: {
          checkGitInstalled: jest.fn(),
          getFull: jest.fn(),
          updateAppSettings: jest.fn(),
        },
      },
    };
  });

  it("shows git missing message when git is not installed and repo is git", async () => {
    (
      global as any
    ).window.NoteBranchApi.config.checkGitInstalled.mockResolvedValue({
      ok: true,
      data: false,
    });
    (global as any).window.NoteBranchApi.config.getFull.mockResolvedValue({
      ok: true,
      data: {
        repoSettings: {
          provider: REPO_PROVIDERS.git,
          remoteUrl: "https://github.com/example/repo.git",
          branch: "main",
          localPath: "/repo",
          pat: "token",
          authMethod: "pat",
        },
        appSettings: { theme: "system" },
      },
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(App));
    });

    await act(async () => {
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain("Git is not installed");
  });

  it("shows repo setup when no repository is connected", async () => {
    (
      global as any
    ).window.NoteBranchApi.config.checkGitInstalled.mockResolvedValue({
      ok: true,
      data: false,
    });
    (global as any).window.NoteBranchApi.config.getFull.mockResolvedValue({
      ok: true,
      data: { repoSettings: null, appSettings: { theme: "system" } },
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(App));
    });

    await act(async () => {
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain("Connect to Repository");
  });

  it("opens repo setup dialog when connect button is clicked", async () => {
    (
      global as any
    ).window.NoteBranchApi.config.checkGitInstalled.mockResolvedValue({
      ok: true,
      data: true,
    });
    (global as any).window.NoteBranchApi.config.getFull.mockResolvedValue({
      ok: true,
      data: { repoSettings: null, appSettings: { theme: "system" } },
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(App));
    });

    await act(async () => {
      await flushPromises();
    });

    const connectButton = renderer!.root.findAllByType(Button)[0];
    const setupDialog = renderer!.root.findByProps({
      "data-testid": "repo-setup-dialog",
    });

    expect(setupDialog.props["data-open"]).toBe("false");

    act(() => {
      connectButton.props.onClick();
    });

    expect(setupDialog.props["data-open"]).toBe("true");
  });

  it("renders editor shell when local repo is configured without git", async () => {
    (
      global as any
    ).window.NoteBranchApi.config.checkGitInstalled.mockResolvedValue({
      ok: true,
      data: false,
    });
    (global as any).window.NoteBranchApi.config.getFull.mockResolvedValue({
      ok: true,
      data: {
        repoSettings: {
          provider: REPO_PROVIDERS.local,
          localPath: "/repo",
        },
        appSettings: { theme: "system" },
      },
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(App));
    });

    await act(async () => {
      await flushPromises();
    });

    const editorShell = renderer!.root.findByProps({
      "data-testid": "editor-shell",
    });
    expect(editorShell).toBeTruthy();
  });

  it("renders editor shell when a repo is configured", async () => {
    (
      global as any
    ).window.NoteBranchApi.config.checkGitInstalled.mockResolvedValue({
      ok: true,
      data: true,
    });
    (global as any).window.NoteBranchApi.config.getFull.mockResolvedValue({
      ok: true,
      data: {
        repoSettings: {
          provider: REPO_PROVIDERS.git,
          remoteUrl: "https://github.com/example/repo.git",
          branch: "main",
          localPath: "/repo",
          pat: "token",
          authMethod: "pat",
        },
        appSettings: { theme: "system" },
      },
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(App));
    });

    await act(async () => {
      await flushPromises();
    });

    const editorShell = renderer!.root.findByProps({
      "data-testid": "editor-shell",
    });
    expect(editorShell).toBeTruthy();
  });

  it("updates theme preference when editor shell requests a theme change", async () => {
    (
      global as any
    ).window.NoteBranchApi.config.checkGitInstalled.mockResolvedValue({
      ok: true,
      data: true,
    });
    (global as any).window.NoteBranchApi.config.getFull.mockResolvedValue({
      ok: true,
      data: {
        repoSettings: {
          provider: REPO_PROVIDERS.git,
          remoteUrl: "https://github.com/example/repo.git",
          branch: "main",
          localPath: "/repo",
          pat: "token",
          authMethod: "pat",
        },
        appSettings: { theme: "system" },
      },
    });

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(App));
    });

    await act(async () => {
      await flushPromises();
    });

    const editorShell = renderer!.root.findByProps({
      "data-testid": "editor-shell",
    });

    await act(async () => {
      editorShell.props.onClick();
      await flushPromises();
    });

    expect(
      (global as any).window.NoteBranchApi.config.updateAppSettings,
    ).toHaveBeenCalledWith({ theme: "dark" });
  });

  it("logs initialization failures without crashing", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    (
      global as any
    ).window.NoteBranchApi.config.checkGitInstalled.mockRejectedValue(
      new Error("init failed"),
    );
    (global as any).window.NoteBranchApi.config.getFull.mockResolvedValue({
      ok: true,
      data: {
        repoSettings: {
          provider: REPO_PROVIDERS.git,
          remoteUrl: "https://github.com/example/repo.git",
          branch: "main",
          localPath: "/repo",
          pat: "token",
          authMethod: "pat",
        },
        appSettings: { theme: "system" },
      },
    });

    await act(async () => {
      TestRenderer.create(React.createElement(App));
    });

    await act(async () => {
      await flushPromises();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to initialize:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it("logs theme persistence failures without crashing", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    (
      global as any
    ).window.NoteBranchApi.config.checkGitInstalled.mockResolvedValue({
      ok: true,
      data: true,
    });
    (global as any).window.NoteBranchApi.config.getFull.mockResolvedValue({
      ok: true,
      data: {
        repoSettings: {
          provider: REPO_PROVIDERS.git,
          remoteUrl: "https://github.com/example/repo.git",
          branch: "main",
          localPath: "/repo",
          pat: "token",
          authMethod: "pat",
        },
        appSettings: { theme: "system" },
      },
    });
    (
      global as any
    ).window.NoteBranchApi.config.updateAppSettings.mockRejectedValue(
      new Error("theme failed"),
    );

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(App));
      await flushPromises();
    });

    const editorShell = renderer!.root.findByProps({
      "data-testid": "editor-shell",
    });
    await act(async () => {
      editorShell.props.onClick();
      await flushPromises();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to save theme preference:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});
