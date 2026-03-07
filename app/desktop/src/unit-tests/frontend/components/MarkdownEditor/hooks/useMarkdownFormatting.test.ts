import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Button } from "@mui/material";
import { useMarkdownFormatting } from "../../../../../frontend/components/MarkdownEditor/hooks/useMarkdownFormatting";
import {
  MARKDOWN_INSERT_DEFAULTS,
  MARKDOWN_INSERT_TOKENS,
} from "../../../../../frontend/components/MarkdownEditor/constants";

type MockSelection = { from: number; to: number };

const createView = (docText: string, selection: MockSelection) => {
  const dispatch = jest.fn();
  const focus = jest.fn();

  return {
    dispatch,
    focus,
    state: {
      selection: {
        main: selection,
      },
      doc: {
        length: docText.length,
        toString: () => docText,
        sliceString: (from: number, to: number) => docText.slice(from, to),
        lineAt: () => ({ from: 0 }),
      },
    },
  };
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

describe("useMarkdownFormatting", () => {
  it("does nothing when the editor view is unavailable", () => {
    let formatters: ReturnType<typeof useMarkdownFormatting> | undefined;

    const Harness = () => {
      formatters = useMarkdownFormatting({
        editorRef: { current: null },
      });
      return React.createElement("div");
    };

    TestRenderer.create(React.createElement(Harness));

    expect(() => formatters?.formatBold()).not.toThrow();
  });

  it("wraps the selected text for inline formatting actions", () => {
    const view = createView("hello world", { from: 0, to: 5 });

    const Harness = () => {
      const formatters = useMarkdownFormatting({
        editorRef: { current: { view } },
      });

      return React.createElement(
        React.Fragment,
        null,
        React.createElement(Button, { onClick: formatters.formatBold }, "Bold"),
        React.createElement(
          Button,
          { onClick: formatters.formatItalic },
          "Italic",
        ),
      );
    };

    const renderer = TestRenderer.create(React.createElement(Harness));

    act(() => {
      findButton(renderer, "Bold").props.onClick();
    });

    expect(view.dispatch).toHaveBeenCalledWith({
      changes: {
        from: 0,
        to: 5,
        insert: "**hello**",
      },
      selection: {
        anchor: 2,
        head: 7,
      },
    });
    expect(view.focus).toHaveBeenCalled();
  });

  it("inserts a task item when there is no selection", () => {
    const view = createView("", { from: 0, to: 0 });

    const Harness = () => {
      const formatters = useMarkdownFormatting({
        editorRef: { current: { view } },
      });

      return React.createElement(
        Button,
        { onClick: formatters.formatTaskList },
        "Task",
      );
    };

    const renderer = TestRenderer.create(React.createElement(Harness));

    act(() => {
      findButton(renderer, "Task").props.onClick();
    });

    expect(view.dispatch).toHaveBeenCalledWith({
      changes: {
        from: 0,
        to: 0,
        insert: `- [ ] ${MARKDOWN_INSERT_DEFAULTS.taskList}`,
      },
      selection: {
        anchor: 6,
        head: 6 + MARKDOWN_INSERT_DEFAULTS.taskList.length,
      },
    });
  });

  it("removes task markers when all selected lines are unchecked tasks", () => {
    const view = createView("- [ ] one\n- [ ] two", { from: 0, to: 19 });

    const Harness = () => {
      const formatters = useMarkdownFormatting({
        editorRef: { current: { view } },
      });

      return React.createElement(
        Button,
        { onClick: formatters.formatTaskList },
        "Task",
      );
    };

    const renderer = TestRenderer.create(React.createElement(Harness));

    act(() => {
      findButton(renderer, "Task").props.onClick();
    });

    expect(view.dispatch).toHaveBeenCalledWith({
      changes: {
        from: 0,
        to: 19,
        insert: "one\ntwo",
      },
      selection: {
        anchor: 0,
        head: 7,
      },
    });
  });

  it("keeps completed task selections unchanged", () => {
    const view = createView("- [x] done", { from: 0, to: 10 });

    const Harness = () => {
      const formatters = useMarkdownFormatting({
        editorRef: { current: { view } },
      });

      return React.createElement(
        Button,
        { onClick: formatters.formatTaskList },
        "Task",
      );
    };

    const renderer = TestRenderer.create(React.createElement(Harness));

    act(() => {
      findButton(renderer, "Task").props.onClick();
    });

    expect(view.dispatch).not.toHaveBeenCalled();
    expect(view.focus).toHaveBeenCalled();
  });

  it("appends the next footnote definition at the end of the document", () => {
    const view = createView("Body text [^2]", { from: 4, to: 4 });

    const Harness = () => {
      const formatters = useMarkdownFormatting({
        editorRef: { current: { view } },
      });

      return React.createElement(
        Button,
        { onClick: formatters.formatFootnote },
        "Footnote",
      );
    };

    const renderer = TestRenderer.create(React.createElement(Harness));

    act(() => {
      findButton(renderer, "Footnote").props.onClick();
    });

    expect(view.dispatch).toHaveBeenCalledWith({
      changes: [
        { from: 4, to: 4, insert: "[^3]" },
        {
          from: 14,
          to: 14,
          insert: `\n\n[^3]: ${MARKDOWN_INSERT_DEFAULTS.footnote}`,
        },
      ],
      selection: {
        anchor: 26,
        head: 26 + MARKDOWN_INSERT_DEFAULTS.footnote.length,
      },
      scrollIntoView: true,
    });
  });

  it("inserts a mermaid block and selects the default diagram text", () => {
    const view = createView("diagram", { from: 0, to: 0 });

    const Harness = () => {
      const formatters = useMarkdownFormatting({
        editorRef: { current: { view } },
      });

      return React.createElement(
        Button,
        { onClick: formatters.formatMermaid },
        "Mermaid",
      );
    };

    const renderer = TestRenderer.create(React.createElement(Harness));

    act(() => {
      findButton(renderer, "Mermaid").props.onClick();
    });

    expect(view.dispatch).toHaveBeenCalledWith({
      changes: {
        from: 0,
        to: 0,
        insert: `${MARKDOWN_INSERT_TOKENS.mermaid[0]}${MARKDOWN_INSERT_DEFAULTS.mermaid}${MARKDOWN_INSERT_TOKENS.mermaid[1]}`,
      },
      selection: {
        anchor: MARKDOWN_INSERT_TOKENS.mermaid[0].length,
        head:
          MARKDOWN_INSERT_TOKENS.mermaid[0].length +
          MARKDOWN_INSERT_DEFAULTS.mermaid.length,
      },
    });
  });

  it("supports the remaining inline and block formatter actions", () => {
    const view = createView("content", { from: 0, to: 0 });

    const Harness = () => {
      const formatters = useMarkdownFormatting({
        editorRef: { current: { view } },
      });

      return React.createElement(
        React.Fragment,
        null,
        React.createElement(Button, { onClick: formatters.formatCode }, "Code"),
        React.createElement(
          Button,
          { onClick: formatters.formatCodeBlock },
          "CodeBlock",
        ),
        React.createElement(
          Button,
          { onClick: formatters.formatHeading },
          "Heading",
        ),
        React.createElement(
          Button,
          { onClick: formatters.formatQuote },
          "Quote",
        ),
        React.createElement(
          Button,
          { onClick: formatters.formatBulletList },
          "Bullet",
        ),
        React.createElement(
          Button,
          { onClick: formatters.formatNumberedList },
          "Numbered",
        ),
        React.createElement(Button, { onClick: formatters.formatLink }, "Link"),
        React.createElement(
          Button,
          { onClick: formatters.formatTable },
          "Table",
        ),
        React.createElement(
          Button,
          { onClick: formatters.formatHighlight },
          "Highlight",
        ),
        React.createElement(
          Button,
          { onClick: formatters.formatDefinitionList },
          "Definition",
        ),
        React.createElement(
          Button,
          { onClick: formatters.formatRawMarkdown },
          "Raw",
        ),
      );
    };

    const renderer = TestRenderer.create(React.createElement(Harness));

    [
      "Code",
      "CodeBlock",
      "Heading",
      "Quote",
      "Bullet",
      "Numbered",
      "Link",
      "Table",
      "Highlight",
      "Definition",
      "Raw",
    ].forEach((label) => {
      act(() => {
        findButton(renderer, label).props.onClick();
      });
    });

    expect(view.dispatch).toHaveBeenCalledTimes(11);
    expect(view.focus).toHaveBeenCalledTimes(11);
  });
});
