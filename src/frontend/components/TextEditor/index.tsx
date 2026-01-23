import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Toolbar, IconButton, Chip, Tooltip, Typography, useTheme } from '@mui/material';
import { Save as SaveIcon, FileDownload as ExportIcon } from '@mui/icons-material';
import CodeMirror from '@uiw/react-codemirror';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { EditorView } from '@codemirror/view';
import { FindReplaceBar } from '../FindReplaceBar';
import type { AppSettings } from '../../../shared/types';
import { TEXT_EDITOR_TEXT } from './constants';
import { emptyStateSx, rootSx, toolbarSx, filePathSx, modifiedChipSx, editorContainerSx } from './styles';
import type { TextEditorProps } from './types';
import { useEditorFindReplace, useEditorGlobalShortcuts, useEditorKeymap } from '../../utils/editorHooks';

export function TextEditor({ file, onSave, onChange }: TextEditorProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const editorRef = useRef<any>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const {
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
  } = useEditorFindReplace({
    content,
    setContent,
    editorViewRef,
    onContentModified: () => setHasChanges(true),
  });

  useEffect(() => {
    const loadSettings = async () => {
      const response = await window.notegitApi.config.getAppSettings();
      if (response.ok && response.data) {
        setAppSettings(response.data);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (file) {
      setContent(file.content);
      setHasChanges(false);
      resetFindState();
    }
  }, [file, resetFindState]);

  useEffect(() => {
    onChange(content, hasChanges);
  }, [content, hasChanges]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.view) {
      editorViewRef.current = editorRef.current.view;
    }
  }, [editorRef.current]);

  const handleSave = useCallback(() => {
    if (file && hasChanges) {
      onSave(content);
      setHasChanges(false);
    }
  }, [content, file, hasChanges, onSave]);

  const handleExport = async () => {
    if (!file) return;

    try {
      const response = await window.notegitApi.export.note(file.path, content, 'txt');
      if (response.ok && response.data) {
        console.log('Note exported to:', response.data);
      } else if (response.error?.message !== 'Export cancelled') {
        console.error('Failed to export note:', response.error);
        alert(`Failed to export: ${response.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export note');
    }
  };
  useEditorGlobalShortcuts({ onOpenFind: handleOpenFind });
  const editorKeymap = useEditorKeymap(handleSave);

  const handleChange = (value: string) => {
    setContent(value);
    setHasChanges(value !== file?.content);
  };

  if (!file) {
    return (
      <Box sx={emptyStateSx}>
        {TEXT_EDITOR_TEXT.emptyState}
      </Box>
    );
  }

  return (
    <Box sx={rootSx}>
      <Toolbar
        variant="dense"
        sx={toolbarSx}
      >
        <Typography variant="subtitle2" sx={filePathSx}>
          {file.path}
        </Typography>

        {hasChanges && (
          <Chip label={TEXT_EDITOR_TEXT.modified} size="small" color="warning" sx={modifiedChipSx} />
        )}

        <Tooltip title={TEXT_EDITOR_TEXT.saveTooltip}>
          <span>
            <IconButton
              size="small"
              onClick={handleSave}
              disabled={!hasChanges}
              color={hasChanges ? 'primary' : 'default'}
            >
              <SaveIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={TEXT_EDITOR_TEXT.exportTooltip}>
          <IconButton
            size="small"
            onClick={handleExport}
            color="default"
          >
            <ExportIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Toolbar>

      {findBarOpen && (
        <FindReplaceBar
          onClose={closeFindBar}
          onFindNext={handleFindNext}
          onFindPrevious={handleFindPrevious}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
          matchInfo={
            searchMatches.length > 0
              ? { current: currentMatchIndex + 1, total: searchMatches.length }
              : null
          }
        />
      )}

      <Box
        sx={editorContainerSx(isDark)}
      >
        <CodeMirror
          ref={editorRef}
          value={content}
          height="100%"
          extensions={[
            EditorView.lineWrapping,
            editorKeymap,
          ]}
          theme={isDark ? githubDark : githubLight}
          onChange={handleChange}
          basicSetup={{
            lineNumbers: appSettings?.editorPrefs.lineNumbers ?? true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            dropCursor: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            searchKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
      </Box>
    </Box>
  );
}
