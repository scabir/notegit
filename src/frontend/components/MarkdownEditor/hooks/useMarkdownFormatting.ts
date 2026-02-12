import { useCallback, useMemo } from 'react';
import type { RefObject } from 'react';
import { MARKDOWN_INSERT_DEFAULTS, MARKDOWN_INSERT_TOKENS } from '../constants';
import type { MarkdownFormatters } from '../types';

type UseMarkdownFormattingParams = {
  editorRef: RefObject<any>;
};

export function useMarkdownFormatting({ editorRef }: UseMarkdownFormattingParams): MarkdownFormatters {
  const insertMarkdown = useCallback(
    (before: string, after = '', defaultText = '') => {
      const view = editorRef.current?.view;
      if (!view) return;

      const selection = view.state.selection.main;
      const selectedText = view.state.doc.sliceString(selection.from, selection.to);
      const textToInsert = selectedText || defaultText;
      const replacement = before + textToInsert + after;

      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: replacement },
        selection: {
          anchor: selection.from + before.length,
          head: selection.from + before.length + textToInsert.length,
        },
      });

      view.focus();
    },
    [editorRef]
  );

  const formatBold = useCallback(
    () =>
      insertMarkdown(
        MARKDOWN_INSERT_TOKENS.bold[0],
        MARKDOWN_INSERT_TOKENS.bold[1],
        MARKDOWN_INSERT_DEFAULTS.bold
      ),
    [insertMarkdown]
  );

  const formatItalic = useCallback(
    () =>
      insertMarkdown(
        MARKDOWN_INSERT_TOKENS.italic[0],
        MARKDOWN_INSERT_TOKENS.italic[1],
        MARKDOWN_INSERT_DEFAULTS.italic
      ),
    [insertMarkdown]
  );

  const formatCode = useCallback(
    () =>
      insertMarkdown(
        MARKDOWN_INSERT_TOKENS.code[0],
        MARKDOWN_INSERT_TOKENS.code[1],
        MARKDOWN_INSERT_DEFAULTS.code
      ),
    [insertMarkdown]
  );

  const formatCodeBlock = useCallback(
    () =>
      insertMarkdown(
        MARKDOWN_INSERT_TOKENS.codeBlock[0],
        MARKDOWN_INSERT_TOKENS.codeBlock[1],
        MARKDOWN_INSERT_DEFAULTS.codeBlock
      ),
    [insertMarkdown]
  );

  const formatHeading = useCallback(
    () =>
      insertMarkdown(
        MARKDOWN_INSERT_TOKENS.heading[0],
        MARKDOWN_INSERT_TOKENS.heading[1],
        MARKDOWN_INSERT_DEFAULTS.heading
      ),
    [insertMarkdown]
  );

  const formatQuote = useCallback(
    () =>
      insertMarkdown(
        MARKDOWN_INSERT_TOKENS.quote[0],
        MARKDOWN_INSERT_TOKENS.quote[1],
        MARKDOWN_INSERT_DEFAULTS.quote
      ),
    [insertMarkdown]
  );

  const formatBulletList = useCallback(
    () =>
      insertMarkdown(
        MARKDOWN_INSERT_TOKENS.bullet[0],
        MARKDOWN_INSERT_TOKENS.bullet[1],
        MARKDOWN_INSERT_DEFAULTS.listItem
      ),
    [insertMarkdown]
  );

  const formatNumberedList = useCallback(
    () =>
      insertMarkdown(
        MARKDOWN_INSERT_TOKENS.numbered[0],
        MARKDOWN_INSERT_TOKENS.numbered[1],
        MARKDOWN_INSERT_DEFAULTS.listItem
      ),
    [insertMarkdown]
  );

  const formatLink = useCallback(
    () =>
      insertMarkdown(
        MARKDOWN_INSERT_TOKENS.link[0],
        MARKDOWN_INSERT_TOKENS.link[1],
        MARKDOWN_INSERT_DEFAULTS.linkText
      ),
    [insertMarkdown]
  );

  const formatTable = useCallback(
    () =>
      insertMarkdown(
        MARKDOWN_INSERT_TOKENS.table[0],
        MARKDOWN_INSERT_TOKENS.table[1],
        MARKDOWN_INSERT_DEFAULTS.table
      ),
    [insertMarkdown]
  );

  const formatTaskList = useCallback(() => {
    const view = editorRef.current?.view;
    if (!view) return;

    const selection = view.state.selection.main;
    const selectedText = view.state.doc.sliceString(selection.from, selection.to);
    const taskLabel = MARKDOWN_INSERT_DEFAULTS.taskList;
    const uncheckedRegex = /^\s*-\s\[\s\]\s?/;
    const doneRegex = /^\s*-\s\[[xX]\]\s?/;

    if (!selectedText) {
      const line = view.state.doc.lineAt(selection.from);
      const atLineStart = selection.from === line.from;
      const prefix = atLineStart ? '' : '\n';
      const insertText = `${prefix}- [ ] ${taskLabel}`;
      const cursorStart = selection.from + prefix.length + '- [ ] '.length;
      const cursorEnd = cursorStart + taskLabel.length;

      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: insertText },
        selection: { anchor: cursorStart, head: cursorEnd },
      });
      view.focus();
      return;
    }

    const lines = selectedText.split('\n');
    const allTasks = lines.every((line: string) => uncheckedRegex.test(line) || doneRegex.test(line));
    const anyDone = lines.some((line: string) => doneRegex.test(line));

    if (allTasks && !anyDone) {
      const replacement = lines.map((line: string) => line.replace(uncheckedRegex, '')).join('\n');
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: replacement },
        selection: { anchor: selection.from, head: selection.from + replacement.length },
      });
      view.focus();
      return;
    }

    if (allTasks && anyDone) {
      view.focus();
      return;
    }

    const replacement = lines
      .map((line: string) => {
        if (uncheckedRegex.test(line) || doneRegex.test(line)) {
          return line;
        }
        const lineContent = line.trim() || taskLabel;
        return `- [ ] ${lineContent}`;
      })
      .join('\n');

    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: replacement },
      selection: { anchor: selection.from, head: selection.from + replacement.length },
    });
    view.focus();
  }, [editorRef]);

  const formatHighlight = useCallback(
    () =>
      insertMarkdown(
        MARKDOWN_INSERT_TOKENS.highlight[0],
        MARKDOWN_INSERT_TOKENS.highlight[1],
        MARKDOWN_INSERT_DEFAULTS.highlight
      ),
    [insertMarkdown]
  );

  const formatDefinitionList = useCallback(
    () =>
      insertMarkdown(
        MARKDOWN_INSERT_TOKENS.definitionList[0],
        MARKDOWN_INSERT_TOKENS.definitionList[1],
        MARKDOWN_INSERT_DEFAULTS.definitionList
      ),
    [insertMarkdown]
  );

  const formatFootnote = useCallback(() => {
    const view = editorRef.current?.view;
    if (!view) return;

    const docText = view.state.doc.toString();
    const footnoteMatches = [...docText.matchAll(/\[\^(\d+)\]/g)];
    const maxId = footnoteMatches.reduce((max, match) => {
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    const nextId = maxId + 1;

    const reference = `[^${nextId}]`;
    const definitionPrefix = `\n\n[^${nextId}]: `;
    const definitionText = MARKDOWN_INSERT_DEFAULTS.footnote;
    const definition = `${definitionPrefix}${definitionText}`;

    const selection = view.state.selection.main;
    const docLength = view.state.doc.length;
    const changes = [
      { from: selection.to, to: selection.to, insert: reference },
      { from: docLength, to: docLength, insert: definition },
    ];

    const footnoteTextStart = docLength + reference.length + definitionPrefix.length;
    const footnoteTextEnd = footnoteTextStart + definitionText.length;

    view.dispatch({
      changes,
      selection: { anchor: footnoteTextStart, head: footnoteTextEnd },
      scrollIntoView: true,
    });

    view.focus();
  }, [editorRef]);

  const formatRawMarkdown = useCallback(
    () =>
      insertMarkdown(
        MARKDOWN_INSERT_TOKENS.rawMarkdown[0],
        MARKDOWN_INSERT_TOKENS.rawMarkdown[1],
        MARKDOWN_INSERT_DEFAULTS.rawMarkdown
      ),
    [insertMarkdown]
  );

  const formatMermaid = useCallback(() => {
    const view = editorRef.current?.view;
    if (!view) return;

    const selection = view.state.selection.main;
    const mermaidBlock = `${MARKDOWN_INSERT_TOKENS.mermaid[0]}${MARKDOWN_INSERT_DEFAULTS.mermaid}${MARKDOWN_INSERT_TOKENS.mermaid[1]}`;
    const cursorStart = selection.from + MARKDOWN_INSERT_TOKENS.mermaid[0].length;
    const cursorEnd = cursorStart + MARKDOWN_INSERT_DEFAULTS.mermaid.length;

    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: mermaidBlock },
      selection: { anchor: cursorStart, head: cursorEnd },
    });

    view.focus();
  }, [editorRef]);

  return useMemo(
    () => ({
      formatBold,
      formatItalic,
      formatHeading,
      formatQuote,
      formatBulletList,
      formatNumberedList,
      formatCode,
      formatCodeBlock,
      formatLink,
      formatTable,
      formatFootnote,
      formatTaskList,
      formatHighlight,
      formatDefinitionList,
      formatMermaid,
      formatRawMarkdown,
    }),
    [
      formatBold,
      formatItalic,
      formatHeading,
      formatQuote,
      formatBulletList,
      formatNumberedList,
      formatCode,
      formatCodeBlock,
      formatLink,
      formatTable,
      formatFootnote,
      formatTaskList,
      formatHighlight,
      formatDefinitionList,
      formatMermaid,
      formatRawMarkdown,
    ]
  );
}
