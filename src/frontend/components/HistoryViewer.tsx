import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Chip,
  useTheme,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface HistoryViewerProps {
  open: boolean;
  filePath: string | null;
  commitHash: string | null;
  commitMessage: string;
  repoPath: string | null;
  onClose: () => void;
}

export function HistoryViewer({
  open,
  filePath,
  commitHash,
  commitMessage,
  repoPath,
  onClose,
}: HistoryViewerProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'source' | 'preview'>('preview');

  useEffect(() => {
    if (open && filePath && commitHash) {
      loadVersion();
    }
  }, [open, filePath, commitHash]);

  const loadVersion = async () => {
    if (!filePath || !commitHash) return;

    setLoading(true);
    setError(null);

    try {
      const response = await window.notegitApi.history.getVersion(commitHash, filePath);

      if (response.ok && response.data !== undefined) {
        setContent(response.data);
      } else {
        setError(response.error?.message || 'Failed to load version');
        setContent('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load version');
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  const getFileName = () => {
    if (!filePath) return '';
    return filePath.split('/').pop() || filePath;
  };

  const isMarkdown = () => {
    if (!filePath) return false;
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext === 'md' || ext === 'markdown';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '800px',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              {getFileName()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {commitMessage}
            </Typography>
          </Box>
          <Chip
            label="READ ONLY"
            size="small"
            color="warning"
            sx={{ fontWeight: 600 }}
          />
          <Tooltip title="Close">
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {isMarkdown() && !loading && !error && (
          <Box
            sx={{
              px: 2,
              py: 1,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              gap: 1,
            }}
          >
            <Button
              size="small"
              variant={viewMode === 'preview' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('preview')}
            >
              Preview
            </Button>
            <Button
              size="small"
              variant={viewMode === 'source' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('source')}
            >
              Source
            </Button>
          </Box>
        )}

        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {loading && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          {!loading && !error && content && (
            <>
              {isMarkdown() && viewMode === 'preview' ? (
                <Box
                  sx={{
                    p: 3,
                    bgcolor: isDark ? '#0d1117' : 'background.paper',
                    color: isDark ? '#c9d1d9' : 'text.primary',
                    height: '100%',
                    overflow: 'auto',
                  }}
                >
                  <Paper
                    sx={{
                      p: 3,
                      bgcolor: 'transparent',
                      color: 'inherit',
                      '& code': {
                        bgcolor: isDark
                          ? 'rgba(110, 118, 129, 0.4)'
                          : 'rgba(175, 184, 193, 0.2)',
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
                          let src = props.src || '';
                          if (
                            repoPath &&
                            src &&
                            !src.startsWith('http') &&
                            !src.startsWith('data:')
                          ) {
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
              ) : (
                <Box sx={{ height: '100%', bgcolor: isDark ? '#0d1117' : '#fff' }}>
                  <CodeMirror
                    value={content}
                    height="100%"
                    extensions={isMarkdown() ? [markdown()] : []}
                    theme={isDark ? githubDark : githubLight}
                    editable={false}
                    basicSetup={{
                      lineNumbers: true,
                      highlightActiveLineGutter: false,
                      highlightActiveLine: false,
                      foldGutter: true,
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
          This is a historical version. To use this content, copy it manually to your editor.
        </Typography>
        <Button
          startIcon={<CopyIcon />}
          onClick={handleCopy}
          disabled={!content}
        >
          Copy Content
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

import { Tooltip } from '@mui/material';

