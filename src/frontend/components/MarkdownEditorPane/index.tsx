import React from 'react';
import { Box } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { MARKDOWN_EDITOR_PANE } from './constants';
import { editorPaneSx } from './styles';
import type { MarkdownEditorPaneProps } from './types';

export function MarkdownEditorPane({
  isDark,
  viewMode,
  editorWidth,
  content,
  onChange,
  editorRef,
  editorKeymap,
  appSettings,
}: MarkdownEditorPaneProps) {
  return (
    <Box sx={editorPaneSx(isDark, viewMode, editorWidth)}>
      <CodeMirror
        ref={editorRef}
        data-testid={MARKDOWN_EDITOR_PANE.testId}
        value={content}
        height="100%"
        extensions={[
          markdown(),
          EditorView.lineWrapping,
          editorKeymap,
        ]}
        onChange={onChange}
        theme={isDark ? githubDark : githubLight}
        basicSetup={{
          lineNumbers: appSettings?.editorPrefs.lineNumbers ?? true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
        }}
      />
    </Box>
  );
}
