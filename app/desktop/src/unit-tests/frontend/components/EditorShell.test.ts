import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Button } from "@mui/material";
import { EditorShell } from "../../../frontend/components/EditorShell";
import {
  COMMIT_AND_PUSH_RESULTS,
  FileType,
  REPO_PROVIDERS,
} from "../../../shared/types";

jest.mock("../../../frontend/i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key.split(".").pop() || key,
  }),
}));

jest.mock("../../../frontend/utils/s3AutoSync", () => ({
  startS3AutoSync: jest.fn(() => jest.fn()),
}));

jest.mock("../../../frontend/components/FileTreeView", () => ({
  FileTreeView: (props: any) =>
    React.createElement(
      React.Fragment,
      null,
      React.createElement(
        Button,
        { onClick: () => props.onSelectFile("notes/text.txt", "file") },
        "SelectText",
      ),
      React.createElement(
        Button,
        { onClick: () => props.onSelectFile("notes/image.png", "file") },
        "SelectImage",
      ),
      React.createElement(
        Button,
        { onClick: () => props.onSelectFile("notes/doc.md", "file") },
        "SelectMarkdown",
      ),
      React.createElement(
        Button,
        { onClick: () => props.onDuplicate("notes/doc.md") },
        "Duplicate",
      ),
      React.createElement(
        Button,
        { onClick: () => props.onCreateFile("notes", "new.md") },
        "CreateFile",
      ),
      React.createElement(
        Button,
        { onClick: () => props.onCreateFolder("notes", "folder") },
        "CreateFolder",
      ),
      React.createElement(
        Button,
        { onClick: () => props.onDelete("notes/doc.md") },
        "Delete",
      ),
      React.createElement(
        Button,
        { onClick: () => props.onRename("notes/doc.md", "notes/renamed.md") },
        "Rename",
      ),
      React.createElement(
        Button,
        {
          onClick: () => props.onImport("/tmp/file.txt", "notes/imported.txt"),
        },
        "Import",
      ),
      React.createElement(
        Button,
        { onClick: () => props.onNavigateBack() },
        "Back",
      ),
      React.createElement(
        Button,
        { onClick: () => props.onNavigateForward() },
        "Forward",
      ),
      React.createElement(
        Button,
        { onClick: () => props.onToggleCollapse() },
        "ToggleTree",
      ),
    ),
}));

jest.mock("../../../frontend/components/TextEditor", () => ({
  TextEditor: ({ file, treePanelControls }: any) =>
    React.createElement(
      "div",
      {
        "data-testid": "text-editor",
        "data-collapsed": Boolean(treePanelControls),
      },
      file?.content || "text-editor",
    ),
}));

jest.mock("../../../frontend/components/ImageViewer", () => ({
  ImageViewer: () =>
    React.createElement(
      "div",
      { "data-testid": "image-viewer" },
      "image-viewer",
    ),
}));

jest.mock("../../../frontend/components/MarkdownEditor", () => ({
  MarkdownEditor: ({
    file,
    onChange,
    onOpenLinkedFile,
    treePanelControls,
  }: any) =>
    React.createElement(
      React.Fragment,
      null,
      React.createElement(
        "div",
        {
          "data-testid": "markdown-editor",
          "data-collapsed": Boolean(treePanelControls),
        },
        file?.content || "markdown-editor",
      ),
      React.createElement(
        Button,
        { onClick: () => onChange("updated content", true) },
        "MarkdownChange",
      ),
      React.createElement(
        Button,
        { onClick: () => onOpenLinkedFile("linked.md") },
        "OpenLinked",
      ),
    ),
}));

jest.mock("../../../frontend/components/StatusBar", () => ({
  StatusBar: (props: any) => {
    latestShortcutMenuOpen = jest.fn();
    props.shortcutHelperRef.current = {
      openMenu: latestShortcutMenuOpen,
    };

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        "div",
        { "data-testid": "header-title" },
        props.headerTitle,
      ),
      React.createElement(
        "div",
        { "data-testid": "save-message" },
        props.saveMessage,
      ),
      React.createElement(Button, { onClick: props.onFetch }, "Fetch"),
      React.createElement(Button, { onClick: props.onPush }, "Push"),
      React.createElement(Button, { onClick: props.onPull }, "Pull"),
      React.createElement(
        Button,
        { onClick: props.onCommitAndPush },
        "CommitAndPush",
      ),
      React.createElement(
        Button,
        { onClick: props.onOpenSearch },
        "OpenSearch",
      ),
      React.createElement(
        Button,
        { onClick: props.onToggleHistory },
        "ToggleHistory",
      ),
      React.createElement(
        Button,
        { onClick: props.onOpenSettings },
        "OpenSettings",
      ),
      React.createElement(Button, { onClick: props.onSaveAll }, "SaveAll"),
    );
  },
}));

jest.mock("../../../frontend/components/SettingsDialog", () => ({
  SettingsDialog: ({ open, onClose }: any) =>
    open
      ? React.createElement(
          React.Fragment,
          null,
          React.createElement("div", null, "settings-open"),
          React.createElement(Button, { onClick: onClose }, "CloseSettings"),
        )
      : null,
}));

jest.mock("../../../frontend/components/CommitDialog", () => ({
  CommitDialog: ({ onSuccess }: any) =>
    React.createElement(Button, { onClick: onSuccess }, "CommitSuccess"),
}));

jest.mock("../../../frontend/components/SearchDialog", () => ({
  SearchDialog: ({ open, onSelectFile, onClose }: any) =>
    open
      ? React.createElement(
          React.Fragment,
          null,
          React.createElement(
            Button,
            { onClick: () => onSelectFile("notes/doc.md") },
            "SearchSelect",
          ),
          React.createElement(Button, { onClick: onClose }, "CloseSearch"),
        )
      : null,
}));

jest.mock("../../../frontend/components/RepoSearchDialog", () => ({
  RepoSearchDialog: ({ open, onSelectMatch, onClose }: any) =>
    open
      ? React.createElement(
          React.Fragment,
          null,
          React.createElement(
            Button,
            { onClick: () => onSelectMatch("notes/doc.md", 2) },
            "RepoSearchSelect",
          ),
          React.createElement(Button, { onClick: onClose }, "CloseRepoSearch"),
        )
      : null,
}));

jest.mock("../../../frontend/components/HistoryPanel", () => ({
  HistoryPanel: ({ onClose, onViewVersion }: any) =>
    React.createElement(
      React.Fragment,
      null,
      React.createElement(
        Button,
        { onClick: () => onViewVersion("commit-1", "Commit message") },
        "ViewVersion",
      ),
      React.createElement(Button, { onClick: onClose }, "CloseHistory"),
    ),
}));

jest.mock("../../../frontend/components/HistoryViewer", () => ({
  HistoryViewer: ({ open, commitHash, commitMessage, onClose }: any) =>
    open
      ? React.createElement(
          React.Fragment,
          null,
          React.createElement(
            "div",
            { "data-testid": "history-viewer" },
            `${commitHash}:${commitMessage}`,
          ),
          React.createElement(
            Button,
            { onClick: onClose },
            "CloseHistoryViewer",
          ),
        )
      : null,
}));

jest.mock("../../../frontend/components/AboutDialog", () => ({
  AboutDialog: ({ open, onClose }: any) =>
    open
      ? React.createElement(
          React.Fragment,
          null,
          React.createElement("div", null, "about-open"),
          React.createElement(Button, { onClick: onClose }, "CloseAbout"),
        )
      : null,
}));

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const findButton = (
  renderer: TestRenderer.ReactTestRenderer,
  label: string,
) => {
  const button = renderer.root.findAllByType(Button).find((node) => {
    const children = node.props.children;
    if (typeof children === "string") {
      return children === label;
    }
    if (Array.isArray(children)) {
      return children.includes(label);
    }
    return false;
  });

  if (!button) {
    throw new Error(`Button not found: ${label}`);
  }

  return button;
};

const flattenText = (node: any): string => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(flattenText).join("");
  return node.children ? node.children.map(flattenText).join("") : "";
};

const renderers: TestRenderer.ReactTestRenderer[] = [];

const createRenderer = (element: React.ReactElement) => {
  const renderer = TestRenderer.create(element);
  renderers.push(renderer);
  return renderer;
};

const renderEditorShell = async () => {
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = createRenderer(
      React.createElement(EditorShell, {
        onThemeChange: jest.fn(),
      }),
    );
    await flushPromises();
  });
  await act(async () => {
    await flushPromises();
  });
  await act(async () => {
    await flushPromises();
  });
  return renderer!;
};

const baseConfig = {
  appSettings: {
    autoSaveEnabled: false,
    autoSaveIntervalSec: 30,
    s3AutoSyncEnabled: true,
    s3AutoSyncIntervalSec: 30,
    theme: "system",
    language: "en-GB",
    editorPrefs: {
      fontSize: 14,
      lineNumbers: true,
      tabSize: 2,
      showPreview: true,
    },
  },
  repoSettings: {
    provider: REPO_PROVIDERS.git,
    localPath: "/repo",
  },
  profiles: [],
  activeProfileId: null,
};

let latestOpenShortcutsHandler: (() => void) | null = null;
let latestOpenAboutHandler: (() => void) | null = null;
let latestShortcutMenuOpen: jest.Mock | null = null;

const buildFileResponse = (type: FileType, path: string) => ({
  ok: true,
  data: {
    path,
    content: `${path} content`,
    type,
    size: 10,
    lastModified: new Date("2024-01-01T00:00:00Z"),
  },
});

describe("EditorShell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    const listeners = new Map<string, Set<(event: any) => void>>();
    (global as any).window.addEventListener = jest.fn(
      (type: string, handler: (event: any) => void) => {
        const handlers = listeners.get(type) || new Set();
        handlers.add(handler);
        listeners.set(type, handlers);
      },
    );
    (global as any).window.removeEventListener = jest.fn(
      (type: string, handler: (event: any) => void) => {
        listeners.get(type)?.delete(handler);
      },
    );
    (global as any).window.dispatchEvent = jest.fn((event: any) => {
      listeners.get(event.type)?.forEach((handler) => handler(event));
      return true;
    });
    (global as any).window.notegitApi = {
      files: {
        listTree: jest.fn().mockResolvedValue({
          ok: true,
          data: [
            {
              id: "notes/doc.md",
              name: "doc.md",
              path: "notes/doc.md",
              type: "file",
            },
          ],
        }),
        read: jest.fn().mockImplementation(async (filePath: string) => {
          if (filePath.endsWith(".txt")) {
            return buildFileResponse(FileType.TEXT, filePath);
          }
          if (filePath.endsWith(".png")) {
            return buildFileResponse(FileType.IMAGE, filePath);
          }
          return buildFileResponse(FileType.MARKDOWN, filePath);
        }),
        save: jest.fn().mockResolvedValue({ ok: true }),
        create: jest.fn().mockResolvedValue({ ok: true }),
        createFolder: jest.fn().mockResolvedValue({ ok: true }),
        delete: jest.fn().mockResolvedValue({ ok: true }),
        rename: jest.fn().mockResolvedValue({ ok: true }),
        import: jest.fn().mockResolvedValue({ ok: true }),
        duplicate: jest
          .fn()
          .mockResolvedValue({ ok: true, data: "notes/doc-copy.md" }),
        commitAll: jest.fn().mockResolvedValue({ ok: true }),
        commitAndPushAll: jest
          .fn()
          .mockResolvedValue({ ok: true, data: { result: "COMMITTED" } }),
      },
      repo: {
        getStatus: jest.fn().mockResolvedValue({
          ok: true,
          data: {
            provider: REPO_PROVIDERS.git,
            branch: "main",
            ahead: 0,
            behind: 0,
            hasUncommitted: false,
            pendingPushCount: 0,
            needsPull: false,
          },
        }),
        fetch: jest.fn().mockResolvedValue({
          ok: true,
          data: {
            provider: REPO_PROVIDERS.git,
            branch: "main",
            ahead: 0,
            behind: 0,
            hasUncommitted: false,
            pendingPushCount: 0,
            needsPull: false,
          },
        }),
        push: jest.fn().mockResolvedValue({ ok: true }),
        pull: jest.fn().mockResolvedValue({ ok: true }),
        startAutoPush: jest.fn(),
      },
      config: {
        getFull: jest.fn().mockResolvedValue({ ok: true, data: baseConfig }),
      },
      menu: {
        onOpenShortcuts: jest.fn((handler: () => void) => {
          latestOpenShortcutsHandler = handler;
          return jest.fn();
        }),
        onOpenAbout: jest.fn((handler: () => void) => {
          latestOpenAboutHandler = handler;
          return jest.fn();
        }),
      },
    };
  });

  afterEach(async () => {
    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
      while (renderers.length > 0) {
        renderers.pop()?.unmount();
      }
      await Promise.resolve();
    });
    jest.useRealTimers();
  });

  it("loads the workspace and opens different file viewers", async () => {
    const renderer = await renderEditorShell();

    await act(async () => {
      findButton(renderer!, "SelectText").props.onClick();
      await flushPromises();
    });
    expect(
      renderer!.root.findByProps({ "data-testid": "text-editor" }).children,
    ).toContain("notes/text.txt content");

    await act(async () => {
      findButton(renderer!, "SelectImage").props.onClick();
      await flushPromises();
    });
    expect(
      renderer!.root.findByProps({ "data-testid": "image-viewer" }).children,
    ).toContain("image-viewer");

    await act(async () => {
      findButton(renderer!, "SelectMarkdown").props.onClick();
      await flushPromises();
    });
    expect(
      renderer!.root.findByProps({ "data-testid": "markdown-editor" }).children,
    ).toContain("notes/doc.md content");
  });

  it("shows a transient error when workspace loading fails", async () => {
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockRejectedValue(new Error("load failed"));

    const renderer = await renderEditorShell();

    expect(
      renderer!.root.findByProps({ "data-testid": "save-message" }).children,
    ).toContain("failedLoadWorkspace");
  });

  it("opens files from the search dialog and linked file handler", async () => {
    const renderer = await renderEditorShell();

    await act(async () => {
      findButton(renderer!, "OpenSearch").props.onClick();
      await flushPromises();
    });
    await act(async () => {
      findButton(renderer!, "SearchSelect").props.onClick();
      await flushPromises();
    });

    await act(async () => {
      findButton(renderer!, "OpenLinked").props.onClick();
      await flushPromises();
    });

    expect((global as any).window.notegitApi.files.read).toHaveBeenCalledWith(
      "notes/doc.md",
    );
    expect((global as any).window.notegitApi.files.read).toHaveBeenCalledWith(
      "linked.md",
    );
  });

  it("shows fetch success and duplicate errors in the status message", async () => {
    (global as any).window.notegitApi.files.duplicate = jest
      .fn()
      .mockRejectedValue(new Error("duplicate failed"));

    const renderer = await renderEditorShell();

    await act(async () => {
      findButton(renderer!, "Fetch").props.onClick();
      await flushPromises();
    });
    expect(
      renderer!.root.findByProps({ "data-testid": "save-message" }).children,
    ).toContain("fetchSuccessful");

    await act(async () => {
      try {
        await findButton(renderer!, "Duplicate").props.onClick();
      } catch {
        // EditorShell surfaces the error in the transient status and rethrows.
      }
      await flushPromises();
    });
    expect(
      renderer!.root.findByProps({ "data-testid": "save-message" }).children,
    ).toContain("duplicate failed");
  });

  it("skips commit and push for local repositories", async () => {
    (global as any).window.notegitApi.repo.getStatus = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: {
          provider: REPO_PROVIDERS.local,
          branch: "local",
          ahead: 0,
          behind: 0,
          hasUncommitted: false,
          pendingPushCount: 0,
          needsPull: false,
        },
      });
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: {
          ...baseConfig,
          repoSettings: {
            provider: REPO_PROVIDERS.local,
            localPath: "/repo",
          },
        },
      });

    const renderer = await renderEditorShell();

    await act(async () => {
      findButton(renderer!, "CommitAndPush").props.onClick();
      await flushPromises();
    });

    expect(
      (global as any).window.notegitApi.files.commitAndPushAll,
    ).not.toHaveBeenCalled();
  });

  it("collapses the tree and exposes tree controls to the active editor", async () => {
    const renderer = await renderEditorShell();

    await act(async () => {
      findButton(renderer!, "SelectMarkdown").props.onClick();
      await flushPromises();
    });
    await act(async () => {
      findButton(renderer!, "ToggleTree").props.onClick();
      await flushPromises();
    });

    expect(
      renderer!.root.findByProps({ "data-testid": "markdown-editor" }).props[
        "data-collapsed"
      ],
    ).toBe(true);
  });

  it("creates, deletes, renames, and imports files through the tree actions", async () => {
    const renderer = await renderEditorShell();

    await act(async () => {
      await findButton(renderer!, "CreateFile").props.onClick();
      await findButton(renderer!, "CreateFolder").props.onClick();
      await findButton(renderer!, "Import").props.onClick();
      await flushPromises();
    });

    await act(async () => {
      findButton(renderer!, "SelectMarkdown").props.onClick();
      await flushPromises();
    });
    await act(async () => {
      await findButton(renderer!, "Rename").props.onClick();
      await findButton(renderer!, "Delete").props.onClick();
      await flushPromises();
    });

    expect((global as any).window.notegitApi.files.create).toHaveBeenCalledWith(
      "notes",
      "new.md",
    );
    expect(
      (global as any).window.notegitApi.files.createFolder,
    ).toHaveBeenCalledWith("notes", "folder");
    expect((global as any).window.notegitApi.files.import).toHaveBeenCalledWith(
      "/tmp/file.txt",
      "notes/imported.txt",
    );
    expect((global as any).window.notegitApi.files.rename).toHaveBeenCalledWith(
      "notes/doc.md",
      "notes/renamed.md",
    );
    expect((global as any).window.notegitApi.files.delete).toHaveBeenCalledWith(
      "notes/doc.md",
    );
  });

  it("saves unsaved content and commits it through the status bar actions", async () => {
    const renderer = await renderEditorShell();

    await act(async () => {
      findButton(renderer!, "SelectMarkdown").props.onClick();
      await flushPromises();
    });
    act(() => {
      findButton(renderer!, "MarkdownChange").props.onClick();
    });

    await act(async () => {
      await findButton(renderer!, "SaveAll").props.onClick();
      await flushPromises();
    });
    expect((global as any).window.notegitApi.files.save).toHaveBeenCalledWith(
      "notes/doc.md",
      "updated content",
    );

    await act(async () => {
      await findButton(renderer!, "CommitAndPush").props.onClick();
      await flushPromises();
    });
    expect(
      (global as any).window.notegitApi.files.commitAndPushAll,
    ).toHaveBeenCalled();
  });

  it("handles pull and push failures and opens auxiliary panels", async () => {
    (global as any).window.notegitApi.repo.pull = jest.fn().mockResolvedValue({
      ok: false,
      error: { message: "pull failed" },
    });
    (global as any).window.notegitApi.repo.push = jest.fn().mockResolvedValue({
      ok: false,
      error: { message: "push failed" },
    });

    const renderer = await renderEditorShell();

    await act(async () => {
      findButton(renderer!, "OpenSettings").props.onClick();
      findButton(renderer!, "ToggleHistory").props.onClick();
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain("settings-open");
    expect(flattenText(renderer!.toJSON())).toContain("CloseHistory");

    await act(async () => {
      await findButton(renderer!, "Pull").props.onClick();
      await flushPromises();
    });
    expect(
      renderer!.root.findByProps({ "data-testid": "save-message" }).children,
    ).toContain("pull failed");

    await act(async () => {
      await findButton(renderer!, "Push").props.onClick();
      await flushPromises();
    });
    expect(
      renderer!.root.findByProps({ "data-testid": "save-message" }).children,
    ).toContain("push failed");
  });

  it("supports autosave, beforeunload saves, and cached content when reopening a file", async () => {
    const renderer = await renderEditorShell();

    await act(async () => {
      findButton(renderer!, "SelectMarkdown").props.onClick();
      await flushPromises();
    });

    act(() => {
      findButton(renderer!, "MarkdownChange").props.onClick();
    });

    await act(async () => {
      jest.advanceTimersByTime(300000);
      await flushPromises();
    });
    expect((global as any).window.notegitApi.files.save).toHaveBeenCalledWith(
      "notes/doc.md",
      "updated content",
    );

    await act(async () => {
      window.dispatchEvent({
        type: "beforeunload",
        preventDefault: jest.fn(),
        returnValue: "",
      } as any);
      await flushPromises();
    });

    await act(async () => {
      findButton(renderer!, "SelectText").props.onClick();
      await flushPromises();
    });
    await act(async () => {
      findButton(renderer!, "SelectMarkdown").props.onClick();
      await flushPromises();
    });

    expect(
      renderer!.root.findByProps({ "data-testid": "markdown-editor" }).children,
    ).toContain("updated content");
  });

  it("handles git commit-and-push edge cases", async () => {
    (global as any).window.notegitApi.files.commitAndPushAll = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        data: { result: COMMIT_AND_PUSH_RESULTS.NOTHING_TO_COMMIT },
      })
      .mockResolvedValueOnce({
        ok: false,
        error: { message: "commit push failed" },
      });

    const renderer = await renderEditorShell();

    await act(async () => {
      await findButton(renderer!, "CommitAndPush").props.onClick();
      await flushPromises();
    });
    expect(
      renderer!.root.findByProps({ "data-testid": "save-message" }).children,
    ).toContain("nothingToCommit");

    await act(async () => {
      await findButton(renderer!, "CommitAndPush").props.onClick();
      await flushPromises();
    });
    expect(
      renderer!.root.findByProps({ "data-testid": "save-message" }).children,
    ).toContain("commit push failed");
  });

  it("handles S3 sync flows, cleanup, and history/about interactions", async () => {
    (global as any).window.notegitApi.repo.getStatus = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: {
          provider: REPO_PROVIDERS.s3,
          branch: "bucket",
          ahead: 1,
          behind: 0,
          hasUncommitted: true,
          pendingPushCount: 1,
          needsPull: false,
        },
      });
    (global as any).window.notegitApi.repo.fetch = jest.fn().mockResolvedValue({
      ok: true,
      data: {
        provider: REPO_PROVIDERS.git,
        branch: "main",
        ahead: 0,
        behind: 0,
        hasUncommitted: false,
        pendingPushCount: 0,
        needsPull: false,
      },
    });
    (global as any).window.notegitApi.repo.push = jest.fn().mockResolvedValue({
      ok: true,
    });
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: {
          ...baseConfig,
          repoSettings: {
            provider: REPO_PROVIDERS.s3,
            localPath: "/repo",
          },
        },
      });

    const renderer = await renderEditorShell();

    await act(async () => {
      findButton(renderer!, "SelectMarkdown").props.onClick();
      await flushPromises();
    });

    await act(async () => {
      await findButton(renderer!, "Fetch").props.onClick();
      await flushPromises();
    });

    await act(async () => {
      await findButton(renderer!, "CommitAndPush").props.onClick();
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain("syncedSuccessfully");

    await act(async () => {
      findButton(renderer!, "ToggleHistory").props.onClick();
      await flushPromises();
    });
    act(() => {
      findButton(renderer!, "ViewVersion").props.onClick();
    });
    expect(
      renderer!.root.findByProps({ "data-testid": "history-viewer" }).children,
    ).toContain("commit-1:Commit message");

    act(() => {
      latestOpenAboutHandler?.();
    });
    expect(flattenText(renderer!.toJSON())).toContain("about-open");
  });

  it("opens search dialogs via keyboard shortcuts", async () => {
    const renderer = await renderEditorShell();

    await act(async () => {
      window.dispatchEvent({
        type: "keydown",
        ctrlKey: true,
        key: "p",
        preventDefault: jest.fn(),
      } as any);
      window.dispatchEvent({
        type: "keydown",
        ctrlKey: true,
        shiftKey: true,
        key: "f",
        preventDefault: jest.fn(),
      } as any);
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain("SearchSelect");
    expect(flattenText(renderer!.toJSON())).toContain("RepoSearchSelect");
  });

  it("shows the active profile name and opens the shortcut menu from F1 and menu events", async () => {
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: {
          ...baseConfig,
          profiles: [
            {
              id: "profile-1",
              name: "Work",
              repoSettings: baseConfig.repoSettings,
            },
          ],
          activeProfileId: "profile-1",
        },
      });

    const renderer = await renderEditorShell();

    expect(
      renderer.root.findByProps({ "data-testid": "header-title" }).children,
    ).toContain("Work");

    await act(async () => {
      window.dispatchEvent({
        type: "keydown",
        key: "F1",
        preventDefault: jest.fn(),
      } as any);
      await flushPromises();
    });
    act(() => {
      latestOpenShortcutsHandler?.();
    });

    expect(latestShortcutMenuOpen).toHaveBeenCalledTimes(2);
  });

  it("surfaces save failures from failed responses and thrown errors", async () => {
    (global as any).window.notegitApi.files.save = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        error: { message: "save failed" },
      })
      .mockRejectedValueOnce(new Error("save crashed"));

    const renderer = await renderEditorShell();
    await act(async () => {
      findButton(renderer, "SelectMarkdown").props.onClick();
      await flushPromises();
    });
    act(() => {
      findButton(renderer, "MarkdownChange").props.onClick();
    });

    await act(async () => {
      await findButton(renderer, "SaveAll").props.onClick();
      await flushPromises();
    });
    expect(
      renderer.root.findByProps({ "data-testid": "save-message" }).children,
    ).toContain("save failed");

    act(() => {
      findButton(renderer, "MarkdownChange").props.onClick();
    });
    await act(async () => {
      await findButton(renderer, "SaveAll").props.onClick();
      await flushPromises();
    });
    expect(
      renderer.root.findByProps({ "data-testid": "save-message" }).children,
    ).toContain("save crashed");
  });

  it("reloads the selected file after a successful pull", async () => {
    const renderer = await renderEditorShell();
    await act(async () => {
      findButton(renderer, "SelectMarkdown").props.onClick();
      await flushPromises();
    });

    await act(async () => {
      await findButton(renderer, "Pull").props.onClick();
      await flushPromises();
    });

    expect(
      renderer.root.findByProps({ "data-testid": "save-message" }).children,
    ).toContain("pullSuccessful");
    expect((global as any).window.notegitApi.files.read).toHaveBeenCalledWith(
      "notes/doc.md",
    );
  });

  it("navigates backward and forward through file history", async () => {
    const renderer = await renderEditorShell();

    await act(async () => {
      findButton(renderer, "SelectMarkdown").props.onClick();
      await flushPromises();
    });
    await act(async () => {
      findButton(renderer, "SelectText").props.onClick();
      await flushPromises();
    });
    await act(async () => {
      findButton(renderer, "Back").props.onClick();
      await flushPromises();
    });
    expect(
      renderer.root.findByProps({ "data-testid": "markdown-editor" }).children,
    ).toContain("notes/doc.md content");

    await act(async () => {
      findButton(renderer, "Forward").props.onClick();
      await flushPromises();
    });
    expect(
      renderer.root.findByProps({ "data-testid": "text-editor" }).children,
    ).toContain("notes/text.txt content");
  });

  it("handles commit callbacks and dialog close handlers", async () => {
    const renderer = await renderEditorShell();

    await act(async () => {
      findButton(renderer, "CommitSuccess").props.onClick();
      findButton(renderer, "OpenSettings").props.onClick();
      findButton(renderer, "OpenSearch").props.onClick();
      await flushPromises();
    });
    await act(async () => {
      findButton(renderer, "CloseSettings").props.onClick();
      findButton(renderer, "CloseSearch").props.onClick();
      await flushPromises();
    });

    await act(async () => {
      window.dispatchEvent({
        type: "keydown",
        ctrlKey: true,
        shiftKey: true,
        key: "f",
        preventDefault: jest.fn(),
      } as any);
      await flushPromises();
    });
    await act(async () => {
      findButton(renderer, "CloseRepoSearch").props.onClick();
      await flushPromises();
    });

    expect((global as any).window.notegitApi.repo.getStatus).toHaveBeenCalled();
    expect(flattenText(renderer.toJSON())).not.toContain("settings-open");
    expect(flattenText(renderer.toJSON())).not.toContain("SearchSelect");
    expect(flattenText(renderer.toJSON())).not.toContain("RepoSearchSelect");
  });

  it("handles S3 fetch and push branches and closes history/about viewers", async () => {
    const s3AutoSyncModule = jest.requireMock(
      "../../../frontend/utils/s3AutoSync",
    ) as { startS3AutoSync: jest.Mock };
    s3AutoSyncModule.startS3AutoSync.mockClear();

    (global as any).window.notegitApi.repo.getStatus = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: {
          provider: REPO_PROVIDERS.s3,
          branch: "bucket",
          ahead: 1,
          behind: 0,
          hasUncommitted: true,
          pendingPushCount: 1,
          needsPull: false,
        },
      });
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: {
          ...baseConfig,
          repoSettings: {
            provider: REPO_PROVIDERS.s3,
            localPath: "/repo",
          },
        },
      });
    (global as any).window.notegitApi.repo.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("fetch crashed"))
      .mockResolvedValueOnce({
        ok: true,
        data: {
          provider: REPO_PROVIDERS.s3,
          branch: "bucket",
          ahead: 0,
          behind: 0,
          hasUncommitted: false,
          pendingPushCount: 0,
          needsPull: false,
        },
      });
    (global as any).window.notegitApi.repo.push = jest
      .fn()
      .mockRejectedValueOnce(new Error("push crashed"))
      .mockResolvedValueOnce({ ok: true });

    const renderer = await renderEditorShell();
    await act(async () => {
      findButton(renderer, "SelectMarkdown").props.onClick();
      await flushPromises();
    });

    await act(async () => {
      await findButton(renderer, "Fetch").props.onClick();
      await flushPromises();
    });
    expect(
      renderer.root.findByProps({ "data-testid": "save-message" }).children,
    ).toContain("failedFetch");

    await act(async () => {
      await findButton(renderer, "Fetch").props.onClick();
      await flushPromises();
    });

    await act(async () => {
      await findButton(renderer, "Push").props.onClick();
      await flushPromises();
    });
    expect(
      renderer.root.findByProps({ "data-testid": "save-message" }).children,
    ).toContain("failedPush");

    await act(async () => {
      await findButton(renderer, "Push").props.onClick();
      await flushPromises();
    });

    await act(async () => {
      findButton(renderer, "ToggleHistory").props.onClick();
      await flushPromises();
    });
    act(() => {
      findButton(renderer, "ViewVersion").props.onClick();
      latestOpenAboutHandler?.();
    });
    await act(async () => {
      findButton(renderer, "CloseHistoryViewer").props.onClick();
      findButton(renderer, "CloseAbout").props.onClick();
      findButton(renderer, "CloseHistory").props.onClick();
      await flushPromises();
    });

    expect(s3AutoSyncModule.startS3AutoSync).toHaveBeenCalled();
    expect(flattenText(renderer.toJSON())).not.toContain("history-viewer");
    expect(flattenText(renderer.toJSON())).not.toContain("about-open");
  });
});
