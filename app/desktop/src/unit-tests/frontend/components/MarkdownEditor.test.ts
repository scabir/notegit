import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { renderToString } from "react-dom/server";
import {
  Tooltip,
  IconButton,
  MenuItem,
  ToggleButtonGroup,
} from "@mui/material";
import { MarkdownEditor } from "../../../frontend/components/MarkdownEditor";
import {
  MARKDOWN_EDITOR_TEXT,
  MARKDOWN_INSERT_DEFAULTS,
  MARKDOWN_INSERT_TOKENS,
} from "../../../frontend/components/MarkdownEditor/constants";
import type { FileContent } from "../../../shared/types";
import { FileType } from "../../../shared/types";

let mockView: any;
let lastCodeMirrorProps: any;

jest.mock("@codemirror/view", () => ({
  __esModule: true,
  EditorView: { lineWrapping: {} },
  keymap: {
    of: (bindings: any) => bindings,
  },
}));

jest.mock("@uiw/react-codemirror", () => {
  const React = require("react");
  return React.forwardRef((props: any, ref: any) => {
    lastCodeMirrorProps = props;
    if (ref) {
      ref.current = { view: mockView };
    }
    return React.createElement("div", { "data-testid": "codemirror" });
  });
});

jest.mock("@mui/material/Menu", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", null, children),
  };
});

jest.mock("react-markdown", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ components, children }: any) => {
      const imgNode = components?.img
        ? components.img({ src: "image.png", alt: "preview" })
        : null;
      const linkNode = components?.a
        ? components.a({ href: "linked/target.md", children: ["linked"] })
        : null;
      const codeNode = components?.code
        ? components.code({
            inline: false,
            className: "language-mermaid",
            children: ["graph TD;A-->B"],
          })
        : null;
      return React.createElement(
        "div",
        null,
        children,
        imgNode,
        linkNode,
        codeNode,
      );
    },
  };
});

jest.mock("../../../frontend/components/MermaidDiagram", () => {
  const React = require("react");
  return {
    MermaidDiagram: (props: any) =>
      React.createElement("div", { "data-testid": "mermaid", ...props }),
  };
});

const createDoc = (content: string) => ({
  length: content.length,
  sliceString: (from: number, to: number) => content.slice(from, to),
  toString: () => content,
  lineAt: (pos: number) => {
    const start = content.lastIndexOf("\n", pos - 1) + 1;
    const endIndex = content.indexOf("\n", pos);
    const end = endIndex === -1 ? content.length : endIndex;
    return { from: start, to: end, text: content.slice(start, end) };
  },
});

const createMockView = (content: string, from: number, to: number) => ({
  state: {
    selection: { main: { from, to } },
    doc: createDoc(content),
  },
  dispatch: jest.fn(),
  focus: jest.fn(),
});

const renderEditor = async (
  content: string,
  from: number,
  to: number,
  overrides: Record<string, any> = {},
) => {
  mockView = createMockView(content, from, to);
  const componentOverrides = { ...overrides };
  const filePath =
    typeof componentOverrides.filePath === "string"
      ? componentOverrides.filePath
      : "note.md";
  delete componentOverrides.filePath;
  const file: FileContent = {
    path: filePath,
    content,
    type: FileType.MARKDOWN,
  };
  const onSave = jest.fn();
  const onChange = jest.fn();

  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      React.createElement(MarkdownEditor, {
        file,
        repoPath: "/repo",
        onSave,
        onChange,
        ...componentOverrides,
      }),
    );
    await Promise.resolve();
  });

  return { renderer: renderer!, onSave, onChange };
};

const getToolbarButton = (
  renderer: TestRenderer.ReactTestRenderer,
  title: string,
) => {
  const tooltip = renderer.root
    .findAllByType(Tooltip)
    .find((item) => item.props.title === title);

  if (!tooltip) {
    throw new Error(`Tooltip not found: ${title}`);
  }

  return tooltip.findByType(IconButton);
};

const fireWindowKeydown = (
  handlers: Record<string, any[]>,
  event: {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    preventDefault?: jest.Mock;
    target?: any;
  },
) => {
  (handlers.keydown || []).forEach((handler) => {
    act(() => {
      handler({
        key: event.key,
        ctrlKey: event.ctrlKey ?? false,
        metaKey: event.metaKey ?? false,
        shiftKey: event.shiftKey ?? false,
        preventDefault: event.preventDefault || jest.fn(),
        target: event.target || null,
      });
    });
  });
};

describe("MarkdownEditor task list formatting", () => {
  beforeEach(() => {
    (global as any).window = {
      notegitApi: {
        config: {
          getAppSettings: jest.fn().mockResolvedValue({
            ok: true,
            data: { editorPrefs: { lineNumbers: true } },
          }),
        },
        export: {
          note: jest.fn(),
        },
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
  });

  it("creates a task per selected line", async () => {
    const { renderer } = await renderEditor("one\ntwo", 0, 7);
    const button = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.taskListLabel,
    );

    act(() => {
      button.props.onClick();
    });

    expect(mockView.dispatch).toHaveBeenCalledTimes(1);
    const insert = mockView.dispatch.mock.calls[0][0].changes.insert;
    expect(insert).toBe("- [ ] one\n- [ ] two");
  });

  it("removes unchecked task prefixes when all selected lines are tasks", async () => {
    const { renderer } = await renderEditor("- [ ] one\n- [ ] two", 0, 19);
    const button = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.taskListLabel,
    );

    act(() => {
      button.props.onClick();
    });

    expect(mockView.dispatch).toHaveBeenCalledTimes(1);
    const insert = mockView.dispatch.mock.calls[0][0].changes.insert;
    expect(insert).toBe("one\ntwo");
  });

  it("does nothing when any selected task is done", async () => {
    const { renderer } = await renderEditor("- [x] one\n- [ ] two", 0, 19);
    const button = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.taskListLabel,
    );

    act(() => {
      button.props.onClick();
    });

    expect(mockView.dispatch).not.toHaveBeenCalled();
  });

  it("inserts a single task when no text is selected", async () => {
    const { renderer } = await renderEditor("", 0, 0);
    const button = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.taskListLabel,
    );

    act(() => {
      button.props.onClick();
    });

    expect(mockView.dispatch).toHaveBeenCalledTimes(1);
    const insert = mockView.dispatch.mock.calls[0][0].changes.insert;
    expect(insert).toBe(`- [ ] ${MARKDOWN_INSERT_DEFAULTS.taskList}`);
  });

  it("inserts a table template", async () => {
    const { renderer } = await renderEditor("", 0, 0);
    const button = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.tableTooltip,
    );

    act(() => {
      button.props.onClick();
    });

    expect(mockView.dispatch).toHaveBeenCalledTimes(1);
    const insert = mockView.dispatch.mock.calls[0][0].changes.insert;
    expect(insert).toBe(
      `${MARKDOWN_INSERT_TOKENS.table[0]}${MARKDOWN_INSERT_TOKENS.table[1]}`,
    );
  });

  it("renders tree panel controls when provided and wires callbacks", async () => {
    const onToggleTree = jest.fn();
    const onNavigateBack = jest.fn();
    const onNavigateForward = jest.fn();
    const { renderer } = await renderEditor("", 0, 0, {
      treePanelControls: {
        onToggleTree,
        onNavigateBack,
        onNavigateForward,
        canNavigateBack: true,
        canNavigateForward: false,
      },
    });

    const showTreeButton = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.showTreeTooltip,
    );
    const backButton = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.backTooltip,
    );
    const forwardButton = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.forwardTooltip,
    );

    act(() => {
      showTreeButton.props.onClick();
      backButton.props.onClick();
    });

    expect(forwardButton.props.disabled).toBe(true);
    expect(onToggleTree).toHaveBeenCalledTimes(1);
    expect(onNavigateBack).toHaveBeenCalledTimes(1);
    expect(onNavigateForward).not.toHaveBeenCalled();
  });

  it("inserts a mermaid block from the extras menu", async () => {
    const { renderer } = await renderEditor("", 0, 0);
    const extrasButton = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.extrasTooltip,
    );

    act(() => {
      extrasButton.props.onClick({ currentTarget: {} });
    });

    const mermaidItem = renderer.root
      .findAllByType(MenuItem)
      .find(
        (item) => item.props.children === MARKDOWN_EDITOR_TEXT.mermaidLabel,
      );

    if (!mermaidItem) {
      throw new Error("Mermaid menu item not found");
    }

    act(() => {
      mermaidItem.props.onClick();
    });

    expect(mockView.dispatch).toHaveBeenCalledTimes(1);
    const insert = mockView.dispatch.mock.calls[0][0].changes.insert;
    expect(insert).toBe(
      `\n\`\`\`mermaid\n${MARKDOWN_INSERT_DEFAULTS.mermaid}\n\`\`\`\n`,
    );
  });

  it("shows the mermaid cheatsheet and allows closing it", async () => {
    const { renderer } = await renderEditor("content", 0, 0);
    const cheatsheetButton = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.cheatsheetTooltip,
    );

    act(() => {
      cheatsheetButton.props.onClick({ currentTarget: {} });
    });

    const mermaidSheetItem = renderer.root
      .findAllByType(MenuItem)
      .find(
        (item) =>
          item.props.children === MARKDOWN_EDITOR_TEXT.mermaidCheatsheetLabel,
      );

    if (!mermaidSheetItem) {
      throw new Error("Mermaid cheatsheet menu item not found");
    }

    act(() => {
      mermaidSheetItem.props.onClick();
    });

    const cheatSheetContent = renderer.root.findAll((node) => {
      return node.props && node.props.dangerouslySetInnerHTML;
    });
    expect(cheatSheetContent.length).toBeGreaterThan(0);

    const closeButtonTooltip = renderer.root
      .findAllByType(Tooltip)
      .find(
        (item) =>
          item.props.title === MARKDOWN_EDITOR_TEXT.closeCheatsheetLabel,
      );

    if (!closeButtonTooltip) {
      throw new Error("Close cheat sheet tooltip not found");
    }

    act(() => {
      closeButtonTooltip.findByType(IconButton).props.onClick();
    });

    const closeTooltips = renderer.root
      .findAllByType(Tooltip)
      .filter(
        (item) =>
          item.props.title === MARKDOWN_EDITOR_TEXT.closeCheatsheetLabel,
      );
    expect(closeTooltips).toHaveLength(0);
  });

  it("renders empty state when no file is provided", () => {
    const html = renderToString(
      React.createElement(MarkdownEditor, {
        file: null,
        repoPath: "/repo",
        onSave: jest.fn(),
        onChange: jest.fn(),
      }),
    );

    expect(html).toContain(MARKDOWN_EDITOR_TEXT.emptyState);
  });

  it("saves via toolbar and keyboard shortcut", async () => {
    const handlers: Record<string, any[]> = {};
    (global as any).window.addEventListener = jest.fn(
      (event: string, handler: any) => {
        handlers[event] = handlers[event] || [];
        handlers[event].push(handler);
      },
    );
    (global as any).window.removeEventListener = jest.fn();

    const { renderer, onSave, onChange } = await renderEditor("hello", 0, 0);

    act(() => {
      lastCodeMirrorProps.onChange("hello world");
    });

    expect(onChange).toHaveBeenCalledWith("hello world", true);

    const saveButton = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.saveTooltip,
    );
    expect(saveButton.props.disabled).toBe(false);

    const preventDefault = jest.fn();
    fireWindowKeydown(handlers, {
      key: "s",
      ctrlKey: true,
      metaKey: false,
      preventDefault,
    });
    expect(preventDefault).toHaveBeenCalled();

    act(() => {
      saveButton.props.onClick();
    });

    expect(onSave).toHaveBeenCalledWith("hello world");
  });

  it("exports and handles export errors", async () => {
    const alertMock = jest.fn();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    (global as any).alert = alertMock;
    (global as any).window.alert = alertMock;

    (global as any).window.notegitApi.export.note = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, data: "/tmp/note.md" })
      .mockResolvedValueOnce({ ok: false, error: { message: "Boom" } });

    const { renderer } = await renderEditor("content", 0, 0);
    const exportButton = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.exportTooltip,
    );

    await act(async () => {
      await exportButton.props.onClick();
    });

    await act(async () => {
      await exportButton.props.onClick();
    });

    expect(alertMock).toHaveBeenCalledWith("Failed to export: Boom");
    errorSpy.mockRestore();
  });

  it("shows alert when export throws", async () => {
    const alertMock = jest.fn();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    (global as any).alert = alertMock;
    (global as any).window.alert = alertMock;
    (global as any).window.notegitApi.export.note = jest
      .fn()
      .mockRejectedValue(new Error("export boom"));

    const { renderer } = await renderEditor("content", 0, 0);
    const exportButton = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.exportTooltip,
    );

    await act(async () => {
      await exportButton.props.onClick();
    });

    expect(alertMock).toHaveBeenCalledWith("Failed to export note");
    errorSpy.mockRestore();
  });

  it("opens find bar and navigates/updates matches", async () => {
    const handlers: Record<string, any[]> = {};
    (global as any).window.addEventListener = jest.fn(
      (event: string, handler: any) => {
        handlers[event] = handlers[event] || [];
        handlers[event].push(handler);
      },
    );
    (global as any).window.removeEventListener = jest.fn();

    jest.useFakeTimers();
    const { renderer, onChange } = await renderEditor("hello hello", 0, 5);

    const preventDefault = jest.fn();
    fireWindowKeydown(handlers, {
      key: "f",
      ctrlKey: true,
      metaKey: false,
      preventDefault,
    });
    expect(preventDefault).toHaveBeenCalled();

    act(() => {
      jest.runAllTimers();
    });

    const findBar = renderer.root.findByType(
      require("../../../frontend/components/FindReplaceBar").FindReplaceBar,
    );
    await act(async () => {
      findBar.props.onFindNext("hello");
      findBar.props.onFindPrevious("hello");
    });

    await act(async () => {
      findBar.props.onReplace("hello", "hi");
      jest.runAllTimers();
    });

    expect(onChange).toHaveBeenCalledWith("hello hi", true);

    await act(async () => {
      findBar.props.onReplaceAll("hello", "hey");
    });

    expect(onChange).toHaveBeenCalledWith("hey hi", true);
    jest.useRealTimers();
  });

  it("inserts footnotes, highlights, and raw markdown", async () => {
    const { renderer } = await renderEditor("alpha", 0, 0);

    const footnoteButton = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.footnoteLabel,
    );
    act(() => {
      footnoteButton.props.onClick();
    });

    const highlightButton = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.highlightLabel,
    );
    act(() => {
      highlightButton.props.onClick();
    });

    const definitionButton = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.definitionListLabel,
    );
    act(() => {
      definitionButton.props.onClick();
    });

    const extrasButton = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.extrasTooltip,
    );
    act(() => {
      extrasButton.props.onClick({ currentTarget: {} });
    });

    const rawItem = renderer.root
      .findAllByType(MenuItem)
      .find(
        (item) => item.props.children === MARKDOWN_EDITOR_TEXT.rawMarkdownLabel,
      );
    if (!rawItem) {
      throw new Error("Raw markdown menu item not found");
    }

    act(() => {
      rawItem.props.onClick();
    });

    expect(mockView.dispatch).toHaveBeenCalled();
  });

  describe("keyboard shortcuts", () => {
    it("applies bold formatting with Ctrl+B", async () => {
      const handlers: Record<string, any[]> = {};
      (global as any).window.addEventListener = jest.fn(
        (event: string, handler: any) => {
          handlers[event] = handlers[event] || [];
          handlers[event].push(handler);
        },
      );
      (global as any).window.removeEventListener = jest.fn();

      await renderEditor("note", 0, 0);
      mockView.dispatch.mockClear();

      const preventDefault = jest.fn();
      fireWindowKeydown(handlers, { key: "b", ctrlKey: true, preventDefault });

      expect(mockView.dispatch).toHaveBeenCalledTimes(1);
      const boldCall = mockView.dispatch.mock.calls[0][0];
      expect(boldCall.changes.insert).toBe(
        `${MARKDOWN_INSERT_TOKENS.bold[0]}${MARKDOWN_INSERT_DEFAULTS.bold}${MARKDOWN_INSERT_TOKENS.bold[1]}`,
      );
      expect(preventDefault).toHaveBeenCalled();
    });

    it("adds highlight markup with Ctrl+Shift+H", async () => {
      const handlers: Record<string, any[]> = {};
      (global as any).window.addEventListener = jest.fn(
        (event: string, handler: any) => {
          handlers[event] = handlers[event] || [];
          handlers[event].push(handler);
        },
      );
      (global as any).window.removeEventListener = jest.fn();

      await renderEditor("note", 0, 0);
      mockView.dispatch.mockClear();

      const preventDefault = jest.fn();
      fireWindowKeydown(handlers, {
        key: "h",
        ctrlKey: true,
        shiftKey: true,
        preventDefault,
      });

      expect(mockView.dispatch).toHaveBeenCalledTimes(1);
      const highlightCall = mockView.dispatch.mock.calls[0][0];
      expect(highlightCall.changes.insert).toBe(
        `${MARKDOWN_INSERT_TOKENS.highlight[0]}${MARKDOWN_INSERT_DEFAULTS.highlight}${MARKDOWN_INSERT_TOKENS.highlight[1]}`,
      );
      expect(preventDefault).toHaveBeenCalled();
    });

    it("inserts a mermaid block with Ctrl+Shift+M", async () => {
      const handlers: Record<string, any[]> = {};
      (global as any).window.addEventListener = jest.fn(
        (event: string, handler: any) => {
          handlers[event] = handlers[event] || [];
          handlers[event].push(handler);
        },
      );
      (global as any).window.removeEventListener = jest.fn();

      await renderEditor("diagram", 0, 0);
      mockView.dispatch.mockClear();

      const preventDefault = jest.fn();
      fireWindowKeydown(handlers, {
        key: "m",
        ctrlKey: true,
        shiftKey: true,
        preventDefault,
      });

      expect(mockView.dispatch).toHaveBeenCalledTimes(1);
      const mermaidCall = mockView.dispatch.mock.calls[0][0];
      expect(mermaidCall.changes.insert).toBe(
        `${MARKDOWN_INSERT_TOKENS.mermaid[0]}${MARKDOWN_INSERT_DEFAULTS.mermaid}${MARKDOWN_INSERT_TOKENS.mermaid[1]}`,
      );
      expect(preventDefault).toHaveBeenCalled();
    });
  });

  it("renders preview content with mermaid and image adjustments", async () => {
    const { renderer } = await renderEditor(
      "![alt](image.png)\n\n```mermaid\ngraph TD\n```",
      0,
      0,
    );

    const previewToggle = renderer.root.findAllByType(ToggleButtonGroup)[0];
    act(() => {
      previewToggle.props.onChange(null, "preview");
    });

    const images = renderer.root.findAllByType("img");
    expect(images[0].props.src).toBe("file:///repo/image.png");

    const mermaid = renderer.root.findAllByProps({ "data-testid": "mermaid" });
    expect(mermaid.length).toBeGreaterThan(0);
  });

  it("opens internal markdown links via onOpenLinkedFile callback", async () => {
    const onOpenLinkedFile = jest.fn();
    const { renderer } = await renderEditor("content", 0, 0, {
      filePath: "notes/note.md",
      onOpenLinkedFile,
    });

    const previewToggle = renderer.root.findAllByType(ToggleButtonGroup)[0];
    act(() => {
      previewToggle.props.onChange(null, "preview");
    });

    const link = renderer.root.findByType("a");
    const preventDefault = jest.fn();
    act(() => {
      link.props.onClick({ preventDefault });
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(onOpenLinkedFile).toHaveBeenCalledWith("notes/linked/target.md");
  });

  it("resolves preview images relative to the markdown file directory", async () => {
    const { renderer } = await renderEditor("![alt](image.png)", 0, 0, {
      filePath: "notes/note.md",
    });

    const previewToggle = renderer.root.findAllByType(ToggleButtonGroup)[0];
    act(() => {
      previewToggle.props.onChange(null, "preview");
    });

    const images = renderer.root.findAllByType("img");
    expect(images[0].props.src).toBe("file:///repo/notes/image.png");
  });

  it("opens markdown cheatsheet and closes it", async () => {
    const { renderer } = await renderEditor("content", 0, 0);

    const cheatsheetButton = getToolbarButton(
      renderer,
      MARKDOWN_EDITOR_TEXT.cheatsheetTooltip,
    );
    act(() => {
      cheatsheetButton.props.onClick({ currentTarget: {} });
    });

    const markdownSheetItem = renderer.root
      .findAllByType(MenuItem)
      .find(
        (item) =>
          item.props.children === MARKDOWN_EDITOR_TEXT.markdownCheatsheetLabel,
      );
    if (!markdownSheetItem) {
      throw new Error("Markdown cheatsheet menu item not found");
    }

    act(() => {
      markdownSheetItem.props.onClick();
    });

    const closeButtonTooltip = renderer.root
      .findAllByType(Tooltip)
      .find(
        (item) =>
          item.props.title === MARKDOWN_EDITOR_TEXT.closeCheatsheetLabel,
      );
    if (!closeButtonTooltip) {
      throw new Error("Close cheat sheet tooltip not found");
    }

    act(() => {
      closeButtonTooltip.findByType(IconButton).props.onClick();
    });

    expect(
      renderer.root
        .findAllByType(Tooltip)
        .some(
          (item) =>
            item.props.title === MARKDOWN_EDITOR_TEXT.closeCheatsheetLabel,
        ),
    ).toBe(false);
  });

  it("handles splitter drag in split view", async () => {
    const docHandlers: Record<string, any> = {};
    (global as any).document = {
      addEventListener: jest.fn((event: string, handler: any) => {
        docHandlers[event] = handler;
      }),
      removeEventListener: jest.fn(),
      getElementById: jest.fn(() => ({
        getBoundingClientRect: () => ({ left: 0, width: 200 }),
      })),
    };

    const { renderer } = await renderEditor("content", 0, 0);
    const splitToggle = renderer.root.findAllByType(ToggleButtonGroup)[0];
    act(() => {
      splitToggle.props.onChange(null, "split");
    });

    const splitter = renderer.root.findAll(
      (node) =>
        node.props.onMouseDown && node.props.sx?.cursor === "col-resize",
    )[0];
    act(() => {
      splitter.props.onMouseDown({ preventDefault: jest.fn(), clientX: 100 });
    });

    act(() => {
      if (docHandlers.mousemove) {
        docHandlers.mousemove({ clientX: 120 });
      }
      if (docHandlers.mouseup) {
        docHandlers.mouseup();
      }
    });

    expect((global as any).document.addEventListener).toHaveBeenCalled();
  });
});
