import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Button } from "@mui/material";

jest.mock("react-markdown", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children, components }: any) => {
      const text = Array.isArray(children)
        ? children.join("")
        : String(children);
      if (text.includes("TRIGGER_MARKDOWN_COMPONENTS")) {
        return React.createElement(
          React.Fragment,
          null,
          components.img?.({
            src: "images/a.png",
            alt: "preview-image",
          }),
          components.code?.({
            inline: false,
            className: "language-mermaid",
            children: "graph TD; A-->B\n",
          }),
        );
      }
      return React.createElement("div", null, children);
    },
  };
});

jest.mock("../../../frontend/components/MermaidDiagram", () => ({
  MermaidDiagram: ({ code }: { code: string }) =>
    React.createElement("div", { "data-testid": "mermaid-diagram" }, code),
}));

import { HistoryViewer } from "../../../frontend/components/HistoryViewer";
import { HISTORY_VIEWER_TEXT } from "../../../frontend/components/HistoryViewer/constants";
import {
  getFileName,
  isMarkdownFile,
  resolveImageSrc,
} from "../../../frontend/components/HistoryViewer/utils";

jest.mock("@uiw/react-codemirror", () => {
  const React = require("react");
  return (props: any) =>
    React.createElement("div", { "data-testid": "codemirror", ...props });
});

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const flattenText = (node: any): string => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(flattenText).join("");
  return node.children ? node.children.map(flattenText).join("") : "";
};

const findButtonByText = (
  renderer: TestRenderer.ReactTestRenderer,
  text: string,
) => {
  return renderer.root.findAllByType(Button).find((button) => {
    const children = button.props.children;
    if (typeof children === "string") {
      return children === text;
    }
    if (Array.isArray(children)) {
      return children.includes(text);
    }
    return false;
  });
};

describe("HistoryViewer", () => {
  beforeEach(() => {
    (global as any).window = {
      NoteBranchApi: {
        history: {
          getVersion: jest.fn(),
        },
      },
    };
    (global as any).navigator = {
      clipboard: {
        writeText: jest.fn(),
      },
    };
  });

  it("loads content and supports copy", async () => {
    const getVersion = jest
      .fn()
      .mockResolvedValue({ ok: true, data: "# Title" });
    (global as any).window.NoteBranchApi.history.getVersion = getVersion;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(HistoryViewer, {
          open: true,
          filePath: "notes/note.md",
          commitHash: "abc123",
          commitMessage: "Update note",
          repoPath: "/repo",
          onClose: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
    });

    expect(getVersion).toHaveBeenCalledWith("abc123", "notes/note.md");
    expect(flattenText(renderer!.toJSON())).toContain("# Title");

    const copyButton = findButtonByText(
      renderer!,
      HISTORY_VIEWER_TEXT.copyContent,
    );
    if (!copyButton) {
      throw new Error("Copy button not found");
    }

    act(() => {
      copyButton.props.onClick();
    });

    expect((global as any).navigator.clipboard.writeText).toHaveBeenCalledWith(
      "# Title",
    );
  });

  it("shows an error when load fails", async () => {
    const getVersion = jest.fn().mockResolvedValue({
      ok: false,
      error: { message: "Boom" },
    });
    (global as any).window.NoteBranchApi.history.getVersion = getVersion;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(HistoryViewer, {
          open: true,
          filePath: "notes/note.md",
          commitHash: "abc123",
          commitMessage: "Update note",
          repoPath: "/repo",
          onClose: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain("Boom");
  });

  it("shows an error when load throws", async () => {
    const getVersion = jest.fn().mockRejectedValue(new Error("Crash"));
    (global as any).window.NoteBranchApi.history.getVersion = getVersion;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(HistoryViewer, {
          open: true,
          filePath: "notes/note.md",
          commitHash: "abc123",
          commitMessage: "Update note",
          repoPath: "/repo",
          onClose: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain("Crash");
  });

  it("toggles between preview and source views", async () => {
    const getVersion = jest
      .fn()
      .mockResolvedValue({ ok: true, data: "# Title" });
    (global as any).window.NoteBranchApi.history.getVersion = getVersion;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(HistoryViewer, {
          open: true,
          filePath: "notes/note.md",
          commitHash: "abc123",
          commitMessage: "Update note",
          repoPath: "/repo",
          onClose: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const sourceButton = findButtonByText(
      renderer!,
      HISTORY_VIEWER_TEXT.source,
    );
    const previewButton = findButtonByText(
      renderer!,
      HISTORY_VIEWER_TEXT.preview,
    );
    if (!sourceButton || !previewButton) {
      throw new Error("View toggle buttons not found");
    }

    act(() => {
      sourceButton.props.onClick();
    });

    expect(
      renderer!.root.findAllByProps({ "data-testid": "codemirror" }).length,
    ).toBe(1);

    act(() => {
      previewButton.props.onClick();
    });

    expect(
      renderer!.root.findAllByProps({ "data-testid": "codemirror" }).length,
    ).toBe(0);
  });

  it("does not load version when dialog is closed or commit hash is missing", async () => {
    const getVersion = jest.fn();
    (global as any).window.NoteBranchApi.history.getVersion = getVersion;

    await act(async () => {
      TestRenderer.create(
        React.createElement(HistoryViewer, {
          open: false,
          filePath: "notes/note.md",
          commitHash: "abc123",
          commitMessage: "Update note",
          repoPath: "/repo",
          onClose: jest.fn(),
        }),
      );
    });

    await act(async () => {
      TestRenderer.create(
        React.createElement(HistoryViewer, {
          open: true,
          filePath: "notes/note.md",
          commitHash: null,
          commitMessage: "Update note",
          repoPath: "/repo",
          onClose: jest.fn(),
        }),
      );
    });

    expect(getVersion).not.toHaveBeenCalled();
  });

  it("uses fallback load error text and disables copy without content", async () => {
    const getVersion = jest.fn().mockResolvedValue({
      ok: false,
      error: {},
    });
    const onClose = jest.fn();
    (global as any).window.NoteBranchApi.history.getVersion = getVersion;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(HistoryViewer, {
          open: true,
          filePath: "notes/note.md",
          commitHash: "abc123",
          commitMessage: "Update note",
          repoPath: "/repo",
          onClose,
        }),
      );
    });

    await act(async () => {
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain(
      HISTORY_VIEWER_TEXT.loadFailed,
    );

    const buttons = renderer!.root.findAllByType(Button);
    expect(buttons[buttons.length - 2].props.disabled).toBe(true);

    act(() => {
      buttons[buttons.length - 1].props.onClick();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders plain text content without markdown preview toggles", async () => {
    const getVersion = jest.fn().mockResolvedValue({ ok: true, data: "plain" });
    (global as any).window.NoteBranchApi.history.getVersion = getVersion;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(HistoryViewer, {
          open: true,
          filePath: "notes/note.txt",
          commitHash: "abc123",
          commitMessage: "Update note",
          repoPath: "/repo",
          onClose: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
    });

    expect(
      renderer!.root.findAllByProps({ "data-testid": "codemirror" }).length,
    ).toBe(1);
    expect(
      findButtonByText(renderer!, HISTORY_VIEWER_TEXT.preview),
    ).toBeUndefined();
    expect(
      findButtonByText(renderer!, HISTORY_VIEWER_TEXT.source),
    ).toBeUndefined();
  });

  it("renders markdown image and mermaid preview components", async () => {
    const getVersion = jest.fn().mockResolvedValue({
      ok: true,
      data: "TRIGGER_MARKDOWN_COMPONENTS",
    });
    (global as any).window.NoteBranchApi.history.getVersion = getVersion;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(HistoryViewer, {
          open: true,
          filePath: "notes/note.md",
          commitHash: "abc123",
          commitMessage: "Update note",
          repoPath: "/repo",
          onClose: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const image = renderer!.root.findByType("img");
    const mermaidDiagram = renderer!.root.findByProps({
      "data-testid": "mermaid-diagram",
    });

    expect(image.props.src).toBe("file:///repo/notes/images/a.png");
    expect(image.props.alt).toBe("preview-image");
    expect(flattenText(mermaidDiagram)).toContain("graph TD; A-->B");
  });
});

describe("HistoryViewer utils", () => {
  it("derives file name and markdown detection", () => {
    expect(getFileName("notes/note.md")).toBe("note.md");
    expect(getFileName(null)).toBe("");
    expect(isMarkdownFile("notes/note.md")).toBe(true);
    expect(isMarkdownFile("notes/note.txt")).toBe(false);
  });

  it("resolves image sources", () => {
    expect(resolveImageSrc("/repo", "notes/note.md", "images/a.png")).toBe(
      "file:///repo/notes/images/a.png",
    );
    expect(
      resolveImageSrc("/repo", "notes/note.md", "http://example.com/img.png"),
    ).toBe("http://example.com/img.png");
    expect(resolveImageSrc(null, "notes/note.md", "images/a.png")).toBe(
      "images/a.png",
    );
  });
});
