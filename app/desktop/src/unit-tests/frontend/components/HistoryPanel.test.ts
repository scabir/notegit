import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { renderToString } from "react-dom/server";
import { IconButton, ListItemButton } from "@mui/material";
import { HistoryPanel } from "../../../frontend/components/HistoryPanel";
import { HISTORY_PANEL_TEXT } from "../../../frontend/components/HistoryPanel/constants";
import {
  formatRelativeDate,
  getFileName,
} from "../../../frontend/components/HistoryPanel/utils";
import type { CommitEntry } from "../../../shared/types";

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const flattenText = (node: any): string => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(flattenText).join("");
  return node.children ? node.children.map(flattenText).join("") : "";
};

describe("HistoryPanel", () => {
  beforeEach(() => {
    (global as any).window = {
      notegitApi: {
        history: {
          getForFile: jest.fn(),
        },
      },
    };
  });

  it("shows hint when no file is selected", () => {
    const html = renderToString(
      React.createElement(HistoryPanel, {
        filePath: null,
        onViewVersion: jest.fn(),
        onClose: jest.fn(),
      }),
    );

    expect(html).toContain(HISTORY_PANEL_TEXT.selectFile);
  });

  it("loads history and calls onViewVersion", async () => {
    const commit: CommitEntry = {
      hash: "abc123",
      author: "Jane Doe",
      email: "jane@example.com",
      date: new Date("2024-01-01T12:00:00Z"),
      message: "Initial commit",
    };
    const getForFile = jest
      .fn()
      .mockResolvedValue({ ok: true, data: [commit] });
    (global as any).window.notegitApi.history.getForFile = getForFile;

    const onViewVersion = jest.fn();

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(HistoryPanel, {
          filePath: "notes/note.md",
          onViewVersion,
          onClose: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
    });

    expect(getForFile).toHaveBeenCalledWith("notes/note.md");

    const buttons = renderer!.root.findAllByType(ListItemButton);
    expect(buttons).toHaveLength(1);

    act(() => {
      buttons[0].props.onClick();
    });

    expect(onViewVersion).toHaveBeenCalledWith(commit.hash, commit.message);
  });

  it("shows fallback states for failed and empty history responses", async () => {
    const getForFile = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, error: {} })
      .mockResolvedValueOnce({ ok: true, data: [] });
    (global as any).window.notegitApi.history.getForFile = getForFile;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(HistoryPanel, {
          filePath: "notes/note.md",
          onViewVersion: jest.fn(),
          onClose: jest.fn(),
        }),
      );
    });

    await act(async () => {
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain(
      HISTORY_PANEL_TEXT.loadFailed,
    );

    await act(async () => {
      renderer!.update(
        React.createElement(HistoryPanel, {
          filePath: "notes/other.md",
          onViewVersion: jest.fn(),
          onClose: jest.fn(),
        }),
      );
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain(
      HISTORY_PANEL_TEXT.noCommits,
    );
  });

  it("clears history when file path becomes empty and invokes close", async () => {
    const commit: CommitEntry = {
      hash: "abc123",
      author: "Jane Doe",
      email: "jane@example.com",
      date: new Date("2024-01-01T12:00:00Z"),
      message: "Initial commit",
    };
    const getForFile = jest
      .fn()
      .mockResolvedValue({ ok: true, data: [commit] });
    const onClose = jest.fn();
    (global as any).window.notegitApi.history.getForFile = getForFile;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(HistoryPanel, {
          filePath: "notes/note.md",
          onViewVersion: jest.fn(),
          onClose,
        }),
      );
    });

    await act(async () => {
      await flushPromises();
    });

    const closeButton = renderer!.root.findByType(IconButton);
    act(() => {
      closeButton.props.onClick();
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      renderer!.update(
        React.createElement(HistoryPanel, {
          filePath: null,
          onViewVersion: jest.fn(),
          onClose,
        }),
      );
      await flushPromises();
    });

    expect(flattenText(renderer!.toJSON())).toContain(
      HISTORY_PANEL_TEXT.selectFile,
    );
  });
});

describe("HistoryPanel utils", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-02T00:00:00Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("formats recent dates", () => {
    expect(formatRelativeDate(new Date("2024-01-02T00:00:00Z"))).toBe(
      "just now",
    );
    expect(formatRelativeDate(new Date("2024-01-01T20:00:00Z"))).toBe("4h ago");
    expect(formatRelativeDate(new Date("2024-01-01T00:00:00Z"))).toBe(
      "yesterday",
    );
  });

  it("extracts file name from path", () => {
    expect(getFileName("notes/note.md")).toBe("note.md");
    expect(getFileName(null)).toBe("");
  });
});
