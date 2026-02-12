import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MutableRefObject,
} from "react";
import { EditorSelection } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import type { EditorView } from "@codemirror/view";

export type UseEditorFindReplaceOptions = {
  content: string;
  setContent: (value: string) => void;
  editorViewRef: MutableRefObject<EditorView | null>;
  onContentModified?: () => void;
};

export type UseEditorFindReplaceResult = {
  findBarOpen: boolean;
  searchMatches: { start: number; end: number }[];
  currentMatchIndex: number;
  closeFindBar: () => void;
  resetFindState: () => void;
  handleOpenFind: () => void;
  handleFindNext: (query: string) => void;
  handleFindPrevious: (query: string) => void;
  handleReplace: (query: string, replacement: string) => void;
  handleReplaceAll: (query: string, replacement: string) => void;
};

export const useEditorFindReplace = ({
  content,
  setContent,
  editorViewRef,
  onContentModified,
}: UseEditorFindReplaceOptions): UseEditorFindReplaceResult => {
  const [findBarOpen, setFindBarOpen] = useState(false);
  const [searchMatches, setSearchMatches] = useState<
    { start: number; end: number }[]
  >([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  const findMatches = useCallback(
    (query: string): { start: number; end: number }[] => {
      if (!query) return [];

      const matches: { start: number; end: number }[] = [];
      const lowerContent = content.toLowerCase();
      const lowerQuery = query.toLowerCase();
      let index = 0;

      while ((index = lowerContent.indexOf(lowerQuery, index)) !== -1) {
        matches.push({ start: index, end: index + query.length });
        index += query.length;
      }

      return matches;
    },
    [content],
  );

  const highlightMatch = useCallback(
    (matchIndex: number) => {
      if (
        !editorViewRef.current ||
        matchIndex < 0 ||
        matchIndex >= searchMatches.length
      )
        return;

      const match = searchMatches[matchIndex];
      const view = editorViewRef.current;

      view.dispatch({
        selection: EditorSelection.single(match.start, match.end),
        scrollIntoView: true,
      });

      view.focus();
    },
    [editorViewRef, searchMatches],
  );

  const resetFindState = useCallback(() => {
    setFindBarOpen(false);
    setSearchMatches([]);
    setCurrentMatchIndex(-1);
  }, []);

  const closeFindBar = useCallback(() => {
    setFindBarOpen(false);
  }, []);

  const handleOpenFind = useCallback(() => {
    let initialQuery = "";
    if (editorViewRef.current) {
      const selection = editorViewRef.current.state.selection.main;
      if (selection.from !== selection.to) {
        initialQuery = editorViewRef.current.state.doc.sliceString(
          selection.from,
          selection.to,
        );
      }
    }

    setFindBarOpen(true);

    if (initialQuery) {
      const matches = findMatches(initialQuery);
      setSearchMatches(matches);
      if (matches.length > 0) {
        setCurrentMatchIndex(0);
        setTimeout(() => highlightMatch(0), 0);
      }
    }
  }, [editorViewRef, findMatches, highlightMatch]);

  const handleFindNext = useCallback(
    (query: string) => {
      const matches = findMatches(query);
      setSearchMatches(matches);

      if (matches.length === 0) {
        setCurrentMatchIndex(-1);
        return;
      }

      const nextIndex =
        currentMatchIndex < matches.length - 1 ? currentMatchIndex + 1 : 0;
      setCurrentMatchIndex(nextIndex);
      highlightMatch(nextIndex);
    },
    [findMatches, highlightMatch, currentMatchIndex],
  );

  const handleFindPrevious = useCallback(
    (query: string) => {
      const matches = findMatches(query);
      setSearchMatches(matches);

      if (matches.length === 0) {
        setCurrentMatchIndex(-1);
        return;
      }

      const prevIndex =
        currentMatchIndex > 0 ? currentMatchIndex - 1 : matches.length - 1;
      setCurrentMatchIndex(prevIndex);
      highlightMatch(prevIndex);
    },
    [findMatches, highlightMatch, currentMatchIndex],
  );

  const handleReplace = useCallback(
    (query: string, replacement: string) => {
      if (currentMatchIndex < 0 || currentMatchIndex >= searchMatches.length)
        return;

      const match = searchMatches[currentMatchIndex];
      const newContent =
        content.substring(0, match.start) +
        replacement +
        content.substring(match.end);

      setContent(newContent);
      if (onContentModified) {
        onContentModified();
      }

      setTimeout(() => {
        const matches = findMatches(query);
        setSearchMatches(matches);
        if (matches.length > 0) {
          const nextIndex =
            currentMatchIndex < matches.length ? currentMatchIndex : 0;
          setCurrentMatchIndex(nextIndex);
          highlightMatch(nextIndex);
        } else {
          setCurrentMatchIndex(-1);
        }
      }, 0);
    },
    [
      content,
      searchMatches,
      currentMatchIndex,
      findMatches,
      highlightMatch,
      setContent,
      onContentModified,
    ],
  );

  const handleReplaceAll = useCallback(
    (query: string, replacement: string) => {
      if (!query) return;

      const regex = new RegExp(
        query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "gi",
      );
      const newContent = content.replace(regex, replacement);

      setContent(newContent);
      if (onContentModified) {
        onContentModified();
      }
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
    },
    [content, setContent, onContentModified],
  );

  return {
    findBarOpen,
    searchMatches,
    currentMatchIndex,
    closeFindBar,
    resetFindState,
    handleOpenFind,
    handleFindNext,
    handleFindPrevious,
    handleReplace,
    handleReplaceAll,
  };
};

export type UseEditorGlobalShortcutsOptions = {
  onSave?: () => void;
  onOpenFind?: () => void;
  enableSaveShortcut?: boolean;
};

export const useEditorGlobalShortcuts = ({
  onSave,
  onOpenFind,
  enableSaveShortcut = false,
}: UseEditorGlobalShortcutsOptions) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) {
        return;
      }

      if (enableSaveShortcut && (e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        onSave?.();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "f" && !e.shiftKey) {
        e.preventDefault();
        onOpenFind?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enableSaveShortcut, onSave, onOpenFind]);
};

export const useEditorKeymap = (onSave: () => void) =>
  useMemo(
    () =>
      keymap.of([
        {
          key: "Mod-s",
          run: () => {
            onSave();
            return true;
          },
        },
        {
          key: "Ctrl-Enter",
          run: (view: EditorView) => {
            const { from } = view.state.selection.main;
            view.dispatch({
              changes: { from, insert: "\r" },
              selection: { anchor: from + 1 },
            });
            return true;
          },
        },
      ]),
    [onSave],
  );
