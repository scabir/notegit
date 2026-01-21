import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Paper, Divider, Toolbar, IconButton, Chip, Tooltip, useTheme, ToggleButtonGroup, ToggleButton, Menu, MenuItem, Typography } from '@mui/material';
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
  TableChart as TableIcon,
  Notes as FootnoteIcon,
  Checklist as TaskListIcon,
  Highlight as HighlightIcon,
  ListAlt as DefinitionListIcon,
  FileDownload as ExportIcon,
  MoreHoriz as MoreIcon,
  MenuBook as CheatSheetIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDeflist from 'remark-deflist';
import { EditorView, keymap } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import { FindReplaceBar } from '../FindReplaceBar';
import { MermaidDiagram } from '../MermaidDiagram';
import type { AppSettings } from '../../../shared/types';
import { remarkHighlight } from '../../utils/remarkHighlight';
import markdownCheatsheetHtml from '../../assets/cheatsheets/markdown.html?raw';
import mermaidCheatsheetHtml from '../../assets/cheatsheets/mermaid.html?raw';
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
  cheatSheetHeaderSx,
  cheatSheetContentSx,
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
  const [extrasAnchorEl, setExtrasAnchorEl] = useState<null | HTMLElement>(null);
  const [cheatSheetAnchorEl, setCheatSheetAnchorEl] = useState<null | HTMLElement>(null);
  const [cheatSheetType, setCheatSheetType] = useState<'markdown' | 'mermaid' | null>(null);

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
  const formatTable = () => insertMarkdown(
    MARKDOWN_INSERT_TOKENS.table[0],
    MARKDOWN_INSERT_TOKENS.table[1],
    MARKDOWN_INSERT_DEFAULTS.table,
  );
  const formatTaskList = useCallback(() => {
    if (!editorRef.current?.view) return;

    const view = editorRef.current.view;
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
    const allTasks = lines.every((line) => uncheckedRegex.test(line) || doneRegex.test(line));
    const anyDone = lines.some((line) => doneRegex.test(line));

    if (allTasks && !anyDone) {
      const stripped = lines.map((line) => line.replace(uncheckedRegex, ''));
      const replacement = stripped.join('\n');

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
      .map((line) => {
        if (uncheckedRegex.test(line) || doneRegex.test(line)) {
          return line;
        }
        const content = line.trim() || taskLabel;
        return `- [ ] ${content}`;
      })
      .join('\n');

    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: replacement },
      selection: { anchor: selection.from, head: selection.from + replacement.length },
    });
    view.focus();
  }, []);
  const formatHighlight = () => insertMarkdown(
    MARKDOWN_INSERT_TOKENS.highlight[0],
    MARKDOWN_INSERT_TOKENS.highlight[1],
    MARKDOWN_INSERT_DEFAULTS.highlight,
  );
  const formatDefinitionList = () => insertMarkdown(
    MARKDOWN_INSERT_TOKENS.definitionList[0],
    MARKDOWN_INSERT_TOKENS.definitionList[1],
    MARKDOWN_INSERT_DEFAULTS.definitionList,
  );
  const formatFootnote = useCallback(() => {
    if (!editorRef.current?.view) return;

    const view = editorRef.current.view;
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
  }, []);
  const formatRawMarkdown = () => insertMarkdown(
    MARKDOWN_INSERT_TOKENS.rawMarkdown[0],
    MARKDOWN_INSERT_TOKENS.rawMarkdown[1],
    MARKDOWN_INSERT_DEFAULTS.rawMarkdown,
  );
  const formatMermaid = useCallback(() => {
    if (!editorRef.current?.view) return;

    const view = editorRef.current.view;
    const selection = view.state.selection.main;
    const mermaidBlock = `${MARKDOWN_INSERT_TOKENS.mermaid[0]}${MARKDOWN_INSERT_DEFAULTS.mermaid}${MARKDOWN_INSERT_TOKENS.mermaid[1]}`;
    const cursorStart = selection.from + MARKDOWN_INSERT_TOKENS.mermaid[0].length;
    const cursorEnd = cursorStart + MARKDOWN_INSERT_DEFAULTS.mermaid.length;

    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: mermaidBlock },
      selection: { anchor: cursorStart, head: cursorEnd },
    });

    view.focus();
  }, []);

  const handleOpenExtras = (event: React.MouseEvent<HTMLElement>) => {
    setExtrasAnchorEl(event.currentTarget);
  };

  const handleCloseExtras = () => {
    setExtrasAnchorEl(null);
  };

  const handleInsertMermaid = () => {
    handleCloseExtras();
    formatMermaid();
  };
  const handleInsertRawMarkdown = () => {
    handleCloseExtras();
    formatRawMarkdown();
  };
  const handleOpenCheatSheetMenu = (event: React.MouseEvent<HTMLElement>) => {
    setCheatSheetAnchorEl(event.currentTarget);
  };

  const handleCloseCheatSheetMenu = () => {
    setCheatSheetAnchorEl(null);
  };

  const handleSelectCheatSheet = (type: 'markdown' | 'mermaid') => {
    handleCloseCheatSheetMenu();
    setCheatSheetType(type);
    setViewMode('split');
  };

  const handleCloseCheatSheet = () => {
    setCheatSheetType(null);
  };

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
  const activeCheatSheetHtml = cheatSheetType === 'markdown'
    ? markdownCheatsheetHtml
    : cheatSheetType === 'mermaid'
      ? mermaidCheatsheetHtml
      : null;
  const activeCheatSheetLabel = cheatSheetType === 'markdown'
    ? MARKDOWN_EDITOR_TEXT.markdownCheatsheetLabel
    : cheatSheetType === 'mermaid'
      ? MARKDOWN_EDITOR_TEXT.mermaidCheatsheetLabel
      : '';
  const cheatSheets = [
    { key: 'markdown' as const, label: MARKDOWN_EDITOR_TEXT.markdownCheatsheetLabel },
    { key: 'mermaid' as const, label: MARKDOWN_EDITOR_TEXT.mermaidCheatsheetLabel },
  ];

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
          <Tooltip title={MARKDOWN_EDITOR_TEXT.tableTooltip}>
            <IconButton size="small" onClick={formatTable}>
              <TableIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={MARKDOWN_EDITOR_TEXT.footnoteLabel}>
            <IconButton size="small" onClick={formatFootnote}>
              <FootnoteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={MARKDOWN_EDITOR_TEXT.taskListLabel}>
            <IconButton size="small" onClick={formatTaskList}>
              <TaskListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={MARKDOWN_EDITOR_TEXT.highlightLabel}>
            <IconButton size="small" onClick={formatHighlight}>
              <HighlightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={MARKDOWN_EDITOR_TEXT.definitionListLabel}>
            <IconButton size="small" onClick={formatDefinitionList}>
              <DefinitionListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title={MARKDOWN_EDITOR_TEXT.extrasTooltip}>
            <IconButton
              size="small"
              onClick={handleOpenExtras}
              aria-label={MARKDOWN_EDITOR_TEXT.extrasTooltip}
              aria-haspopup="true"
              aria-controls={extrasAnchorEl ? 'markdown-extras-menu' : undefined}
              aria-expanded={extrasAnchorEl ? 'true' : undefined}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={MARKDOWN_EDITOR_TEXT.cheatsheetTooltip}>
            <IconButton
              size="small"
              onClick={handleOpenCheatSheetMenu}
              aria-label={MARKDOWN_EDITOR_TEXT.cheatsheetTooltip}
              aria-haspopup="true"
              aria-controls={cheatSheetAnchorEl ? 'markdown-cheatsheet-menu' : undefined}
              aria-expanded={cheatSheetAnchorEl ? 'true' : undefined}
            >
              <CheatSheetIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu
            id="markdown-extras-menu"
            anchorEl={extrasAnchorEl}
            open={Boolean(extrasAnchorEl)}
            onClose={handleCloseExtras}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleInsertMermaid}>
              {MARKDOWN_EDITOR_TEXT.mermaidLabel}
            </MenuItem>
            <MenuItem onClick={handleInsertRawMarkdown}>
              {MARKDOWN_EDITOR_TEXT.rawMarkdownLabel}
            </MenuItem>
          </Menu>
          <Menu
            id="markdown-cheatsheet-menu"
            anchorEl={cheatSheetAnchorEl}
            open={Boolean(cheatSheetAnchorEl)}
            onClose={handleCloseCheatSheetMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {cheatSheets.map((sheet) => (
              <MenuItem
                key={sheet.key}
                onClick={() => handleSelectCheatSheet(sheet.key)}
              >
                {sheet.label}
              </MenuItem>
            ))}
          </Menu>
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
              {activeCheatSheetHtml ? (
                <>
                  <Box sx={cheatSheetHeaderSx}>
                    <Typography variant="subtitle1">
                      {activeCheatSheetLabel}
                    </Typography>
                    <Tooltip title={MARKDOWN_EDITOR_TEXT.closeCheatsheetLabel}>
                      <IconButton size="small" onClick={handleCloseCheatSheet}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box
                    sx={cheatSheetContentSx}
                    dangerouslySetInnerHTML={{ __html: activeCheatSheetHtml }}
                  />
                </>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkDeflist, remarkHighlight]}
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
              )}
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}
