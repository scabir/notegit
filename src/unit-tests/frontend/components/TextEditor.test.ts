import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { renderToString } from "react-dom/server";
import { Tooltip, IconButton } from "@mui/material";
import { TextEditor } from "../../../frontend/components/TextEditor";
import { FindReplaceBar } from "../../../frontend/components/FindReplaceBar";
import { TEXT_EDITOR_TEXT } from "../../../frontend/components/TextEditor/constants";
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
    return React.createElement("div", {
      "data-testid": "codemirror",
      ...props,
    });
  });
});

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

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

const createDoc = (content: string) => ({
  length: content.length,
  sliceString: (from: number, to: number) => content.slice(from, to),
  toString: () => content,
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
  file: FileContent,
  overrides: Record<string, any> = {},
) => {
  mockView = createMockView(file.content, 0, 0);
  const onSave = jest.fn();
  const onChange = jest.fn();
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      React.createElement(TextEditor, {
        file,
        onSave,
        onChange,
        ...overrides,
      }),
    );
  });

  await act(async () => {
    await flushPromises();
  });

  return { renderer: renderer!, onSave, onChange };
};

describe("TextEditor", () => {
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

  it("renders empty state when no file is selected", () => {
    const html = renderToString(
      React.createElement(TextEditor, {
        file: null,
        onSave: jest.fn(),
        onChange: jest.fn(),
      }),
    );

    expect(html).toContain(TEXT_EDITOR_TEXT.emptyState);
  });

  it("enables save button when content changes", async () => {
    const file: FileContent = {
      path: "note.txt",
      content: "hello",
      type: FileType.TEXT,
    };
    const { renderer, onSave, onChange } = await renderEditor(file);

    const saveButton = getToolbarButton(
      renderer!,
      TEXT_EDITOR_TEXT.saveTooltip,
    );
    expect(saveButton.props.disabled).toBe(true);

    const editorNode = renderer!.root.findByProps({
      "data-testid": "codemirror",
    });
    act(() => {
      editorNode.props.onChange("hello world");
    });

    expect(onChange).toHaveBeenCalledWith("hello world", true);

    const updatedSaveButton = getToolbarButton(
      renderer!,
      TEXT_EDITOR_TEXT.saveTooltip,
    );
    expect(updatedSaveButton.props.disabled).toBe(false);

    act(() => {
      updatedSaveButton.props.onClick();
    });

    expect(onSave).toHaveBeenCalledWith("hello world");
  });

  it("opens the find bar on Ctrl+F", async () => {
    const handlers: Record<string, any> = {};
    (global as any).window.addEventListener = jest.fn(
      (event: string, handler: any) => {
        handlers[event] = handler;
      },
    );

    const file: FileContent = {
      path: "note.txt",
      content: "hello",
      type: FileType.TEXT,
    };
    const { renderer } = await renderEditor(file);

    await act(async () => {
      handlers.keydown({ key: "f", ctrlKey: true, preventDefault: jest.fn() });
    });

    expect(renderer!.root.findByType(FindReplaceBar)).toBeTruthy();
  });

  it("alerts when export fails", async () => {
    const file: FileContent = {
      path: "note.txt",
      content: "hello",
      type: FileType.TEXT,
    };

    const alertMock = jest.fn();
    (global as any).alert = alertMock;
    (global as any).window.alert = alertMock;
    (global as any).window.notegitApi.export.note = jest
      .fn()
      .mockResolvedValue({ ok: false, error: { message: "Boom" } });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { renderer } = await renderEditor(file);

    const exportButton = getToolbarButton(
      renderer!,
      TEXT_EDITOR_TEXT.exportTooltip,
    );
    await act(async () => {
      exportButton.props.onClick();
      await flushPromises();
    });

    expect(alertMock).toHaveBeenCalledWith("Failed to export: Boom");
    errorSpy.mockRestore();
  });

  it("exports successfully and handles exceptions", async () => {
    const file: FileContent = {
      path: "note.txt",
      content: "hello",
      type: FileType.TEXT,
    };

    (global as any).window.notegitApi.export.note = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, data: "/tmp/note.txt" })
      .mockRejectedValueOnce(new Error("export boom"));

    const alertMock = jest.fn();
    (global as any).alert = alertMock;
    (global as any).window.alert = alertMock;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { renderer } = await renderEditor(file);
    const exportButton = getToolbarButton(
      renderer,
      TEXT_EDITOR_TEXT.exportTooltip,
    );

    await act(async () => {
      await exportButton.props.onClick();
    });

    await act(async () => {
      await exportButton.props.onClick();
    });

    expect(alertMock).toHaveBeenCalledWith("Failed to export note");
    errorSpy.mockRestore();
  });

  it("uses keymap handlers for save and insert line break", async () => {
    const file: FileContent = {
      path: "note.txt",
      content: "hello",
      type: FileType.TEXT,
    };
    const { onSave } = await renderEditor(file);

    act(() => {
      lastCodeMirrorProps.onChange("changed");
    });

    const keymaps = lastCodeMirrorProps.extensions.find((ext: any) =>
      Array.isArray(ext),
    );
    const modSave = keymaps.find((binding: any) => binding.key === "Mod-s");
    const ctrlEnter = keymaps.find(
      (binding: any) => binding.key === "Ctrl-Enter",
    );

    act(() => {
      expect(modSave.run()).toBe(true);
    });
    expect(onSave).toHaveBeenCalledWith("changed");

    const view = createMockView("hello", 2, 2);
    expect(ctrlEnter.run(view)).toBe(true);
    expect(view.dispatch).toHaveBeenCalledWith({
      changes: { from: 2, insert: "\r" },
      selection: { anchor: 3 },
    });
  });

  it("renders tree panel controls when provided and wires callbacks", async () => {
    const file: FileContent = {
      path: "note.txt",
      content: "hello",
      type: FileType.TEXT,
    };
    const onToggleTree = jest.fn();
    const onNavigateBack = jest.fn();
    const onNavigateForward = jest.fn();
    const { renderer } = await renderEditor(file, {
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
      TEXT_EDITOR_TEXT.showTreeTooltip,
    );
    const backButton = getToolbarButton(renderer, TEXT_EDITOR_TEXT.backTooltip);
    const forwardButton = getToolbarButton(
      renderer,
      TEXT_EDITOR_TEXT.forwardTooltip,
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

  it("finds and replaces text through the find bar", async () => {
    const file: FileContent = {
      path: "note.txt",
      content: "hello hello",
      type: FileType.TEXT,
    };

    const handlers: Record<string, any> = {};
    (global as any).window.addEventListener = jest.fn(
      (event: string, handler: any) => {
        handlers[event] = handler;
      },
    );

    const { renderer, onChange } = await renderEditor(file);
    jest.useFakeTimers();

    act(() => {
      handlers.keydown({ key: "f", ctrlKey: true, preventDefault: jest.fn() });
    });

    act(() => {
      jest.runAllTimers();
    });

    const findBar = renderer.root.findByType(FindReplaceBar);
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
});
