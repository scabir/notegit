import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Paper, Divider, Toolbar, IconButton, Chip, Tooltip, useTheme, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  Save as SaveIcon,
  FiberManualRecord as UnsavedIcon,
  Visibility as PreviewIcon,
  VisibilityOff as PreviewOffIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatListBulleted as ListIcon,
  FormatListNumbered as NumberedListIcon,
  Code as CodeIcon,
  Title as HeadingIcon,
  FormatQuote as QuoteIcon,
  Link as LinkIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EditorView, keymap } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import { FindReplaceBar } from './FindReplaceBar';
import type { FileContent, AppSettings } from '../../shared/types';

interface MarkdownEditorProps {
  file: FileContent | null;
  repoPath: string | null;
  onSave: (content: string) => void;
  onChange: (content: string, hasChanges: boolean) => void;
}

type ViewMode = 'split' | 'editor' | 'preview';

export function MarkdownEditor({ file, repoPath, onSave, onChange }: MarkdownEditorProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [editorWidth, setEditorWidth] = useState(50);
  const editorRef = useRef<any>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const isDraggingRef = useRef(false);
  
  const [findBarOpen, setFindBarOpen] = useState(false);
  const [searchMatches, setSearchMatches] = useState<{ start: number; end: number }[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

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
      setSavedContent(file.content);
      setFindBarOpen(false);
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
    }
  }, [file]);

  const hasUnsavedChanges = content !== savedContent;

  useEffect(() => {
    onChange(content, hasUnsavedChanges);
  }, [content, hasUnsavedChanges]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.view) {
      editorViewRef.current = editorRef.current.view;
    }
  }, [editorRef.current]);

  const handleSave = () => {
    if (hasUnsavedChanges) {
      onSave(content);
      setSavedContent(content);
    }
  };

  const handleExport = async () => {
    if (!file) return;

    try {
      const response = await window.notegitApi.export.note(file.path, content, 'md');
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
    
    view.dispatch({
      selection: EditorSelection.single(match.start, match.end),
      scrollIntoView: true,
    });
    
    view.focus();
  }, [searchMatches]);

  const handleOpenFind = useCallback(() => {
    let initialQuery = '';
    if (editorViewRef.current) {
      const selection = editorViewRef.current.state.selection.main;
      if (selection.from !== selection.to) {
        initialQuery = editorViewRef.current.state.doc.sliceString(selection.from, selection.to);
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
    setSearchMatches([]);
    setCurrentMatchIndex(-1);
  }, [content]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      else if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        handleOpenFind();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, content]);

  const insertMarkdown = useCallback((before: string, after: string = '', defaultText: string = '') => {
    if (!editorRef.current) return;

    const view = editorRef.current.view;
    if (!view) return;

    const selection = view.state.selection.main;
    const selectedText = view.state.doc.sliceString(selection.from, selection.to);
    const textToInsert = selectedText || defaultText;
    const replacement = before + textToInsert + after;

    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: replacement },
      selection: { anchor: selection.from + before.length, head: selection.from + before.length + textToInsert.length }
    });

    view.focus();
  }, []);

  const formatBold = () => insertMarkdown('**', '**', 'bold text');
  const formatItalic = () => insertMarkdown('*', '*', 'italic text');
  const formatCode = () => insertMarkdown('`', '`', 'code');
  const formatCodeBlock = () => insertMarkdown('\n```\n', '\n```\n', 'code block');
  const formatHeading = () => insertMarkdown('## ', '', 'Heading');
  const formatQuote = () => insertMarkdown('> ', '', 'quote');
  const formatBulletList = () => insertMarkdown('- ', '', 'list item');
  const formatNumberedList = () => insertMarkdown('1. ', '', 'list item');
  const formatLink = () => insertMarkdown('[', '](url)', 'link text');

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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const container = document.getElementById('editor-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      if (newWidth >= 20 && newWidth <= 80) {
        setEditorWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!file) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'text.secondary',
        }}
      >
        Select a file to edit
      </Box>
    );
  }

  const showEditor = viewMode === 'split' || viewMode === 'editor';
  const showPreview = viewMode === 'split' || viewMode === 'preview';

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider', gap: 1, minHeight: '48px' }}>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <span>{file.path}</span>
          {hasUnsavedChanges && (
            <Chip
              icon={<UnsavedIcon fontSize="small" />}
              label="Unsaved changes"
              size="small"
              color="warning"
            />
          )}
        </Box>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newMode) => newMode && setViewMode(newMode)}
          size="small"
        >
          <ToggleButton value="editor" aria-label="editor only">
            <Tooltip title="Editor Only">
              <PreviewOffIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="split" aria-label="split view">
            <Tooltip title="Split View">
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <PreviewOffIcon fontSize="small" />
                <PreviewIcon fontSize="small" />
              </Box>
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="preview" aria-label="preview only">
            <Tooltip title="Preview Only">
              <PreviewIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        <Tooltip title="Save (Cmd/Ctrl+S)">
          <IconButton
            size="small"
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            color="primary"
          >
            <SaveIcon fontSize="small" />
          </IconButton>
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

      {showEditor && (
        <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider', minHeight: '40px', gap: 0.5 }}>
          <Tooltip title="Bold (Ctrl+B)">
            <IconButton size="small" onClick={formatBold}>
              <BoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic (Ctrl+I)">
            <IconButton size="small" onClick={formatItalic}>
              <ItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Heading">
            <IconButton size="small" onClick={formatHeading}>
              <HeadingIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Bullet List">
            <IconButton size="small" onClick={formatBulletList}>
              <ListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Numbered List">
            <IconButton size="small" onClick={formatNumberedList}>
              <NumberedListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Quote">
            <IconButton size="small" onClick={formatQuote}>
              <QuoteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Inline Code">
            <IconButton size="small" onClick={formatCode}>
              <CodeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Code Block">
            <IconButton size="small" onClick={formatCodeBlock}>
              <Box sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{'{ }'}</Box>
            </IconButton>
          </Tooltip>
          <Tooltip title="Link">
            <IconButton size="small" onClick={formatLink}>
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      )}

      <Box 
        id="editor-container"
        sx={{ 
          display: 'flex', 
          flexGrow: 1, 
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {showEditor && (
          <Box 
            sx={{ 
              width: viewMode === 'split' ? `${editorWidth}%` : '100%',
              overflow: 'auto',
              bgcolor: isDark ? '#0d1117' : '#fff',
              transition: viewMode === 'split' ? 'none' : 'width 0.3s ease',
            }}
          >
            <CodeMirror
              ref={editorRef}
              value={content}
              height="100%"
              extensions={[
                markdown(),
                EditorView.lineWrapping,
                customKeymap,
              ]}
              onChange={(value) => setContent(value)}
              theme={isDark ? githubDark : githubLight}
              basicSetup={{
                lineNumbers: appSettings?.editorPrefs.lineNumbers ?? true,
                highlightActiveLineGutter: true,
                highlightActiveLine: true,
                foldGutter: true,
              }}
            />
          </Box>
        )}

        {viewMode === 'split' && (
          <Box
            onMouseDown={handleMouseDown}
            sx={{
              width: '4px',
              cursor: 'col-resize',
              bgcolor: isDark ? '#30363d' : '#e0e0e0',
              '&:hover': {
                bgcolor: isDark ? '#58a6ff' : '#1976d2',
              },
              transition: 'background-color 0.2s',
              position: 'relative',
              zIndex: 1,
            }}
          />
        )}

        {showPreview && (
          <Box
            sx={{
              width: viewMode === 'split' ? `${100 - editorWidth}%` : '100%',
              overflow: 'auto',
              p: 2,
              bgcolor: isDark ? '#0d1117' : 'background.paper',
              color: isDark ? '#c9d1d9' : 'text.primary',
              transition: viewMode === 'split' ? 'none' : 'width 0.3s ease',
            }}
          >
            <Paper 
              sx={{ 
                p: 3, 
                bgcolor: 'transparent',
                color: 'inherit',
                '& code': {
                  bgcolor: isDark ? 'rgba(110, 118, 129, 0.4)' : 'rgba(175, 184, 193, 0.2)',
                  padding: '0.2em 0.4em',
                  borderRadius: '6px',
                  fontSize: '85%',
                },
                '& pre': {
                  bgcolor: isDark ? 'rgba(110, 118, 129, 0.2)' : '#f6f8fa',
                  padding: '16px',
                  borderRadius: '6px',
                  overflow: 'auto',
                },
                '& pre code': {
                  bgcolor: 'transparent',
                  padding: 0,
                },
                '& a': {
                  color: isDark ? '#58a6ff' : '#0969da',
                },
                '& blockquote': {
                  borderLeft: `4px solid ${isDark ? '#3b434b' : '#d0d7de'}`,
                  paddingLeft: '16px',
                  color: isDark ? '#8b949e' : '#57606a',
                },
                '& h1, & h2, & h3, & h4, & h5, & h6': {
                  marginTop: '24px',
                  marginBottom: '16px',
                  fontWeight: 600,
                  lineHeight: 1.25,
                },
                '& p': {
                  marginTop: 0,
                  marginBottom: '16px',
                },
                '& ul, & ol': {
                  paddingLeft: '2em',
                  marginTop: 0,
                  marginBottom: '16px',
                },
              }} 
              elevation={0}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  img: ({ node, ...props }) => {
                    let src = props.src || '';
                    if (repoPath && src && !src.startsWith('http') && !src.startsWith('data:')) {
                      src = `file://${repoPath}/${src}`;
                    }
                    return (
                      <img
                        {...props}
                        src={src}
                        style={{ maxWidth: '100%', height: 'auto' }}
                        alt={props.alt || ''}
                      />
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}
