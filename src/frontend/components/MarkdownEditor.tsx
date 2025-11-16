import React, { useState, useEffect } from 'react';
import { Box, Paper, Divider, Toolbar, IconButton, Chip, Tooltip, useTheme } from '@mui/material';
import {
  Save as SaveIcon,
  FiberManualRecord as UnsavedIcon,
  Commit as CommitIcon,
} from '@mui/icons-material';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CommitDialog } from './CommitDialog';
import type { FileContent } from '../../shared/types';

interface MarkdownEditorProps {
  file: FileContent | null;
  repoPath: string | null;
  onSave: (content: string) => void;
  onCommit: () => void;
}

export function MarkdownEditor({ file, repoPath, onSave, onCommit }: MarkdownEditorProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);

  useEffect(() => {
    if (file) {
      setContent(file.content);
      setSavedContent(file.content);
    }
  }, [file]);

  const hasUnsavedChanges = content !== savedContent;

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

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider', gap: 1 }}>
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

        <Tooltip title="Commit (Cmd/Ctrl+Shift+S)">
          <IconButton
            size="small"
            onClick={() => setCommitDialogOpen(true)}
            color="secondary"
          >
            <CommitIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Toolbar>

      <CommitDialog
        open={commitDialogOpen}
        filePath={file?.path || null}
        onClose={() => setCommitDialogOpen(false)}
        onSuccess={() => {
          onCommit();
          setCommitDialogOpen(false);
        }}
      />

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Editor */}
        <Box 
          sx={{ 
            flex: 1, 
            overflow: 'auto',
            bgcolor: isDark ? '#0d1117' : '#fff',
          }}
        >
          <CodeMirror
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

        <Divider orientation="vertical" flexItem />

        {/* Preview */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            bgcolor: isDark ? '#0d1117' : 'background.paper',
            color: isDark ? '#c9d1d9' : 'text.primary',
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
      </Box>
    </Box>
  );
}

