import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { EditorShell } from "../../../frontend/components/EditorShell";
import type { RepoStatus } from "../../../shared/types";
import { FileType, REPO_PROVIDERS } from "../../../shared/types";
import { SIDEBAR_COLLAPSED_WIDTH } from "../../../frontend/components/EditorShell/constants";

const FileTreeViewMock = jest.fn((_props: any) => null);
const MarkdownEditorMock = jest.fn((_props: any) => null);
const TextEditorMock = jest.fn((_props: any) => null);
const ImageViewerMock = jest.fn((_props: any) => null);
const StatusBarMock = jest.fn((_props: any) => null);
const SettingsDialogMock = jest.fn((_props: any) => null);
const CommitDialogMock = jest.fn((_props: any) => null);
const SearchDialogMock = jest.fn((_props: any) => null);
const RepoSearchDialogMock = jest.fn((_props: any) => null);
const HistoryPanelMock = jest.fn((_props: any) => null);
const HistoryViewerMock = jest.fn((_props: any) => null);
const AboutDialogMock = jest.fn((_props: any) => null);

const renderers: TestRenderer.ReactTestRenderer[] = [];
const createRenderer = (element: React.ReactElement) => {
  const renderer = TestRenderer.create(element);
  renderers.push(renderer);
  return renderer;
};

jest.mock("../../../frontend/components/FileTreeView", () => ({
  FileTreeView: (props: any) => FileTreeViewMock(props),
}));

jest.mock("../../../frontend/components/MarkdownEditor", () => ({
  MarkdownEditor: (props: any) => MarkdownEditorMock(props),
}));

jest.mock("../../../frontend/components/TextEditor", () => ({
  TextEditor: (props: any) => TextEditorMock(props),
}));

jest.mock("../../../frontend/components/ImageViewer", () => ({
  ImageViewer: (props: any) => ImageViewerMock(props),
}));

jest.mock("../../../frontend/components/StatusBar", () => ({
  StatusBar: (props: any) => StatusBarMock(props),
}));

jest.mock("../../../frontend/components/SettingsDialog", () => ({
  SettingsDialog: (props: any) => SettingsDialogMock(props),
}));

jest.mock("../../../frontend/components/CommitDialog", () => ({
  CommitDialog: (props: any) => CommitDialogMock(props),
}));

jest.mock("../../../frontend/components/SearchDialog", () => ({
  SearchDialog: (props: any) => SearchDialogMock(props),
}));

jest.mock("../../../frontend/components/RepoSearchDialog", () => ({
  RepoSearchDialog: (props: any) => RepoSearchDialogMock(props),
}));

jest.mock("../../../frontend/components/HistoryPanel", () => ({
  HistoryPanel: (props: any) => HistoryPanelMock(props),
}));

jest.mock("../../../frontend/components/HistoryViewer", () => ({
  HistoryViewer: (props: any) => HistoryViewerMock(props),
}));

jest.mock("../../../frontend/components/AboutDialog", () => ({
  AboutDialog: (props: any) => AboutDialogMock(props),
}));

jest.mock("../../../frontend/utils/s3AutoSync", () => ({
  startS3AutoSync: jest.fn(() => () => undefined),
}));

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const getStatusBarProps = () =>
  StatusBarMock.mock.calls[StatusBarMock.mock.calls.length - 1]?.[0];
const getSidebarNode = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.find(
    (node) =>
      node.props?.sx &&
      node.props.sx.borderColor === "divider" &&
      typeof node.props.sx.width === "number",
  );

describe("EditorShell", () => {
  beforeEach(() => {
    jest.useRealTimers();
    FileTreeViewMock.mockClear();
    MarkdownEditorMock.mockClear();
    TextEditorMock.mockClear();
    ImageViewerMock.mockClear();
    StatusBarMock.mockClear();
    SettingsDialogMock.mockClear();
    CommitDialogMock.mockClear();
    SearchDialogMock.mockClear();
    RepoSearchDialogMock.mockClear();
    HistoryPanelMock.mockClear();
    HistoryViewerMock.mockClear();
    AboutDialogMock.mockClear();

    const repoStatus: RepoStatus = {
      provider: REPO_PROVIDERS.git,
      branch: "main",
      ahead: 0,
      behind: 0,
      hasUncommitted: false,
      pendingPushCount: 0,
      needsPull: false,
    };

    (global as any).window = {
      notegitApi: {
        menu: {
          onOpenShortcuts: jest.fn(() => jest.fn()),
          onOpenAbout: jest.fn(() => jest.fn()),
        },
        files: {
          listTree: jest.fn().mockResolvedValue({
            ok: true,
            data: [
              {
                id: "note.md",
                name: "note.md",
                path: "note.md",
                type: "file",
                fileType: FileType.MARKDOWN,
              },
            ],
          }),
          read: jest.fn().mockResolvedValue({
            ok: true,
            data: {
              path: "note.md",
              content: "# Note",
              type: FileType.MARKDOWN,
            },
          }),
          save: jest.fn().mockResolvedValue({ ok: true }),
          create: jest.fn(),
          createFolder: jest.fn(),
          delete: jest.fn(),
          rename: jest.fn(),
          duplicate: jest
            .fn()
            .mockResolvedValue({ ok: true, data: "note(1).md" }),
          import: jest.fn(),
          commitAll: jest.fn(),
          commitAndPushAll: jest.fn(),
        },
        repo: {
          getStatus: jest
            .fn()
            .mockResolvedValue({ ok: true, data: repoStatus }),
          fetch: jest.fn().mockResolvedValue({ ok: true, data: repoStatus }),
          pull: jest.fn().mockResolvedValue({ ok: true }),
          push: jest.fn().mockResolvedValue({ ok: true }),
          startAutoPush: jest.fn(),
        },
        config: {
          getFull: jest.fn().mockResolvedValue({
            ok: true,
            data: {
              appSettings: {
                autoSaveEnabled: false,
                autoSaveIntervalSec: 30,
                s3AutoSyncEnabled: true,
                s3AutoSyncIntervalSec: 30,
                theme: "system",
                editorPrefs: {
                  fontSize: 14,
                  lineNumbers: true,
                  tabSize: 2,
                  showPreview: true,
                },
              },
              repoSettings: {
                provider: REPO_PROVIDERS.git,
                remoteUrl: "https://github.com/example/repo.git",
                branch: "main",
                localPath: "/repo",
                pat: "token",
                authMethod: "pat",
              },
              profiles: [
                {
                  id: "profile-1",
                  name: "Work",
                  repoSettings: {
                    provider: REPO_PROVIDERS.git,
                    remoteUrl: "https://github.com/example/repo.git",
                    branch: "main",
                    localPath: "/repo",
                    pat: "token",
                    authMethod: "pat",
                  },
                  createdAt: Date.now(),
                  lastUsedAt: Date.now(),
                },
              ],
              activeProfileId: "profile-1",
            },
          }),
        },
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      confirm: jest.fn(),
    };
    (global as any).document = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
  });

  afterEach(() => {
    while (renderers.length > 0) {
      const renderer = renderers.pop();
      if (renderer) {
        renderer.unmount();
      }
    }
  });

  it("loads workspace data and passes props to child components", async () => {
    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    expect(FileTreeViewMock).toHaveBeenCalled();
    const fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    expect(fileTreeProps?.tree).toHaveLength(1);

    expect(StatusBarMock).toHaveBeenCalled();
    const statusProps = getStatusBarProps();
    expect(statusProps?.status.provider).toBe(REPO_PROVIDERS.git);
    expect(statusProps?.headerTitle).toBe("Work");
  });

  it("creates and deletes files via file tree actions", async () => {
    (global as any).window.notegitApi.files.create = jest
      .fn()
      .mockResolvedValue({ ok: true });
    (global as any).window.notegitApi.files.delete = jest
      .fn()
      .mockResolvedValue({ ok: true });
    (global as any).window.notegitApi.files.read = jest.fn().mockResolvedValue({
      ok: true,
      data: {
        path: "new.md",
        content: "",
        type: FileType.MARKDOWN,
      },
    });
    const listTree = (global as any).window.notegitApi.files
      .listTree as jest.Mock;
    listTree.mockResolvedValueOnce({
      ok: true,
      data: [
        {
          id: "note.md",
          name: "note.md",
          path: "note.md",
          type: "file",
          fileType: FileType.MARKDOWN,
        },
      ],
    });

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, { onThemeChange: jest.fn() }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];

    await act(async () => {
      await fileTreeProps.onCreateFile("", "new.md");
      await fileTreeProps.onDelete("note.md");
      await flushPromises();
    });

    expect((global as any).window.notegitApi.files.create).toHaveBeenCalledWith(
      "",
      "new.md",
    );
    expect((global as any).window.notegitApi.files.delete).toHaveBeenCalledWith(
      "note.md",
    );
  });

  it("duplicates a file and selects the copy", async () => {
    (global as any).window.notegitApi.files.listTree = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        data: [
          {
            id: "note.md",
            name: "note.md",
            path: "note.md",
            type: "file",
            fileType: FileType.MARKDOWN,
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        data: [
          {
            id: "note.md",
            name: "note.md",
            path: "note.md",
            type: "file",
            fileType: FileType.MARKDOWN,
          },
          {
            id: "note(1).md",
            name: "note(1).md",
            path: "note(1).md",
            type: "file",
            fileType: FileType.MARKDOWN,
          },
        ],
      });

    (global as any).window.notegitApi.files.read = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        data: {
          path: "note.md",
          content: "# Note",
          type: FileType.MARKDOWN,
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          path: "note(1).md",
          content: "# Copy",
          type: FileType.MARKDOWN,
        },
      });

    (global as any).window.notegitApi.files.duplicate = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: "note(1).md",
      });

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];

    await act(async () => {
      await fileTreeProps.onSelectFile("note.md", "file");
      await flushPromises();
    });

    await act(async () => {
      await fileTreeProps.onDuplicate("note.md");
      await flushPromises();
    });

    expect(
      (global as any).window.notegitApi.files.duplicate,
    ).toHaveBeenCalledWith("note.md");
    const mdProps =
      MarkdownEditorMock.mock.calls[
        MarkdownEditorMock.mock.calls.length - 1
      ]?.[0];
    expect(mdProps.file?.path).toBe("note(1).md");
  });

  it("commits and pushes on git repos", async () => {
    (global as any).window.notegitApi.files.commitAndPushAll = jest
      .fn()
      .mockResolvedValue({ ok: true });

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, { onThemeChange: jest.fn() }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const statusProps = getStatusBarProps();

    jest.useFakeTimers();
    await act(async () => {
      await statusProps.onCommitAndPush();
    });
    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();

    expect(
      (global as any).window.notegitApi.files.commitAndPushAll,
    ).toHaveBeenCalled();
  });

  it("syncs when repo is s3", async () => {
    const repoStatus: RepoStatus = {
      provider: REPO_PROVIDERS.s3,
      branch: "main",
      ahead: 0,
      behind: 0,
      hasUncommitted: false,
      pendingPushCount: 0,
      needsPull: false,
    };
    (global as any).window.notegitApi.repo.getStatus = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: repoStatus,
      });
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: {
          appSettings: {
            autoSaveEnabled: false,
            autoSaveIntervalSec: 30,
            s3AutoSyncEnabled: true,
            s3AutoSyncIntervalSec: 30,
            theme: "system",
            editorPrefs: {
              fontSize: 14,
              lineNumbers: true,
              tabSize: 2,
              showPreview: true,
            },
          },
          repoSettings: {
            provider: REPO_PROVIDERS.s3,
            bucket: "bucket",
            region: "region",
            prefix: "",
            localPath: "/repo",
            accessKeyId: "key",
            secretAccessKey: "secret",
            sessionToken: "",
          },
          profiles: [
            {
              id: "profile-1",
              name: "Work",
              repoSettings: {
                provider: REPO_PROVIDERS.s3,
                bucket: "bucket",
                region: "region",
                prefix: "",
                localPath: "/repo",
                accessKeyId: "key",
                secretAccessKey: "secret",
                sessionToken: "",
              },
              createdAt: Date.now(),
              lastUsedAt: Date.now(),
            },
          ],
          activeProfileId: "profile-1",
        },
      });
    (global as any).window.notegitApi.repo.push = jest
      .fn()
      .mockResolvedValue({ ok: true });

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, { onThemeChange: jest.fn() }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const statusProps = getStatusBarProps();

    jest.useFakeTimers();
    await act(async () => {
      await statusProps.onCommitAndPush();
    });
    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();

    expect((global as any).window.notegitApi.repo.push).toHaveBeenCalled();
  });

  it("renders a text editor and saves via Save All", async () => {
    const readFile = jest.fn().mockResolvedValue({
      ok: true,
      data: {
        path: "note.txt",
        content: "hello",
        type: FileType.TEXT,
      },
    });
    (global as any).window.notegitApi.files.read = readFile;

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];

    await act(async () => {
      await fileTreeProps.onSelectFile("note.txt", "file");
      await flushPromises();
    });

    const textProps =
      TextEditorMock.mock.calls[TextEditorMock.mock.calls.length - 1]?.[0];
    expect(textProps?.file?.path).toBe("note.txt");

    act(() => {
      textProps.onChange("updated", true);
    });

    const statusProps = getStatusBarProps();
    jest.useFakeTimers();
    await act(async () => {
      await statusProps.onSaveAll();
    });
    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();

    expect((global as any).window.notegitApi.files.save).toHaveBeenCalledWith(
      "note.txt",
      "updated",
    );
  });

  it("renders image viewer for image files", async () => {
    const readFile = jest.fn().mockResolvedValue({
      ok: true,
      data: {
        path: "assets/photo.jpg",
        content: "binary-content",
        type: FileType.IMAGE,
      },
    });
    (global as any).window.notegitApi.files.read = readFile;

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];

    await act(async () => {
      await fileTreeProps.onSelectFile("assets/photo.jpg", "file");
      await flushPromises();
    });

    expect(ImageViewerMock).toHaveBeenCalled();
    const imageProps =
      ImageViewerMock.mock.calls[ImageViewerMock.mock.calls.length - 1]?.[0];
    expect(imageProps?.file?.path).toBe("assets/photo.jpg");
    expect(MarkdownEditorMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        file: expect.objectContaining({ path: "assets/photo.jpg" }),
      }),
    );
  });

  it("tracks navigation history and supports back/forward", async () => {
    const readFile = jest.fn().mockImplementation(async (path: string) => ({
      ok: true,
      data: {
        path,
        content: `content:${path}`,
        type: FileType.MARKDOWN,
      },
    }));
    (global as any).window.notegitApi.files.read = readFile;

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const getFileTreeProps = () =>
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];

    await act(async () => {
      await getFileTreeProps().onSelectFile("a.md", "file");
      await flushPromises();
    });

    await act(async () => {
      await getFileTreeProps().onSelectFile("b.md", "file");
      await flushPromises();
    });

    expect(getFileTreeProps().canNavigateBack).toBe(true);
    expect(getFileTreeProps().canNavigateForward).toBe(false);

    await act(async () => {
      await getFileTreeProps().onNavigateBack();
      await flushPromises();
    });

    expect(readFile).toHaveBeenCalledWith("a.md");
    expect(getFileTreeProps().canNavigateForward).toBe(true);

    await act(async () => {
      await getFileTreeProps().onNavigateForward();
      await flushPromises();
    });

    expect(readFile).toHaveBeenCalledWith("b.md");

    await act(async () => {
      await getFileTreeProps().onNavigateBack();
      await flushPromises();
    });

    await act(async () => {
      await getFileTreeProps().onSelectFile("c.md", "file");
      await flushPromises();
    });

    expect(getFileTreeProps().canNavigateForward).toBe(false);
  });

  it("renames and imports files via file tree actions", async () => {
    (global as any).window.notegitApi.files.rename = jest
      .fn()
      .mockResolvedValue({ ok: true });
    (global as any).window.notegitApi.files.import = jest
      .fn()
      .mockResolvedValue({ ok: true });
    (global as any).window.notegitApi.files.commitAll = jest
      .fn()
      .mockResolvedValue({ ok: true });

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];

    await act(async () => {
      await fileTreeProps.onSelectFile("note.md", "file");
      await flushPromises();
    });

    await act(async () => {
      await fileTreeProps.onRename("note.md", "docs/note.md");
      await fileTreeProps.onImport("/tmp/import.md", "import.md");
    });

    expect((global as any).window.notegitApi.files.rename).toHaveBeenCalledWith(
      "note.md",
      "docs/note.md",
    );
    expect(
      (global as any).window.notegitApi.files.commitAll,
    ).toHaveBeenCalledWith("Move: note.md -> docs/note.md");
    expect((global as any).window.notegitApi.files.import).toHaveBeenCalledWith(
      "/tmp/import.md",
      "import.md",
    );
    expect((global as any).window.notegitApi.files.listTree).toHaveBeenCalled();
    expect((global as any).window.notegitApi.repo.getStatus).toHaveBeenCalled();
  });

  it("handles status bar actions and search selections", async () => {
    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      await fileTreeProps.onSelectFile("note.md", "file");
      await flushPromises();
    });

    const statusProps = getStatusBarProps();
    await act(async () => {
      await statusProps.onFetch();
      await statusProps.onPull();
      await statusProps.onPush();
    });

    expect((global as any).window.notegitApi.repo.fetch).toHaveBeenCalled();
    expect((global as any).window.notegitApi.repo.pull).toHaveBeenCalled();
    expect((global as any).window.notegitApi.repo.push).toHaveBeenCalled();

    act(() => {
      statusProps.onOpenSearch();
    });

    const searchProps =
      SearchDialogMock.mock.calls[SearchDialogMock.mock.calls.length - 1]?.[0];
    expect(searchProps.open).toBe(true);

    await act(async () => {
      await searchProps.onSelectFile("note.md");
      await flushPromises();
    });

    const repoSearchProps =
      RepoSearchDialogMock.mock.calls[
        RepoSearchDialogMock.mock.calls.length - 1
      ]?.[0];
    await act(async () => {
      await repoSearchProps.onSelectMatch("note.md", 3);
      await flushPromises();
    });

    act(() => {
      statusProps.onToggleHistory();
    });

    const historyProps =
      HistoryPanelMock.mock.calls[HistoryPanelMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      historyProps.onViewVersion("hash", "message");
      await flushPromises();
    });

    const viewerProps =
      HistoryViewerMock.mock.calls[
        HistoryViewerMock.mock.calls.length - 1
      ]?.[0];
    expect(viewerProps.open).toBe(true);
    expect(viewerProps.commitHash).toBe("hash");
  });

  it("handles shortcuts/about requests from app menu events", async () => {
    let openShortcutsHandler: (() => void) | undefined;
    let openAboutHandler: (() => void) | undefined;
    (global as any).window.notegitApi.menu.onOpenShortcuts = jest.fn(
      (listener: () => void) => {
        openShortcutsHandler = listener;
        return jest.fn();
      },
    );
    (global as any).window.notegitApi.menu.onOpenAbout = jest.fn(
      (listener: () => void) => {
        openAboutHandler = listener;
        return jest.fn();
      },
    );

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const statusProps = getStatusBarProps();
    const openMenu = jest.fn();
    statusProps.shortcutHelperRef.current = { openMenu };

    if (!openShortcutsHandler || !openAboutHandler) {
      throw new Error("menu handlers not registered");
    }

    act(() => {
      openShortcutsHandler!();
    });
    expect(openMenu).toHaveBeenCalled();

    act(() => {
      openAboutHandler!();
    });

    const aboutProps =
      AboutDialogMock.mock.calls[AboutDialogMock.mock.calls.length - 1]?.[0];
    expect(aboutProps.open).toBe(true);
  });

  it("triggers autosave and beforeunload save", async () => {
    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      await fileTreeProps.onSelectFile("note.md", "file");
      await flushPromises();
    });

    const markdownProps =
      MarkdownEditorMock.mock.calls[
        MarkdownEditorMock.mock.calls.length - 1
      ]?.[0];
    jest.useFakeTimers();
    act(() => {
      markdownProps.onChange("autosave", true);
    });
    act(() => {
      jest.advanceTimersByTime(300000);
    });

    const beforeUnloadHandler = (
      global as any
    ).window.addEventListener.mock.calls.find(
      ([event]: any[]) => event === "beforeunload",
    )?.[1];
    if (!beforeUnloadHandler) {
      throw new Error("beforeunload handler not registered");
    }

    await act(async () => {
      await beforeUnloadHandler({ preventDefault: jest.fn(), returnValue: "" });
    });
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();

    expect((global as any).window.notegitApi.files.save).toHaveBeenCalledWith(
      "note.md",
      "autosave",
    );
  });

  it("starts s3 auto sync and responds to keyboard shortcuts", async () => {
    const s3Status: RepoStatus = {
      provider: REPO_PROVIDERS.s3,
      branch: "main",
      ahead: 0,
      behind: 0,
      hasUncommitted: false,
      pendingPushCount: 0,
      needsPull: false,
    };
    (global as any).window.notegitApi.repo.getStatus = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: s3Status,
      });
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: {
          appSettings: {
            autoSaveEnabled: false,
            autoSaveIntervalSec: 30,
            s3AutoSyncEnabled: true,
            s3AutoSyncIntervalSec: 15,
            theme: "system",
            editorPrefs: {
              fontSize: 14,
              lineNumbers: true,
              tabSize: 2,
              showPreview: true,
            },
          },
          repoSettings: {
            provider: REPO_PROVIDERS.s3,
            bucket: "bucket",
            region: "region",
            prefix: "",
            localPath: "/repo",
            accessKeyId: "key",
            secretAccessKey: "secret",
            sessionToken: "",
          },
          profiles: [],
          activeProfileId: null,
        },
      });

    const s3AutoSync = require("../../../frontend/utils/s3AutoSync");

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    expect(s3AutoSync.startS3AutoSync).toHaveBeenCalled();

    const keydownHandler = (
      global as any
    ).window.addEventListener.mock.calls.find(
      ([event]: any[]) => event === "keydown",
    )?.[1];
    if (!keydownHandler) {
      throw new Error("keydown handler not registered");
    }

    act(() => {
      keydownHandler({
        key: "p",
        ctrlKey: true,
        shiftKey: false,
        metaKey: false,
        preventDefault: jest.fn(),
      });
      keydownHandler({
        key: "f",
        ctrlKey: true,
        shiftKey: true,
        metaKey: false,
        preventDefault: jest.fn(),
      });
    });

    const searchProps =
      SearchDialogMock.mock.calls[SearchDialogMock.mock.calls.length - 1]?.[0];
    const repoSearchProps =
      RepoSearchDialogMock.mock.calls[
        RepoSearchDialogMock.mock.calls.length - 1
      ]?.[0];
    expect(searchProps.open).toBe(true);
    expect(repoSearchProps.open).toBe(true);
  });

  it("handles folder selection and read failures", async () => {
    const readFile = jest.fn().mockResolvedValueOnce({
      ok: false,
      error: { message: "read failed" },
    });
    (global as any).window.notegitApi.files.read = readFile;

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];

    await act(async () => {
      await fileTreeProps.onSelectFile("folder", "folder");
      await fileTreeProps.onSelectFile("note.md", "file");
    });

    expect(readFile).toHaveBeenCalledWith("note.md");
  });

  it("shows save error when save fails", async () => {
    (global as any).window.notegitApi.files.save = jest.fn().mockResolvedValue({
      ok: false,
      error: { message: "save failed" },
    });

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      await fileTreeProps.onSelectFile("note.md", "file");
      await flushPromises();
    });

    const markdownProps =
      MarkdownEditorMock.mock.calls[
        MarkdownEditorMock.mock.calls.length - 1
      ]?.[0];
    await act(async () => {
      await markdownProps.onSave("bad");
      await flushPromises();
    });

    const statusProps = getStatusBarProps();
    expect(statusProps?.saveStatus).toBe("error");
    expect(statusProps?.saveMessage).toContain("save failed");
  });

  it("updates selected path when renaming a folder", async () => {
    (global as any).window.notegitApi.files.rename = jest
      .fn()
      .mockResolvedValue({ ok: true });
    (global as any).window.notegitApi.files.commitAll = jest
      .fn()
      .mockResolvedValue({ ok: true });
    (global as any).window.notegitApi.files.read = jest.fn().mockResolvedValue({
      ok: true,
      data: {
        path: "folder/note.md",
        content: "# Note",
        type: FileType.MARKDOWN,
      },
    });

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    let fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      await fileTreeProps.onSelectFile("folder/note.md", "file");
      await flushPromises();
    });

    fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      await fileTreeProps.onRename("folder", "renamed");
      await flushPromises();
    });

    const fileTreePropsAfter =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    expect(fileTreePropsAfter?.selectedFile).toBe("renamed/note.md");
  });

  it("saves successfully and clears status after delay", async () => {
    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      await fileTreeProps.onSelectFile("note.md", "file");
      await flushPromises();
    });

    const markdownProps =
      MarkdownEditorMock.mock.calls[
        MarkdownEditorMock.mock.calls.length - 1
      ]?.[0];

    jest.useFakeTimers();
    await act(async () => {
      await markdownProps.onSave("saved content");
    });

    let statusProps = getStatusBarProps();
    expect(statusProps?.saveMessage).toContain("Saved locally");

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    statusProps = getStatusBarProps();
    expect(statusProps?.saveStatus).toBe("idle");
    expect(statusProps?.saveMessage).toBe("");
    jest.useRealTimers();
  });

  it("handles commit and push responses for git", async () => {
    (global as any).window.notegitApi.files.commitAndPushAll = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        data: { message: "Nothing to commit" },
      })
      .mockResolvedValueOnce({ ok: false, error: { message: "push failed" } });

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const statusProps = getStatusBarProps();
    jest.useFakeTimers();
    await act(async () => {
      await statusProps.onCommitAndPush();
    });

    expect(
      (global as any).window.notegitApi.files.commitAndPushAll,
    ).toHaveBeenCalledTimes(1);

    act(() => {
      jest.runOnlyPendingTimers();
    });

    await act(async () => {
      await statusProps.onCommitAndPush();
    });

    expect(
      (global as any).window.notegitApi.files.commitAndPushAll,
    ).toHaveBeenCalledTimes(2);
    expect(getStatusBarProps()?.saveMessage).toContain("push failed");

    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("handles s3 sync failures", async () => {
    const repoStatus: RepoStatus = {
      provider: REPO_PROVIDERS.s3,
      branch: "main",
      ahead: 0,
      behind: 0,
      hasUncommitted: false,
      pendingPushCount: 0,
      needsPull: false,
    };
    (global as any).window.notegitApi.repo.getStatus = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: repoStatus,
      });
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: {
          appSettings: {
            autoSaveEnabled: false,
            autoSaveIntervalSec: 30,
            s3AutoSyncEnabled: true,
            s3AutoSyncIntervalSec: 30,
            theme: "system",
            editorPrefs: {
              fontSize: 14,
              lineNumbers: true,
              tabSize: 2,
              showPreview: true,
            },
          },
          repoSettings: {
            provider: REPO_PROVIDERS.s3,
            bucket: "bucket",
            region: "region",
            prefix: "",
            localPath: "/repo",
            accessKeyId: "key",
            secretAccessKey: "secret",
            sessionToken: "",
          },
          profiles: [],
          activeProfileId: null,
        },
      });
    (global as any).window.notegitApi.repo.push = jest.fn().mockResolvedValue({
      ok: false,
      error: { message: "sync failed" },
    });

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const statusProps = getStatusBarProps();
    jest.useFakeTimers();
    await act(async () => {
      await statusProps.onCommitAndPush();
    });

    expect(getStatusBarProps()?.saveMessage).toContain("sync failed");
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("uses cached content when reselecting a file", async () => {
    (global as any).window.notegitApi.files.read = jest.fn().mockResolvedValue({
      ok: true,
      data: {
        path: "note.md",
        content: "# Note",
        type: FileType.MARKDOWN,
      },
    });

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    let fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      await fileTreeProps.onSelectFile("note.md", "file");
      await flushPromises();
    });

    const markdownProps =
      MarkdownEditorMock.mock.calls[
        MarkdownEditorMock.mock.calls.length - 1
      ]?.[0];
    act(() => {
      markdownProps.onChange("cached", true);
    });

    fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      await fileTreeProps.onSelectFile("other.md", "file");
      await flushPromises();
    });

    fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      await fileTreeProps.onSelectFile("note.md", "file");
      await flushPromises();
    });

    const markdownPropsAfter =
      MarkdownEditorMock.mock.calls[
        MarkdownEditorMock.mock.calls.length - 1
      ]?.[0];
    expect(markdownPropsAfter?.file?.content).toBe("cached");
  });

  it("registers resize handlers when dragging the divider", async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const resizeHandle = renderer!.root
      .findAll(
        (node) =>
          typeof node.props.onMouseDown === "function" &&
          node.props.sx &&
          node.props.sx.cursor === "col-resize",
      )
      .find((node) => node.props.onMouseDown);
    if (!resizeHandle) {
      throw new Error("Resize handle not found");
    }

    await act(async () => {
      resizeHandle.props.onMouseDown({
        preventDefault: jest.fn(),
        clientX: 200,
      });
    });

    expect((global as any).document.addEventListener).toHaveBeenCalledWith(
      "mousemove",
      expect.any(Function),
    );
    expect((global as any).document.addEventListener).toHaveBeenCalledWith(
      "mouseup",
      expect.any(Function),
    );
  });

  it("collapses sidebar width and hides resize handle when tree is collapsed", async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    let fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    expect(fileTreeProps?.isCollapsed).toBe(false);

    await act(async () => {
      fileTreeProps.onToggleCollapse();
    });

    fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    expect(fileTreeProps?.isCollapsed).toBe(true);

    const resizeHandlesAfterCollapse = renderer!.root.findAll(
      (node) =>
        typeof node.props.onMouseDown === "function" &&
        node.props.sx &&
        node.props.sx.cursor === "col-resize",
    );
    expect(resizeHandlesAfterCollapse.length).toBe(0);

    const sidebarAfterCollapse = renderer!.root.find(
      (node) => node.props?.sx?.width === SIDEBAR_COLLAPSED_WIDTH,
    );
    expect(sidebarAfterCollapse).toBeDefined();

    await act(async () => {
      fileTreeProps.onToggleCollapse();
    });

    fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    expect(fileTreeProps?.isCollapsed).toBe(false);
  });

  it("hides horizontal overflow on sidebar when tree is collapsed", async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      fileTreeProps.onToggleCollapse();
    });

    const sidebarAfterCollapse = getSidebarNode(renderer!);
    expect(sidebarAfterCollapse.props.sx.overflowX).toBe("hidden");
  });

  it("restores horizontal overflow behavior when tree is expanded again", async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    let fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      fileTreeProps.onToggleCollapse();
    });
    fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      fileTreeProps.onToggleCollapse();
    });

    const sidebarAfterExpand = getSidebarNode(renderer!);
    expect(sidebarAfterExpand.props.sx.overflowX).toBe("auto");
  });

  it("shows tree controls in editor header only when tree is collapsed", async () => {
    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    let markdownProps =
      MarkdownEditorMock.mock.calls[
        MarkdownEditorMock.mock.calls.length - 1
      ]?.[0];
    expect(markdownProps?.treePanelControls).toBeUndefined();

    const fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      fileTreeProps.onToggleCollapse();
    });

    markdownProps =
      MarkdownEditorMock.mock.calls[
        MarkdownEditorMock.mock.calls.length - 1
      ]?.[0];
    expect(markdownProps?.treePanelControls).toBeDefined();
    expect(markdownProps?.treePanelControls?.canNavigateBack).toBe(false);

    await act(async () => {
      markdownProps.treePanelControls.onToggleTree();
    });

    markdownProps =
      MarkdownEditorMock.mock.calls[
        MarkdownEditorMock.mock.calls.length - 1
      ]?.[0];
    expect(markdownProps?.treePanelControls).toBeUndefined();
  });

  it("cleans up s3 auto sync when switching away from s3", async () => {
    const cleanup = jest.fn();
    const s3AutoSync = require("../../../frontend/utils/s3AutoSync");
    s3AutoSync.startS3AutoSync.mockReturnValue(cleanup);

    const s3Status: RepoStatus = {
      provider: REPO_PROVIDERS.s3,
      branch: "main",
      ahead: 0,
      behind: 0,
      hasUncommitted: false,
      pendingPushCount: 0,
      needsPull: false,
    };
    const gitStatus: RepoStatus = {
      provider: REPO_PROVIDERS.git,
      branch: "main",
      ahead: 0,
      behind: 0,
      hasUncommitted: false,
      pendingPushCount: 0,
      needsPull: false,
    };

    (global as any).window.notegitApi.repo.getStatus = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: s3Status,
      });
    (global as any).window.notegitApi.repo.fetch = jest.fn().mockResolvedValue({
      ok: true,
      data: gitStatus,
    });
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: {
          appSettings: {
            autoSaveEnabled: false,
            autoSaveIntervalSec: 30,
            s3AutoSyncEnabled: true,
            s3AutoSyncIntervalSec: 15,
            theme: "system",
            editorPrefs: {
              fontSize: 14,
              lineNumbers: true,
              tabSize: 2,
              showPreview: true,
            },
          },
          repoSettings: {
            provider: REPO_PROVIDERS.s3,
            bucket: "bucket",
            region: "region",
            prefix: "",
            localPath: "/repo",
            accessKeyId: "key",
            secretAccessKey: "secret",
            sessionToken: "",
          },
          profiles: [],
          activeProfileId: null,
        },
      });

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    expect(s3AutoSync.startS3AutoSync).toHaveBeenCalled();

    const statusProps = getStatusBarProps();
    await act(async () => {
      await statusProps.onFetch();
      await flushPromises();
    });

    expect(cleanup).toHaveBeenCalled();
  });

  it("logs load errors when workspace initialization fails", async () => {
    (global as any).window.notegitApi.files.listTree = jest
      .fn()
      .mockRejectedValue(new Error("boom"));

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const statusProps = getStatusBarProps();
    expect(statusProps?.saveStatus).toBe("error");
    expect(statusProps?.saveMessage).toContain("Failed to load workspace");
  });

  it("logs read errors when file loading throws", async () => {
    (global as any).window.notegitApi.files.read = jest
      .fn()
      .mockRejectedValue(new Error("read error"));

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      await fileTreeProps.onSelectFile("note.md", "file");
    });

    const statusProps = getStatusBarProps();
    expect(statusProps?.saveStatus).toBe("error");
    expect(statusProps?.saveMessage).toContain("Failed to read file");
  });

  it("throws when rename responses fail", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (global as any).window.notegitApi.files.rename = jest
      .fn()
      .mockResolvedValue({
        ok: false,
        error: { message: "rename failed" },
      });

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      await expect(fileTreeProps.onRename("note.md", "new.md")).rejects.toThrow(
        "rename failed",
      );
    });

    consoleSpy.mockRestore();
  });

  it("throws when import responses fail", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (global as any).window.notegitApi.files.import = jest
      .fn()
      .mockResolvedValue({
        ok: false,
        error: { message: "import failed" },
      });

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      await expect(
        fileTreeProps.onImport("/tmp/source.md", "target.md"),
      ).rejects.toThrow("import failed");
    });

    consoleSpy.mockRestore();
  });

  it("shows sync error when push throws", async () => {
    const repoStatus: RepoStatus = {
      provider: REPO_PROVIDERS.s3,
      branch: "main",
      ahead: 0,
      behind: 0,
      hasUncommitted: false,
      pendingPushCount: 0,
      needsPull: false,
    };
    (global as any).window.notegitApi.repo.getStatus = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: repoStatus,
      });
    (global as any).window.notegitApi.config.getFull = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        data: {
          appSettings: {
            autoSaveEnabled: false,
            autoSaveIntervalSec: 30,
            s3AutoSyncEnabled: true,
            s3AutoSyncIntervalSec: 30,
            theme: "system",
            editorPrefs: {
              fontSize: 14,
              lineNumbers: true,
              tabSize: 2,
              showPreview: true,
            },
          },
          repoSettings: {
            provider: REPO_PROVIDERS.s3,
            bucket: "bucket",
            region: "region",
            prefix: "",
            localPath: "/repo",
            accessKeyId: "key",
            secretAccessKey: "secret",
            sessionToken: "",
          },
          profiles: [],
          activeProfileId: null,
        },
      });
    (global as any).window.notegitApi.repo.push = jest
      .fn()
      .mockRejectedValue(new Error("sync boom"));

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const statusProps = getStatusBarProps();
    jest.useFakeTimers();
    await act(async () => {
      await statusProps.onCommitAndPush();
    });

    expect(getStatusBarProps()?.saveMessage).toContain("sync boom");
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("shows save error when save throws", async () => {
    (global as any).window.notegitApi.files.save = jest
      .fn()
      .mockRejectedValue(new Error("save blew up"));

    await act(async () => {
      createRenderer(
        React.createElement(EditorShell, {
          onThemeChange: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
      await flushPromises();
    });

    const fileTreeProps =
      FileTreeViewMock.mock.calls[FileTreeViewMock.mock.calls.length - 1]?.[0];
    await act(async () => {
      await fileTreeProps.onSelectFile("note.md", "file");
      await flushPromises();
    });

    const markdownProps =
      MarkdownEditorMock.mock.calls[
        MarkdownEditorMock.mock.calls.length - 1
      ]?.[0];
    await act(async () => {
      await markdownProps.onSave("bad save");
      await flushPromises();
    });

    const statusProps = getStatusBarProps();
    expect(statusProps?.saveStatus).toBe("error");
    expect(statusProps?.saveMessage).toContain("save blew up");
  });
});
