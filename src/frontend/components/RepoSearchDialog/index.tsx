import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Divider,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  FindReplace as ReplaceIcon,
} from '@mui/icons-material';
import type { RepoWideSearchResult, ReplaceResult } from '../../../shared/types';

interface RepoSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectMatch: (filePath: string, lineNumber: number) => void;
}

export function RepoSearchDialog({ open, onClose, onSelectMatch }: RepoSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [searching, setSearching] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [results, setResults] = useState<RepoWideSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [replaceResult, setReplaceResult] = useState<ReplaceResult | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(-1);
  const queryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => queryInputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setSearching(true);
    setError(null);
    setReplaceResult(null);
    setResults([]);
    setSelectedFileIndex(-1);

    try {
      const response = await window.notegitApi.search.repoWide(query, {
        caseSensitive,
        useRegex,
      });

      if (response.ok && response.data) {
        setResults(response.data);
        if (response.data.length === 0) {
          setError('No matches found');
        }
      } else {
        setError(response.error?.message || 'Search failed');
      }
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleReplaceInFile = async (filePath: string) => {
    if (!query.trim() || !replacement) {
      setError('Please enter both search and replace text');
      return;
    }

    setReplacing(true);
    setError(null);

    try {
      const response = await window.notegitApi.search.replaceInRepo(query, replacement, {
        caseSensitive,
        useRegex,
        filePaths: [filePath],
      });

      if (response.ok && response.data) {
        setReplaceResult(response.data);
        await handleSearch();
      } else {
        setError(response.error?.message || 'Replace failed');
      }
    } catch (err: any) {
      setError(err.message || 'Replace failed');
    } finally {
      setReplacing(false);
    }
  };

  const handleReplaceAll = async () => {
    if (!query.trim() || !replacement) {
      setError('Please enter both search and replace text');
      return;
    }

    const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);
    const confirmed = window.confirm(
      `Replace all ${totalMatches} matches across ${results.length} files?\n\nThis action will modify files on disk.`
    );

    if (!confirmed) return;

    setReplacing(true);
    setError(null);

    try {
      const response = await window.notegitApi.search.replaceInRepo(query, replacement, {
        caseSensitive,
        useRegex,
      });

      if (response.ok && response.data) {
        setReplaceResult(response.data);
        setResults([]);
        setQuery('');
        setReplacement('');
      } else {
        setError(response.error?.message || 'Replace failed');
      }
    } catch (err: any) {
      setError(err.message || 'Replace failed');
    } finally {
      setReplacing(false);
    }
  };

  const handleSelectMatch = (filePath: string, lineNumber: number) => {
    onSelectMatch(filePath, lineNumber);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchIcon />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Find and Replace in Repository
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            inputRef={queryInputRef}
            fullWidth
            label="Find"
            placeholder="Search text across all markdown files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={searching || replacing}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Replace (optional)"
            placeholder="Replacement text..."
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={searching || replacing}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                disabled={searching || replacing}
              />
            }
            label="Case sensitive"
          />
          <FormControlLabel
            control={
              <Switch
                checked={useRegex}
                onChange={(e) => setUseRegex(e.target.checked)}
                disabled={searching || replacing}
              />
            }
            label="Use regex"
          />
        </Box>

        <Button
          variant="contained"
          startIcon={searching ? <CircularProgress size={20} /> : <SearchIcon />}
          onClick={handleSearch}
          disabled={searching || replacing || !query.trim()}
          fullWidth
          sx={{ mb: 2 }}
        >
          {searching ? 'Searching...' : 'Search Repository'}
        </Button>

        {replaceResult && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setReplaceResult(null)}>
            <Typography variant="body2">
              Replaced {replaceResult.totalReplacements} occurrences in{' '}
              {replaceResult.filesModified} of {replaceResult.filesProcessed} files
            </Typography>
            {replaceResult.errors.length > 0 && (
              <Typography variant="caption" color="error">
                {replaceResult.errors.length} files had errors
              </Typography>
            )}
          </Alert>
        )}

        {error && (
          <Alert severity={results.length === 0 && error === 'No matches found' ? 'info' : 'error'} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {results.length > 0 && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2">
                Found {totalMatches} matches in {results.length} files
              </Typography>
              {replacement && (
                <Tooltip title="Replace all matches in all files">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={replacing ? <CircularProgress size={16} /> : <ReplaceIcon />}
                    onClick={handleReplaceAll}
                    disabled={replacing}
                    color="warning"
                  >
                    Replace All in Repo
                  </Button>
                </Tooltip>
              )}
            </Box>

            <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
              <List dense>
                {results.map((fileResult, fileIndex) => (
                  <React.Fragment key={fileResult.filePath}>
                    {fileIndex > 0 && <Divider />}
                    
                    <ListItem
                      sx={{
                        bgcolor: 'action.hover',
                        borderBottom: 1,
                        borderColor: 'divider',
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {fileResult.fileName}
                            </Typography>
                            <Chip
                              label={`${fileResult.matches.length} matches`}
                              size="small"
                              color="primary"
                              sx={{ height: 20 }}
                            />
                            {replacement && (
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => handleReplaceInFile(fileResult.filePath)}
                                disabled={replacing}
                                sx={{ ml: 'auto', fontSize: '0.75rem' }}
                              >
                                Replace in file
                              </Button>
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {fileResult.filePath}
                          </Typography>
                        }
                      />
                    </ListItem>

                    {fileResult.matches.slice(0, 5).map((match, matchIndex) => (
                      <ListItemButton
                        key={`${fileIndex}-${matchIndex}`}
                        onClick={() => handleSelectMatch(fileResult.filePath, match.lineNumber)}
                        sx={{ pl: 4 }}
                      >
                        <ListItemText
                          primary={
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mr: 1, fontWeight: 500 }}
                              >
                                Line {match.lineNumber}:
                              </Typography>
                              <Typography variant="body2" component="span">
                                {match.lineContent.substring(0, match.matchStart)}
                                <Box
                                  component="span"
                                  sx={{
                                    bgcolor: 'warning.light',
                                    color: 'warning.contrastText',
                                    px: 0.5,
                                    borderRadius: 0.5,
                                  }}
                                >
                                  {match.lineContent.substring(match.matchStart, match.matchEnd)}
                                </Box>
                                {match.lineContent.substring(match.matchEnd)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    ))}

                    {fileResult.matches.length > 5 && (
                      <ListItem sx={{ pl: 4 }}>
                        <Typography variant="caption" color="text.secondary">
                          ... and {fileResult.matches.length - 5} more matches
                        </Typography>
                      </ListItem>
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1, ml: 2 }}>
          Searches only .md files in the repository
        </Typography>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

