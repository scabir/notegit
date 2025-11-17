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
} from '@mui/icons-material';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { FileContent } from '../../shared/types';

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
  const [editorWidth, setEditorWidth] = useState(50); // Percentage
  const editorRef = useRef<any>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (file) {
      setContent(file.content);
      setSavedContent(file.content);
    }
  }, [file]);

  const hasUnsavedChanges = content !== savedContent;

  // Notify parent of content changes
  useEffect(() => {
    onChange(content, hasUnsavedChanges);
  }, [content, hasUnsavedChanges]);

  const handleSave = () => {
    if (hasUnsavedChanges) {
      onSave(content);
      setSavedContent(content);
    }
  };

  // Handle Cmd/Ctrl+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, content]);

  // Markdown formatting functions
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

  // Handle preview content editing (WYSIWYG)
  const handlePreviewEdit = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    
    // Convert HTML back to markdown (simplified approach)
    const htmlToMarkdown = (html: string): string => {
      let md = html;
      
      // Convert HTML tags back to markdown
      md = md.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
      md = md.replace(/<em>(.*?)<\/em>/g, '*$1*');
      md = md.replace(/<code>(.*?)<\/code>/g, '`$1`');
      md = md.replace(/<h1>(.*?)<\/h1>/g, '# $1\n');
      md = md.replace(/<h2>(.*?)<\/h2>/g, '## $1\n');
      md = md.replace(/<h3>(.*?)<\/h3>/g, '### $1\n');
      md = md.replace(/<h4>(.*?)<\/h4>/g, '#### $1\n');
      md = md.replace(/<h5>(.*?)<\/h5>/g, '##### $1\n');
      md = md.replace(/<h6>(.*?)<\/h6>/g, '###### $1\n');
      md = md.replace(/<p>(.*?)<\/p>/g, '$1\n\n');
      md = md.replace(/<br\s*\/?>/g, '\n');
      md = md.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)');
      md = md.replace(/<ul><li>(.*?)<\/li><\/ul>/g, '- $1\n');
      md = md.replace(/<li>(.*?)<\/li>/g, '- $1\n');
      
      // Remove remaining HTML tags
      md = md.replace(/<[^>]+>/g, '');
      
      // Decode HTML entities
      const textarea = document.createElement('textarea');
      textarea.innerHTML = md;
      md = textarea.value;
      
      return md.trim();
    };

    const innerHTML = target.innerHTML;
    const newMarkdown = htmlToMarkdown(innerHTML);
    
    // Only update if content actually changed
    if (newMarkdown !== content) {
      setContent(newMarkdown);
    }
  }, [content]);

  // Resizable divider
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const container = document.getElementById('editor-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Limit width between 20% and 80%
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
      {/* Top Toolbar */}
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

        {/* View Mode Toggle */}
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
      </Toolbar>

      {/* Formatting Toolbar */}
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

      {/* Editor and Preview Container */}
      <Box 
        id="editor-container"
        sx={{ 
          display: 'flex', 
          flexGrow: 1, 
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Editor */}
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
              extensions={[markdown()]}
              onChange={(value) => setContent(value)}
              theme={isDark ? githubDark : githubLight}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightActiveLine: true,
                foldGutter: true,
              }}
            />
          </Box>
        )}

        {/* Resizable Divider */}
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

        {/* Preview */}
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
              contentEditable={viewMode === 'preview'}
              suppressContentEditableWarning
              onInput={viewMode === 'preview' ? handlePreviewEdit : undefined}
              sx={{ 
                p: 3, 
                bgcolor: 'transparent',
                color: 'inherit',
                outline: viewMode === 'preview' ? `2px solid ${isDark ? '#58a6ff' : '#1976d2'}` : 'none',
                '&:focus': {
                  outline: viewMode === 'preview' ? `2px solid ${isDark ? '#58a6ff' : '#1976d2'}` : 'none',
                },
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
                    // Resolve relative image paths
                    let src = props.src || '';
                    if (repoPath && src && !src.startsWith('http') && !src.startsWith('data:')) {
                      // Convert file:// path for local images
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
