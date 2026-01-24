import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemButton,

  Box,
  Typography,
  CircularProgress,
  Chip,
  useTheme,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import type { SearchResult } from '../../../shared/types/api';
import { SEARCH_DIALOG_TEXT } from './constants';
import {
  dialogPaperSx,
  dialogTitleSx,
  titleRowSx,
  contentRootSx,
  searchBoxSx,
  resultsContainerSx,
  centerStateSx,
  resultItemSx,
  resultButtonSx,
  resultRowSx,
  iconWrapSx,
  fileInfoSx,
  fileNameSx,
  filePathSx,
  matchSnippetSx,
  matchTextSx,
  lineNumberSx,
  moreChipSx,
} from './styles';
import { getFileIcon, highlightMatch } from './utils';
import type { SearchDialogProps } from './types';

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

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await window.notegitApi.search.query(query, { maxResults: 50 });

        if (response.ok && response.data) {
          setResults(response.data);
          setSelectedIndex(0);
        } else {
          setError(response.error?.message || SEARCH_DIALOG_TEXT.searchFailed);
          setResults([]);
        }
      } catch (err: any) {
        setError(err.message || SEARCH_DIALOG_TEXT.searchFailed);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: dialogPaperSx,
      }}
    >
      <DialogTitle sx={dialogTitleSx}>
        <Box sx={titleRowSx}>
          <SearchIcon />
          <Typography variant="h6">{SEARCH_DIALOG_TEXT.title}</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={contentRootSx}>
        <Box sx={searchBoxSx}>
          <TextField
            inputRef={inputRef}
            fullWidth
            placeholder={SEARCH_DIALOG_TEXT.placeholder}
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
            helperText={SEARCH_DIALOG_TEXT.helperText}
          />
        </Box>

        <Box sx={resultsContainerSx}>
          {error && (
            <Box sx={centerStateSx}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          {!error && !loading && query && results.length === 0 && (
            <Box sx={centerStateSx}>
              <Typography color="text.secondary">{SEARCH_DIALOG_TEXT.noResults}</Typography>
            </Box>
          )}

          {!error && !query && (
            <Box sx={centerStateSx}>
              <Typography color="text.secondary">{SEARCH_DIALOG_TEXT.startTyping}</Typography>
            </Box>
          )}

          {!error && results.length > 0 && (
            <List sx={{ py: 0 }}>
              {results.map((result, index) => (
                <ListItem
                  key={result.filePath}
                  disablePadding
                  sx={resultItemSx(selectedIndex === index, isDark)}
                >
                  <ListItemButton
                    onClick={() => handleSelectResult(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    sx={resultButtonSx}
                  >
                    <Box sx={resultRowSx}>
                      <Box sx={iconWrapSx}>{getFileIcon(result.fileName)}</Box>

                      <Box sx={fileInfoSx}>
                        <Typography variant="subtitle2" sx={fileNameSx}>
                          {highlightMatch(result.fileName, query, isDark)}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={filePathSx}
                        >
                          {result.filePath}
                        </Typography>

                        {result.matches.length > 0 && (
                          <Box>
                            {result.matches.slice(0, 2).map((match, idx) => (
                              <Box
                                key={idx}
                                sx={matchSnippetSx(isDark)}
                              >
                                <Typography
                                  variant="caption"
                                  sx={matchTextSx}
                                >
                                  {highlightMatch(match.lineContent, query, isDark)}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={lineNumberSx}
                                >
                                  {SEARCH_DIALOG_TEXT.lineLabel} {match.lineNumber}
                                </Typography>
                              </Box>
                            ))}
                            {result.matches.length > 2 && (
                              <Chip
                                label={`+${result.matches.length - 2} more`}
                                size="small"
                                sx={moreChipSx}
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
