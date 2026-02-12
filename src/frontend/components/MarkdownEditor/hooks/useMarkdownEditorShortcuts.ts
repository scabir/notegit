import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { MarkdownFormatters } from '../types';

type UseMarkdownEditorShortcutsParams = {
  editorRef: RefObject<any>;
  formatters: MarkdownFormatters;
};

export function useMarkdownEditorShortcuts({
  editorRef,
  formatters,
}: UseMarkdownEditorShortcutsParams) {
  const formattersRef = useRef(formatters);

  useEffect(() => {
    formattersRef.current = formatters;
  }, [formatters]);

  useEffect(() => {
    const handleEditorShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      const view = editorRef.current?.view;
      if (!view) {
        return;
      }

      const editorDom = view.dom;
      if (editorDom && event.target instanceof Node && !editorDom.contains(event.target)) {
        return;
      }

      const handlers = formattersRef.current;
      const mod = event.metaKey || event.ctrlKey;
      const shift = event.shiftKey;
      const key = event.key;

      if (!mod) {
        return;
      }

      if (shift && key.toLowerCase() === 't') {
        event.preventDefault();
        handlers.formatTable();
        return;
      }

      if (shift && key.toLowerCase() === 'f') {
        event.preventDefault();
        handlers.formatFootnote();
        return;
      }

      if (shift && key.toLowerCase() === 'l') {
        event.preventDefault();
        handlers.formatTaskList();
        return;
      }

      if (shift && key.toLowerCase() === 'h') {
        event.preventDefault();
        handlers.formatHighlight();
        return;
      }

      if (shift && key.toLowerCase() === 'd') {
        event.preventDefault();
        handlers.formatDefinitionList();
        return;
      }

      if (shift && key.toLowerCase() === 'm') {
        event.preventDefault();
        handlers.formatMermaid();
        return;
      }

      if (key === '{' || key === '}') {
        event.preventDefault();
        handlers.formatCodeBlock();
        return;
      }

      if (!shift && key.toLowerCase() === 'b') {
        event.preventDefault();
        handlers.formatBold();
        return;
      }

      if (!shift && key.toLowerCase() === 't') {
        event.preventDefault();
        handlers.formatItalic();
        return;
      }

      if (!shift && key.toLowerCase() === 'h') {
        event.preventDefault();
        handlers.formatHeading();
        return;
      }

      if (!shift && key === '`') {
        event.preventDefault();
        handlers.formatCode();
        return;
      }

      if (!shift && key.toLowerCase() === 'l') {
        event.preventDefault();
        handlers.formatLink();
      }
    };

    window.addEventListener('keydown', handleEditorShortcut);
    return () => window.removeEventListener('keydown', handleEditorShortcut);
  }, [editorRef]);
}
