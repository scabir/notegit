import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { useMarkdownEditorShortcuts } from "../../../../../frontend/components/MarkdownEditor/hooks/useMarkdownEditorShortcuts";
import type { MarkdownFormatters } from "../../../../../frontend/components/MarkdownEditor/types";

const HookHarness = ({ editorRef, formatters }: any) => {
  useMarkdownEditorShortcuts({ editorRef, formatters });
  return null;
};

const createFormatters = (): MarkdownFormatters => ({
  formatBold: jest.fn(),
  formatItalic: jest.fn(),
  formatHeading: jest.fn(),
  formatQuote: jest.fn(),
  formatBulletList: jest.fn(),
  formatNumberedList: jest.fn(),
  formatCode: jest.fn(),
  formatCodeBlock: jest.fn(),
  formatLink: jest.fn(),
  formatTable: jest.fn(),
  formatFootnote: jest.fn(),
  formatTaskList: jest.fn(),
  formatHighlight: jest.fn(),
  formatDefinitionList: jest.fn(),
  formatMermaid: jest.fn(),
  formatRawMarkdown: jest.fn(),
});

type SetupResult = {
  listeners: Record<string, (event: any) => void>;
  editorRef: { current: any };
  insideTarget: object;
  outsideTarget: object;
  formatters: MarkdownFormatters;
  renderer: TestRenderer.ReactTestRenderer;
};

const setup = (): SetupResult => {
  const listeners: Record<string, (event: any) => void> = {};
  window.addEventListener = jest.fn((event: string, handler: any) => {
    listeners[event] = handler;
  });
  window.removeEventListener = jest.fn();

  class FakeNode {}
  (global as any).Node = FakeNode;

  const insideTarget = new FakeNode();
  const outsideTarget = new FakeNode();

  const editorRef = {
    current: {
      view: {
        dom: {
          contains: (target: unknown) => target === insideTarget,
        },
      },
    },
  };

  const formatters = createFormatters();
  let renderer!: TestRenderer.ReactTestRenderer;

  act(() => {
    renderer = TestRenderer.create(
      React.createElement(HookHarness, { editorRef, formatters }),
    );
  });

  return {
    listeners,
    editorRef,
    insideTarget,
    outsideTarget,
    formatters,
    renderer,
  };
};

const fireKeydown = (
  listeners: Record<string, (event: any) => void>,
  event: any,
) => {
  act(() => {
    listeners.keydown(event);
  });
};

describe("useMarkdownEditorShortcuts", () => {
  it("ignores prevented events, missing editor views, outside targets, and events without mod key", () => {
    const { listeners, editorRef, insideTarget, outsideTarget, formatters } =
      setup();

    fireKeydown(listeners, {
      defaultPrevented: true,
      target: insideTarget,
      key: "b",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      preventDefault: jest.fn(),
    });

    editorRef.current = null;
    fireKeydown(listeners, {
      defaultPrevented: false,
      target: insideTarget,
      key: "b",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      preventDefault: jest.fn(),
    });

    editorRef.current = {
      view: {
        dom: {
          contains: (target: unknown) => target === insideTarget,
        },
      },
    };

    fireKeydown(listeners, {
      defaultPrevented: false,
      target: outsideTarget,
      key: "b",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      preventDefault: jest.fn(),
    });

    fireKeydown(listeners, {
      defaultPrevented: false,
      target: insideTarget,
      key: "b",
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault: jest.fn(),
    });

    expect(formatters.formatBold).not.toHaveBeenCalled();
  });

  it("handles all supported markdown shortcuts", () => {
    const { listeners, insideTarget, formatters } = setup();

    const runShortcut = (key: string, shift = false) => {
      const preventDefault = jest.fn();
      fireKeydown(listeners, {
        defaultPrevented: false,
        target: insideTarget,
        key,
        ctrlKey: true,
        metaKey: false,
        shiftKey: shift,
        preventDefault,
      });
      expect(preventDefault).toHaveBeenCalled();
    };

    runShortcut("t", true);
    runShortcut("f", true);
    runShortcut("l", true);
    runShortcut("h", true);
    runShortcut("d", true);
    runShortcut("m", true);
    runShortcut("{");
    runShortcut("b");
    runShortcut("t");
    runShortcut("h");
    runShortcut("`");
    runShortcut("l");

    expect(formatters.formatTable).toHaveBeenCalledTimes(1);
    expect(formatters.formatFootnote).toHaveBeenCalledTimes(1);
    expect(formatters.formatTaskList).toHaveBeenCalledTimes(1);
    expect(formatters.formatHighlight).toHaveBeenCalledTimes(1);
    expect(formatters.formatDefinitionList).toHaveBeenCalledTimes(1);
    expect(formatters.formatMermaid).toHaveBeenCalledTimes(1);
    expect(formatters.formatCodeBlock).toHaveBeenCalledTimes(1);
    expect(formatters.formatBold).toHaveBeenCalledTimes(1);
    expect(formatters.formatItalic).toHaveBeenCalledTimes(1);
    expect(formatters.formatHeading).toHaveBeenCalledTimes(1);
    expect(formatters.formatCode).toHaveBeenCalledTimes(1);
    expect(formatters.formatLink).toHaveBeenCalledTimes(1);
  });

  it("uses updated formatter handlers after rerender", () => {
    const { listeners, insideTarget, renderer } = setup();
    const updatedFormatters = createFormatters();

    act(() => {
      renderer.update(
        React.createElement(HookHarness, {
          editorRef: {
            current: {
              view: {
                dom: {
                  contains: (target: unknown) => target === insideTarget,
                },
              },
            },
          },
          formatters: updatedFormatters,
        }),
      );
    });

    fireKeydown(listeners, {
      defaultPrevented: false,
      target: insideTarget,
      key: "b",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      preventDefault: jest.fn(),
    });

    expect(updatedFormatters.formatBold).toHaveBeenCalledTimes(1);
  });

  it("removes listener on unmount", () => {
    const { renderer } = setup();

    act(() => {
      renderer.unmount();
    });

    expect(window.removeEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
    );
  });
});
