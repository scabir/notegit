import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Toolbar, IconButton, Chip, Tooltip, Typography, useTheme } from '@mui/material';
import { Save as SaveIcon, FileDownload as ExportIcon } from '@mui/icons-material';
import CodeMirror from '@uiw/react-codemirror';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { EditorView, keymap } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import { FindReplaceBar } from './FindReplaceBar';
import type { FileContent, AppSettings } from '../../shared/types';

interface TextEditorProps {
  file: FileContent | null;
  onSave: (content: string) => void;
  onChange: (content: string, hasChanges: boolean) => void;
}

export function TextEditor({ file, onSave, onChange }: TextEditorProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const editorRef = useRef<any>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  
  // Find and replace state
  const [findBarOpen, setFindBarOpen] = useState(false);
  const [searchMatches, setSearchMatches] = useState<{ start: number; end: number }[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  // Load app settings for editor preferences
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

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
      // Clear find state when file changes
      setFindBarOpen(false);
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
    }
  }, [file]);

  // Notify parent of content changes
  useEffect(() => {
    onChange(content, hasChanges);
  }, [content, hasChanges]);

  // Capture editor view reference
  useEffect(() => {
    if (editorRef.current && editorRef.current.view) {
      editorViewRef.current = editorRef.current.view;
    }
  }, [editorRef.current]);

  const handleSave = () => {
    if (file && hasChanges) {
      onSave(content);
      setHasChanges(false);
    }
  };

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

  // Find and replace functions
  const findMatches = useCallback((query: string): { start: number; end: number }[] => {
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
  }, [content]);

  const highlightMatch = useCallback((matchIndex: number) => {
    if (!editorViewRef.current || matchIndex < 0 || matchIndex >= searchMatches.length) return;
    
    const match = searchMatches[matchIndex];
    const view = editorViewRef.current;
    
    // Scroll to and select the match
    view.dispatch({
      selection: EditorSelection.single(match.start, match.end),
      scrollIntoView: true,
    });
    
    view.focus();
  }, [searchMatches]);

  const handleOpenFind = useCallback(() => {
    // Get current selection to pre-fill find input
    let initialQuery = '';
    if (editorViewRef.current) {
      const selection = editorViewRef.current.state.selection.main;
      if (selection.from !== selection.to) {
        initialQuery = editorViewRef.current.state.doc.sliceString(selection.from, selection.to);
      }
    }
    
    setFindBarOpen(true);
    
    // If there's an initial query, find matches immediately
    if (initialQuery) {
      const matches = findMatches(initialQuery);
      setSearchMatches(matches);
      if (matches.length > 0) {
        setCurrentMatchIndex(0);
        setTimeout(() => highlightMatch(0), 0);
      }
    }
  }, [findMatches, highlightMatch]);

  const handleFindNext = useCallback((query: string) => {
    const matches = findMatches(query);
    setSearchMatches(matches);
    
    if (matches.length === 0) {
      setCurrentMatchIndex(-1);
      return;
    }
    
    const nextIndex = currentMatchIndex < matches.length - 1 ? currentMatchIndex + 1 : 0;
    setCurrentMatchIndex(nextIndex);
    highlightMatch(nextIndex);
  }, [findMatches, highlightMatch, currentMatchIndex]);

  const handleFindPrevious = useCallback((query: string) => {
    const matches = findMatches(query);
    setSearchMatches(matches);
    
    if (matches.length === 0) {
      setCurrentMatchIndex(-1);
      return;
    }
    
    const prevIndex = currentMatchIndex > 0 ? currentMatchIndex - 1 : matches.length - 1;
    setCurrentMatchIndex(prevIndex);
    highlightMatch(prevIndex);
  }, [findMatches, highlightMatch, currentMatchIndex]);

  const handleReplace = useCallback((query: string, replacement: string) => {
    if (currentMatchIndex < 0 || currentMatchIndex >= searchMatches.length) return;
    
    const match = searchMatches[currentMatchIndex];
    const newContent = content.substring(0, match.start) + replacement + content.substring(match.end);
    
    setContent(newContent);
    setHasChanges(true);
    
    // Find next match after replacement
    setTimeout(() => {
      const matches = findMatches(query);
      setSearchMatches(matches);
      if (matches.length > 0) {
        const nextIndex = currentMatchIndex < matches.length ? currentMatchIndex : 0;
        setCurrentMatchIndex(nextIndex);
        highlightMatch(nextIndex);
      } else {
        setCurrentMatchIndex(-1);
      }
    }, 0);
  }, [content, searchMatches, currentMatchIndex, findMatches, highlightMatch]);

  const handleReplaceAll = useCallback((query: string, replacement: string) => {
    if (!query) return;
    
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newContent = content.replace(regex, replacement);
    
    setContent(newContent);
    setHasChanges(true);
    setSearchMatches([]);
    setCurrentMatchIndex(-1);
  }, [content]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+F to open find
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        handleOpenFind();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpenFind]);

  // Custom keymap for Ctrl+Enter
  const customKeymap = keymap.of([
    {
      key: 'Ctrl-Enter',
      run: (view) => {
        const { from } = view.state.selection.main;
        view.dispatch({
          changes: { from, insert: '\r' },
          selection: { anchor: from + 1 }
        });
        return true;
      }
    }
  ]);

  const handleChange = (value: string) => {
    setContent(value);
    setHasChanges(value !== file?.content);
  };

  if (!file) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        Select a file to edit
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Toolbar
        variant="dense"
        sx={{
          minHeight: '48px',
          borderBottom: 1,
          borderColor: 'divider',
          gap: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          {file.path}
        </Typography>

        {hasChanges && (
          <Chip label="Modified" size="small" color="warning" sx={{ height: 24 }} />
        )}

        <Tooltip title="Save to disk">
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

        <Tooltip title="Export Note">
          <IconButton
            size="small"
            onClick={handleExport}
            color="default"
          >
            <ExportIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Toolbar>

      {/* Find and Replace Bar */}
      {findBarOpen && (
        <FindReplaceBar
          onClose={() => setFindBarOpen(false)}
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

      {/* Editor */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          bgcolor: isDark ? '#0d1117' : '#fff',
        }}
      >
        <CodeMirror
          ref={editorRef}
          value={content}
          height="100%"
          extensions={[
            EditorView.lineWrapping,
            customKeymap,
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

