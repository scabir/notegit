import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Typography,
  CircularProgress,
  Chip,
  useTheme,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Description as FileIcon,
  TextSnippet as TextFileIcon,
} from '@mui/icons-material';
import type { SearchResult } from '../../shared/types/api';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectFile: (filePath: string) => void;
}

export function SearchDialog({ open, onClose, onSelectFile }: SearchDialogProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setError(null);
    }
  }, [open]);

  // Perform search with debouncing
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await window.notegitApi.search.query(query, { maxResults: 50 });

        if (response.ok && response.data) {
          setResults(response.data);
          setSelectedIndex(0);
        } else {
          setError(response.error?.message || 'Search failed');
          setResults([]);
        }
      } catch (err: any) {
        setError(err.message || 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectFile(result.filePath);
    onClose();
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'md' || ext === 'markdown') {
      return <FileIcon sx={{ color: '#1976d2' }} />;
    }
    return <TextFileIcon sx={{ color: '#757575' }} />;
  };

  const highlightMatch = (text: string, query: string) => {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);

    return (
      <>
        {before}
        <Box
          component="span"
          sx={{
            bgcolor: isDark ? 'rgba(255, 217, 0, 0.3)' : 'rgba(255, 235, 59, 0.5)',
            fontWeight: 600,
          }}
        >
          {match}
        </Box>
        {after}
      </>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '70vh',
          maxHeight: '600px',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchIcon />
          <Typography variant="h6">Search Notes</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Search Input */}
        <Box sx={{ px: 3, pt: 1, pb: 2 }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            placeholder="Search by file name or content..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: loading ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ) : null,
            }}
            helperText="Use ↑↓ to navigate, Enter to open, Esc to close"
          />
        </Box>

        {/* Results List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
          {error && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          {!error && !loading && query && results.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No results found</Typography>
            </Box>
          )}

          {!error && !query && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Start typing to search across all notes
              </Typography>
            </Box>
          )}

          {!error && results.length > 0 && (
            <List sx={{ py: 0 }}>
              {results.map((result, index) => (
                <ListItem
                  key={result.filePath}
                  disablePadding
                  sx={{
                    borderLeft: selectedIndex === index ? 3 : 0,
                    borderColor: 'primary.main',
                    bgcolor:
                      selectedIndex === index
                        ? isDark
                          ? 'rgba(144, 202, 249, 0.16)'
                          : 'rgba(25, 118, 210, 0.08)'
                        : 'transparent',
                  }}
                >
                  <ListItemButton
                    onClick={() => handleSelectResult(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    sx={{ py: 1.5 }}
                  >
                    <Box sx={{ display: 'flex', gap: 2, width: '100%', alignItems: 'flex-start' }}>
                      {/* File Icon */}
                      <Box sx={{ mt: 0.5 }}>{getFileIcon(result.fileName)}</Box>

                      {/* File Info */}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        {/* File Name */}
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {highlightMatch(result.fileName, query)}
                        </Typography>

                        {/* File Path */}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mb: result.matches.length > 0 ? 1 : 0 }}
                        >
                          {result.filePath}
                        </Typography>

                        {/* Content Matches */}
                        {result.matches.length > 0 && (
                          <Box>
                            {result.matches.slice(0, 2).map((match, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  mb: 0.5,
                                  p: 1,
                                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: 'monospace',
                                    display: 'block',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {highlightMatch(match.lineContent, query)}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontSize: '0.65rem' }}
                                >
                                  Line {match.lineNumber}
                                </Typography>
                              </Box>
                            ))}
                            {result.matches.length > 2 && (
                              <Chip
                                label={`+${result.matches.length - 2} more`}
                                size="small"
                                sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

