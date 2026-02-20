import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { renderToString } from "react-dom/server";
import { TextField, ListItemButton, Chip } from "@mui/material";
import { SearchDialog } from "../../../frontend/components/SearchDialog";
import { SEARCH_DIALOG_TEXT } from "../../../frontend/components/SearchDialog/constants";
import type { SearchResult } from "../../../shared/types/api";

const createResult = (): SearchResult => ({
  filePath: "notes/note.md",
  fileName: "note.md",
  matches: [
    {
      lineNumber: 3,
      lineContent: "note content",
      contextBefore: "",
      contextAfter: "",
    },
  ],
});

const createResultWithMatches = (
  filePath: string,
  fileName: string,
  matchCount: number,
): SearchResult => ({
  filePath,
  fileName,
  matches: Array.from({ length: matchCount }).map((_, index) => ({
    lineNumber: index + 1,
    lineContent: `match ${index + 1}`,
    contextBefore: "",
    contextAfter: "",
  })),
});

describe("SearchDialog", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (global as any).window = {
      notegitApi: {
        search: {
          query: jest.fn(),
        },
      },
    };
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("shows start typing hint when query is empty", () => {
    const html = renderToString(
      React.createElement(SearchDialog, {
        open: true,
        onClose: jest.fn(),
        onSelectFile: jest.fn(),
      }),
    );

    expect(html).toContain(SEARCH_DIALOG_TEXT.startTyping);
  });

  it("queries and selects the first result on Enter", async () => {
    const onClose = jest.fn();
    const onSelectFile = jest.fn();
    const queryMock = jest
      .fn()
      .mockResolvedValue({ ok: true, data: [createResult()] });
    (global as any).window.notegitApi.search.query = queryMock;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SearchDialog, {
          open: true,
          onClose,
          onSelectFile,
        }),
      );
    });

    const textField = renderer!.root.findByType(TextField);
    act(() => {
      textField.props.onChange({ target: { value: "note" } });
    });

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(queryMock).toHaveBeenCalledWith("note", { maxResults: 50 });

    const buttons = renderer!.root.findAllByType(ListItemButton);
    expect(buttons).toHaveLength(1);

    act(() => {
      textField.props.onKeyDown({
        key: "Enter",
        preventDefault: jest.fn(),
      });
    });

    expect(onSelectFile).toHaveBeenCalledWith("notes/note.md");
    expect(onClose).toHaveBeenCalled();
  });

  it("shows an error when search fails", async () => {
    const queryMock = jest
      .fn()
      .mockResolvedValue({ ok: false, error: { message: "search failed" } });
    (global as any).window.notegitApi.search.query = queryMock;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SearchDialog, {
          open: true,
          onClose: jest.fn(),
          onSelectFile: jest.fn(),
        }),
      );
    });

    const textField = renderer!.root.findByType(TextField);
    act(() => {
      textField.props.onChange({ target: { value: "note" } });
    });

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(queryMock).toHaveBeenCalledWith("note", { maxResults: 50 });
    const text = JSON.stringify(renderer!.toJSON());
    expect(text).toContain("search failed");
  });

  it("shows no results message when search returns empty", async () => {
    const queryMock = jest.fn().mockResolvedValue({ ok: true, data: [] });
    (global as any).window.notegitApi.search.query = queryMock;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SearchDialog, {
          open: true,
          onClose: jest.fn(),
          onSelectFile: jest.fn(),
        }),
      );
    });

    const textField = renderer!.root.findByType(TextField);
    act(() => {
      textField.props.onChange({ target: { value: "missing" } });
    });

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    const text = JSON.stringify(renderer!.toJSON());
    expect(text).toContain(SEARCH_DIALOG_TEXT.noResults);
  });

  it("navigates results with arrow keys and selects via Enter", async () => {
    const onClose = jest.fn();
    const onSelectFile = jest.fn();
    const results = [
      createResultWithMatches("notes/one.md", "one.md", 1),
      createResultWithMatches("notes/two.txt", "two.txt", 3),
    ];
    const queryMock = jest.fn().mockResolvedValue({ ok: true, data: results });
    (global as any).window.notegitApi.search.query = queryMock;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SearchDialog, {
          open: true,
          onClose,
          onSelectFile,
        }),
      );
    });

    const textField = renderer!.root.findByType(TextField);
    act(() => {
      textField.props.onChange({ target: { value: "match" } });
    });

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    const buttons = renderer!.root.findAllByType(ListItemButton);
    expect(buttons).toHaveLength(2);

    act(() => {
      textField.props.onKeyDown({
        key: "ArrowDown",
        preventDefault: jest.fn(),
      });
    });
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      textField.props.onKeyDown({ key: "Enter", preventDefault: jest.fn() });
    });

    expect(onSelectFile).toHaveBeenCalledWith("notes/two.txt");
    expect(onClose).toHaveBeenCalled();

    const chips = renderer!.root.findAllByType(Chip);
    expect(chips.some((chip) => String(chip.props.label).includes("+1"))).toBe(
      true,
    );
  });

  it("closes on Escape", async () => {
    const onClose = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SearchDialog, {
          open: true,
          onClose,
          onSelectFile: jest.fn(),
        }),
      );
    });

    const textField = renderer!.root.findByType(TextField);
    act(() => {
      textField.props.onKeyDown({ key: "Escape", preventDefault: jest.fn() });
    });

    expect(onClose).toHaveBeenCalled();
  });

  it("handles query errors and resets on close", async () => {
    const queryMock = jest.fn().mockRejectedValue(new Error("boom"));
    (global as any).window.notegitApi.search.query = queryMock;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SearchDialog, {
          open: true,
          onClose: jest.fn(),
          onSelectFile: jest.fn(),
        }),
      );
    });

    const textField = renderer!.root.findByType(TextField);
    act(() => {
      textField.props.onChange({ target: { value: "boom" } });
    });

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(JSON.stringify(renderer!.toJSON())).toContain("boom");

    await act(async () => {
      renderer!.update(
        React.createElement(SearchDialog, {
          open: false,
          onClose: jest.fn(),
          onSelectFile: jest.fn(),
        }),
      );
    });

    await act(async () => {
      renderer!.update(
        React.createElement(SearchDialog, {
          open: true,
          onClose: jest.fn(),
          onSelectFile: jest.fn(),
        }),
      );
    });

    expect(JSON.stringify(renderer!.toJSON())).toContain(
      SEARCH_DIALOG_TEXT.startTyping,
    );
  });

  it("clears previous search timers and supports list click selection", async () => {
    const onSelectFile = jest.fn();
    const onClose = jest.fn();
    const results = [
      createResultWithMatches("notes/one.md", "one.md", 1),
      createResultWithMatches("notes/two.md", "two.md", 1),
    ];
    const queryMock = jest.fn().mockResolvedValue({ ok: true, data: results });
    (global as any).window.notegitApi.search.query = queryMock;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SearchDialog, {
          open: true,
          onClose,
          onSelectFile,
        }),
      );
    });

    const textField = renderer!.root.findByType(TextField);
    act(() => {
      textField.props.onChange({ target: { value: "o" } });
      textField.props.onChange({ target: { value: "on" } });
    });

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    const buttons = renderer!.root.findAllByType(ListItemButton);
    act(() => {
      buttons[1].props.onMouseEnter();
      buttons[1].props.onClick();
    });

    expect(onSelectFile).toHaveBeenCalledWith("notes/two.md");
    expect(onClose).toHaveBeenCalled();
  });
});
