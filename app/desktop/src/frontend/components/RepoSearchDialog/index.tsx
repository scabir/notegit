import React, { useState, useRef, useEffect } from "react";
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
} from "@mui/material";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  FindReplace as ReplaceIcon,
} from "@mui/icons-material";
import type {
  RepoWideSearchResult,
  ReplaceResult,
} from "../../../shared/types";
import { useI18n } from "../../i18n";
import { REPO_SEARCH_KEYS } from "./constants";
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
} from "./styles";
import type { RepoSearchDialogProps } from "./types";

const formatTemplate = (
  template: string,
  values: Record<string, string | number>,
): string => {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return result;
};

export function RepoSearchDialog({
  open,
  onClose,
  onSelectMatch,
}: RepoSearchDialogProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [searching, setSearching] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [results, setResults] = useState<RepoWideSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [replaceResult, setReplaceResult] = useState<ReplaceResult | null>(
    null,
  );
  const queryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => queryInputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError(t(REPO_SEARCH_KEYS.emptyQueryError));
      return;
    }

    setSearching(true);
    setError(null);
    setReplaceResult(null);
    setResults([]);

    try {
      const response = await window.notegitApi.search.repoWide(query, {
        caseSensitive,
        useRegex,
      });

      if (response.ok && response.data) {
        setResults(response.data);
        if (response.data.length === 0) {
          setError(t(REPO_SEARCH_KEYS.noMatches));
        }
      } else {
        setError(response.error?.message || t(REPO_SEARCH_KEYS.searchFailed));
      }
    } catch (err: any) {
      setError(err.message || t(REPO_SEARCH_KEYS.searchFailed));
    } finally {
      setSearching(false);
    }
  };

  const handleReplaceInFile = async (filePath: string) => {
    if (!query.trim() || !replacement) {
      setError(t(REPO_SEARCH_KEYS.replaceMissingError));
      return;
    }

    setReplacing(true);
    setError(null);

    try {
      const response = await window.notegitApi.search.replaceInRepo(
        query,
        replacement,
        {
          caseSensitive,
          useRegex,
          filePaths: [filePath],
        },
      );

      if (response.ok && response.data) {
        setReplaceResult(response.data);
        await handleSearch();
      } else {
        setError(response.error?.message || t(REPO_SEARCH_KEYS.replaceFailed));
      }
    } catch (err: any) {
      setError(err.message || t(REPO_SEARCH_KEYS.replaceFailed));
    } finally {
      setReplacing(false);
    }
  };

  const handleReplaceAll = async () => {
    if (!query.trim() || !replacement) {
      setError(t(REPO_SEARCH_KEYS.replaceMissingError));
      return;
    }

    const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);
    const confirmed = window.confirm(
      formatTemplate(t(REPO_SEARCH_KEYS.replaceAllConfirmTemplate), {
        matches: totalMatches,
        files: results.length,
        suffix: t(REPO_SEARCH_KEYS.replaceAllConfirmSuffix),
      }),
    );

    if (!confirmed) return;

    setReplacing(true);
    setError(null);

    try {
      const response = await window.notegitApi.search.replaceInRepo(
        query,
        replacement,
        {
          caseSensitive,
          useRegex,
        },
      );

      if (response.ok && response.data) {
        setReplaceResult(response.data);
        setResults([]);
        setQuery("");
        setReplacement("");
      } else {
        setError(response.error?.message || t(REPO_SEARCH_KEYS.replaceFailed));
      }
    } catch (err: any) {
      setError(err.message || t(REPO_SEARCH_KEYS.replaceFailed));
    } finally {
      setReplacing(false);
    }
  };

  const handleSelectMatch = (filePath: string, lineNumber: number) => {
    onSelectMatch(filePath, lineNumber);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
            {t(REPO_SEARCH_KEYS.title)}
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
            label={t(REPO_SEARCH_KEYS.findLabel)}
            placeholder={t(REPO_SEARCH_KEYS.findPlaceholder)}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={searching || replacing}
            sx={queryInputSx}
          />

          <TextField
            fullWidth
            label={t(REPO_SEARCH_KEYS.replaceLabel)}
            placeholder={t(REPO_SEARCH_KEYS.replacePlaceholder)}
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
            label={t(REPO_SEARCH_KEYS.caseSensitive)}
          />
          <FormControlLabel
            control={
              <Switch
                checked={useRegex}
                onChange={(e) => setUseRegex(e.target.checked)}
                disabled={searching || replacing}
              />
            }
            label={t(REPO_SEARCH_KEYS.useRegex)}
          />
        </Box>

        <Button
          variant="contained"
          startIcon={
            searching ? <CircularProgress size={20} /> : <SearchIcon />
          }
          onClick={handleSearch}
          disabled={searching || replacing || !query.trim()}
          fullWidth
          sx={actionButtonSx}
        >
          {searching
            ? t(REPO_SEARCH_KEYS.searching)
            : t(REPO_SEARCH_KEYS.searchButton)}
        </Button>

        {replaceResult && (
          <Alert
            severity="success"
            sx={alertSx}
            onClose={() => setReplaceResult(null)}
          >
            <Typography variant="body2">
              {formatTemplate(t(REPO_SEARCH_KEYS.replaceSummaryTemplate), {
                replacements: replaceResult.totalReplacements,
                modified: replaceResult.filesModified,
                processed: replaceResult.filesProcessed,
              })}
            </Typography>
            {replaceResult.errors.length > 0 && (
              <Typography variant="caption" color="error">
                {formatTemplate(t(REPO_SEARCH_KEYS.filesHadErrorsTemplate), {
                  count: replaceResult.errors.length,
                })}
              </Typography>
            )}
          </Alert>
        )}

        {error && (
          <Alert
            severity={
              results.length === 0 && error === t(REPO_SEARCH_KEYS.noMatches)
                ? "info"
                : "error"
            }
            sx={alertSx}
          >
            {error}
          </Alert>
        )}

        {results.length > 0 && (
          <>
            <Box sx={resultsHeaderSx}>
              <Typography variant="subtitle2">
                {formatTemplate(t(REPO_SEARCH_KEYS.foundMatchesTemplate), {
                  matches: totalMatches,
                  files: results.length,
                })}
              </Typography>
              {replacement && (
                <Tooltip title={t(REPO_SEARCH_KEYS.replaceAllTooltip)}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={
                      replacing ? (
                        <CircularProgress size={16} />
                      ) : (
                        <ReplaceIcon />
                      )
                    }
                    onClick={handleReplaceAll}
                    disabled={replacing}
                    color="warning"
                  >
                    {t(REPO_SEARCH_KEYS.replaceAllButton)}
                  </Button>
                </Tooltip>
              )}
            </Box>

            <Paper variant="outlined" sx={resultsPaperSx}>
              <List dense>
                {results.map((fileResult, fileIndex) => (
                  <React.Fragment key={fileResult.filePath}>
                    {fileIndex > 0 && <Divider />}

                    <ListItem sx={fileHeaderItemSx}>
                      <ListItemText
                        primary={
                          <Box sx={fileHeaderRowSx}>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600 }}
                            >
                              {fileResult.fileName}
                            </Typography>
                            <Chip
                              label={formatTemplate(
                                t(REPO_SEARCH_KEYS.fileMatchesChipTemplate),
                                { count: fileResult.matches.length },
                              )}
                              size="small"
                              color="primary"
                              sx={{ height: 20 }}
                            />
                            {replacement && (
                              <Button
                                size="small"
                                variant="text"
                                onClick={() =>
                                  handleReplaceInFile(fileResult.filePath)
                                }
                                disabled={replacing}
                                sx={replaceInFileButtonSx}
                              >
                                {t(REPO_SEARCH_KEYS.replaceInFile)}
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
                        onClick={() =>
                          handleSelectMatch(
                            fileResult.filePath,
                            match.lineNumber,
                          )
                        }
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
                                {formatTemplate(
                                  t(REPO_SEARCH_KEYS.lineLabelTemplate),
                                  {
                                    lineNumber: match.lineNumber,
                                  },
                                )}
                              </Typography>
                              <Typography variant="body2" component="span">
                                {match.lineContent.substring(
                                  0,
                                  match.matchStart,
                                )}
                                <Box component="span" sx={matchHighlightSx}>
                                  {match.lineContent.substring(
                                    match.matchStart,
                                    match.matchEnd,
                                  )}
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
                          {formatTemplate(
                            t(REPO_SEARCH_KEYS.extraMatchesTemplate),
                            {
                              count: fileResult.matches.length - 5,
                            },
                          )}
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
          {t(REPO_SEARCH_KEYS.repoSearchHint)}
        </Typography>
        <Button onClick={onClose}>{t(REPO_SEARCH_KEYS.close)}</Button>
      </DialogActions>
    </Dialog>
  );
}
