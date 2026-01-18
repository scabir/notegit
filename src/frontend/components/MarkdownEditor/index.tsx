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
import { FindReplaceBar } from '../FindReplaceBar';
import { MermaidDiagram } from '../MermaidDiagram';
import type { AppSettings } from '../../../shared/types';
import { MARKDOWN_EDITOR_TEXT, MARKDOWN_INSERT_DEFAULTS, MARKDOWN_INSERT_TOKENS } from './constants';
import {
  emptyStateSx,
  rootSx,
  headerToolbarSx,
  headerRowSx,
  splitIconRowSx,
  formatToolbarSx,
  editorContainerSx,
  editorPaneSx,
  previewPaneSx,
  splitterSx,
  previewPaperSx,
} from './styles';
import type { MarkdownEditorProps, ViewMode } from './types';

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
      if (e.defaultPrevented) {
        return;
      }

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

  const formatBold = () => insertMarkdown(
    MARKDOWN_INSERT_TOKENS.bold[0],
    MARKDOWN_INSERT_TOKENS.bold[1],
    MARKDOWN_INSERT_DEFAULTS.bold,
  );
  const formatItalic = () => insertMarkdown(
    MARKDOWN_INSERT_TOKENS.italic[0],
    MARKDOWN_INSERT_TOKENS.italic[1],
    MARKDOWN_INSERT_DEFAULTS.italic,
  );
  const formatCode = () => insertMarkdown(
    MARKDOWN_INSERT_TOKENS.code[0],
    MARKDOWN_INSERT_TOKENS.code[1],
    MARKDOWN_INSERT_DEFAULTS.code,
  );
  const formatCodeBlock = () => insertMarkdown(
    MARKDOWN_INSERT_TOKENS.codeBlock[0],
    MARKDOWN_INSERT_TOKENS.codeBlock[1],
    MARKDOWN_INSERT_DEFAULTS.codeBlock,
  );
  const formatHeading = () => insertMarkdown(
    MARKDOWN_INSERT_TOKENS.heading[0],
    MARKDOWN_INSERT_TOKENS.heading[1],
    MARKDOWN_INSERT_DEFAULTS.heading,
  );
  const formatQuote = () => insertMarkdown(
    MARKDOWN_INSERT_TOKENS.quote[0],
    MARKDOWN_INSERT_TOKENS.quote[1],
    MARKDOWN_INSERT_DEFAULTS.quote,
  );
  const formatBulletList = () => insertMarkdown(
    MARKDOWN_INSERT_TOKENS.bullet[0],
    MARKDOWN_INSERT_TOKENS.bullet[1],
    MARKDOWN_INSERT_DEFAULTS.listItem,
  );
  const formatNumberedList = () => insertMarkdown(
    MARKDOWN_INSERT_TOKENS.numbered[0],
    MARKDOWN_INSERT_TOKENS.numbered[1],
    MARKDOWN_INSERT_DEFAULTS.listItem,
  );
  const formatLink = () => insertMarkdown(
    MARKDOWN_INSERT_TOKENS.link[0],
    MARKDOWN_INSERT_TOKENS.link[1],
    MARKDOWN_INSERT_DEFAULTS.linkText,
  );

  const customKeymap = keymap.of([
    {
      key: 'Mod-s',
      run: () => {
        handleSave();
        return true;
      },
    },
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
      <Box sx={emptyStateSx}>
        {MARKDOWN_EDITOR_TEXT.emptyState}
      </Box>
    );
  }

  const showEditor = viewMode === 'split' || viewMode === 'editor';
  const showPreview = viewMode === 'split' || viewMode === 'preview';

  return (
    <Box sx={rootSx}>
      <Toolbar variant="dense" sx={headerToolbarSx}>
        <Box sx={headerRowSx}>
          <span>{file.path}</span>
          {hasUnsavedChanges && (
            <Chip
              icon={<UnsavedIcon fontSize="small" />}
              label={MARKDOWN_EDITOR_TEXT.unsaved}
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
            <Tooltip title={MARKDOWN_EDITOR_TEXT.editorOnlyTooltip}>
              <PreviewOffIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="split" aria-label="split view">
            <Tooltip title={MARKDOWN_EDITOR_TEXT.splitViewTooltip}>
              <Box sx={splitIconRowSx}>
                <PreviewOffIcon fontSize="small" />
                <PreviewIcon fontSize="small" />
              </Box>
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="preview" aria-label="preview only">
            <Tooltip title={MARKDOWN_EDITOR_TEXT.previewOnlyTooltip}>
              <PreviewIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        <Tooltip title={MARKDOWN_EDITOR_TEXT.saveTooltip}>
          <IconButton
            size="small"
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            color="primary"
          >
            <SaveIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={MARKDOWN_EDITOR_TEXT.exportTooltip}>
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
        <Toolbar variant="dense" sx={formatToolbarSx}>
          <Tooltip title={MARKDOWN_EDITOR_TEXT.boldTooltip}>
            <IconButton size="small" onClick={formatBold}>
              <BoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={MARKDOWN_EDITOR_TEXT.italicTooltip}>
            <IconButton size="small" onClick={formatItalic}>
              <ItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={MARKDOWN_EDITOR_TEXT.headingTooltip}>
            <IconButton size="small" onClick={formatHeading}>
              <HeadingIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title={MARKDOWN_EDITOR_TEXT.bulletTooltip}>
            <IconButton size="small" onClick={formatBulletList}>
              <ListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={MARKDOWN_EDITOR_TEXT.numberedTooltip}>
            <IconButton size="small" onClick={formatNumberedList}>
              <NumberedListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={MARKDOWN_EDITOR_TEXT.quoteTooltip}>
            <IconButton size="small" onClick={formatQuote}>
              <QuoteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title={MARKDOWN_EDITOR_TEXT.inlineCodeTooltip}>
            <IconButton size="small" onClick={formatCode}>
              <CodeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={MARKDOWN_EDITOR_TEXT.codeBlockTooltip}>
            <IconButton size="small" onClick={formatCodeBlock}>
              <Box sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{'{ }'}</Box>
            </IconButton>
          </Tooltip>
          <Tooltip title={MARKDOWN_EDITOR_TEXT.linkTooltip}>
            <IconButton size="small" onClick={formatLink}>
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      )}

      <Box 
        id="editor-container"
        sx={editorContainerSx}
      >
        {showEditor && (
          <Box 
            sx={editorPaneSx(isDark, viewMode, editorWidth)}
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
            sx={splitterSx(isDark)}
          />
        )}

        {showPreview && (
          <Box
            sx={previewPaneSx(isDark, viewMode, editorWidth)}
          >
            <Paper 
              sx={previewPaperSx(isDark)}
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
                  code: ({ inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    if (!inline && match?.[1] === 'mermaid') {
                      const diagramCode = String(children).replace(/\n$/, '');
                      return <MermaidDiagram code={diagramCode} isDark={isDark} />;
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
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
