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
import { REPO_SEARCH_TEXT } from './constants';
import {
  titleRowSx,
  titleTextSx,
  queryBlockSx,
  queryInputSx,
  toggleRowSx,
  actionButtonSx,
  alertSx,
  resultsHeaderSx,
  resultsPaperSx,
  fileHeaderItemSx,
  fileHeaderRowSx,
  matchHighlightSx,
  replaceInFileButtonSx,
  matchLineSx,
  matchButtonSx,
  extraMatchesSx,
  actionsHintSx,
} from './styles';
import type { RepoSearchDialogProps } from './types';

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
  /* const [selectedFileIndex, setSelectedFileIndex] = useState(-1); */
  const queryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => queryInputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError(REPO_SEARCH_TEXT.emptyQueryError);
      return;
    }

    setSearching(true);
    setError(null);
    setReplaceResult(null);
    setResults([]);
    /* setSelectedFileIndex(-1); */

    try {
      const response = await window.notegitApi.search.repoWide(query, {
        caseSensitive,
        useRegex,
      });

      if (response.ok && response.data) {
        setResults(response.data);
        if (response.data.length === 0) {
          setError(REPO_SEARCH_TEXT.noMatches);
        }
      } else {
        setError(response.error?.message || REPO_SEARCH_TEXT.searchFailed);
      }
    } catch (err: any) {
      setError(err.message || REPO_SEARCH_TEXT.searchFailed);
    } finally {
      setSearching(false);
    }
  };

  const handleReplaceInFile = async (filePath: string) => {
    if (!query.trim() || !replacement) {
      setError(REPO_SEARCH_TEXT.replaceMissingError);
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
        setError(response.error?.message || REPO_SEARCH_TEXT.replaceFailed);
      }
    } catch (err: any) {
      setError(err.message || REPO_SEARCH_TEXT.replaceFailed);
    } finally {
      setReplacing(false);
    }
  };

  const handleReplaceAll = async () => {
    if (!query.trim() || !replacement) {
      setError(REPO_SEARCH_TEXT.replaceMissingError);
      return;
    }

    const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);
    const confirmed = window.confirm(
      `Replace all ${totalMatches} matches across ${results.length} files?\n\n${REPO_SEARCH_TEXT.replaceAllConfirmSuffix}`
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
        setError(response.error?.message || REPO_SEARCH_TEXT.replaceFailed);
      }
    } catch (err: any) {
      setError(err.message || REPO_SEARCH_TEXT.replaceFailed);
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
        <Box sx={titleRowSx}>
          <SearchIcon />
          <Typography variant="h6" sx={titleTextSx}>
            {REPO_SEARCH_TEXT.title}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={queryBlockSx}>
          <TextField
            inputRef={queryInputRef}
            fullWidth
            label={REPO_SEARCH_TEXT.findLabel}
            placeholder={REPO_SEARCH_TEXT.findPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={searching || replacing}
            sx={queryInputSx}
          />

          <TextField
            fullWidth
            label={REPO_SEARCH_TEXT.replaceLabel}
            placeholder={REPO_SEARCH_TEXT.replacePlaceholder}
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={searching || replacing}
          />
        </Box>

        <Box sx={toggleRowSx}>
          <FormControlLabel
            control={
              <Switch
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                disabled={searching || replacing}
              />
            }
            label={REPO_SEARCH_TEXT.caseSensitive}
          />
          <FormControlLabel
            control={
              <Switch
                checked={useRegex}
                onChange={(e) => setUseRegex(e.target.checked)}
                disabled={searching || replacing}
              />
            }
            label={REPO_SEARCH_TEXT.useRegex}
          />
        </Box>

        <Button
          variant="contained"
          startIcon={searching ? <CircularProgress size={20} /> : <SearchIcon />}
          onClick={handleSearch}
          disabled={searching || replacing || !query.trim()}
          fullWidth
          sx={actionButtonSx}
        >
          {searching ? REPO_SEARCH_TEXT.searching : REPO_SEARCH_TEXT.searchButton}
        </Button>

        {replaceResult && (
          <Alert severity="success" sx={alertSx} onClose={() => setReplaceResult(null)}>
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
          <Alert
            severity={results.length === 0 && error === REPO_SEARCH_TEXT.noMatches ? 'info' : 'error'}
            sx={alertSx}
          >
            {error}
          </Alert>
        )}

        {results.length > 0 && (
          <>
            <Box sx={resultsHeaderSx}>
              <Typography variant="subtitle2">
                Found {totalMatches} matches in {results.length} files
              </Typography>
              {replacement && (
                <Tooltip title={REPO_SEARCH_TEXT.replaceAllTooltip}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={replacing ? <CircularProgress size={16} /> : <ReplaceIcon />}
                    onClick={handleReplaceAll}
                    disabled={replacing}
                    color="warning"
                  >
                    {REPO_SEARCH_TEXT.replaceAllButton}
                  </Button>
                </Tooltip>
              )}
            </Box>

            <Paper variant="outlined" sx={resultsPaperSx}>
              <List dense>
                {results.map((fileResult, fileIndex) => (
                  <React.Fragment key={fileResult.filePath}>
                    {fileIndex > 0 && <Divider />}

                    <ListItem
                      sx={fileHeaderItemSx}
                    >
                      <ListItemText
                        primary={
                          <Box sx={fileHeaderRowSx}>
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
                                sx={replaceInFileButtonSx}
                              >
                                {REPO_SEARCH_TEXT.replaceInFile}
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
                        sx={matchButtonSx}
                      >
                        <ListItemText
                          primary={
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={matchLineSx}
                              >
                                Line {match.lineNumber}:
                              </Typography>
                              <Typography variant="body2" component="span">
                                {match.lineContent.substring(0, match.matchStart)}
                                <Box
                                  component="span"
                                  sx={matchHighlightSx}
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
                      <ListItem sx={extraMatchesSx}>
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
        <Typography variant="caption" color="text.secondary" sx={actionsHintSx}>
          {REPO_SEARCH_TEXT.repoSearchHint}
        </Typography>
        <Button onClick={onClose}>{REPO_SEARCH_TEXT.close}</Button>
      </DialogActions>
    </Dialog>
  );
}
