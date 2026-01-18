import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  History as HistoryIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import type { CommitEntry } from '../../../shared/types';
import { HISTORY_PANEL_TEXT } from './constants';
import {
  panelSx,
  headerSx,
  headerInfoSx,
  scrollContainerSx,
  centerStateSx,
  loadingStateSx,
  listSx,
  listItemSx,
  listItemButtonSx,
  commitMessageSx,
  commitMetaSx,
  hashChipSx,
  commitDateSx,
  footerSx,
} from './styles';
import { formatRelativeDate, getFileName } from './utils';
import type { HistoryPanelProps } from './types';

export function HistoryPanel({ filePath, onViewVersion, onClose }: HistoryPanelProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [history, setHistory] = useState<CommitEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);

  useEffect(() => {
    if (filePath) {
      loadHistory(filePath);
    } else {
      setHistory([]);
      setError(null);
    }
  }, [filePath]);

  const loadHistory = async (path: string) => {
    setLoading(true);
    setError(null);
    setSelectedHash(null);

    try {
      const response = await window.notegitApi.history.getForFile(path);

      if (response.ok && response.data) {
        setHistory(response.data);
      } else {
        setError(response.error?.message || HISTORY_PANEL_TEXT.loadFailed);
        setHistory([]);
      }
    } catch (err: any) {
      setError(err.message || HISTORY_PANEL_TEXT.loadFailed);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = (commit: CommitEntry) => {
    setSelectedHash(commit.hash);
    onViewVersion(commit.hash, commit.message);
  };

  return (
    <Box sx={panelSx(isDark)}>
      <Box sx={headerSx}>
        <HistoryIcon fontSize="small" />
        <Box sx={headerInfoSx}>
          <Typography variant="subtitle2" fontWeight={600}>
            {HISTORY_PANEL_TEXT.title}
          </Typography>
          {filePath && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {getFileName(filePath)}
            </Typography>
          )}
        </Box>
        <Tooltip title={HISTORY_PANEL_TEXT.closeTooltip}>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={scrollContainerSx}>
        {loading && (
          <Box sx={loadingStateSx}>
            <CircularProgress size={32} />
          </Box>
        )}

        {error && (
          <Box sx={centerStateSx}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}

        {!loading && !error && !filePath && (
          <Box sx={centerStateSx}>
            <Typography color="text.secondary" variant="body2">
              {HISTORY_PANEL_TEXT.selectFile}
            </Typography>
          </Box>
        )}

        {!loading && !error && filePath && history.length === 0 && (
          <Box sx={centerStateSx}>
            <Typography color="text.secondary" variant="body2">
              {HISTORY_PANEL_TEXT.noCommits}
            </Typography>
          </Box>
        )}

        {!loading && !error && history.length > 0 && (
          <List sx={listSx}>
            {history.map((commit, index) => (
              <React.Fragment key={commit.hash}>
                {index > 0 && <Divider />}
                <ListItem
                  disablePadding
                  sx={listItemSx(selectedHash === commit.hash, isDark)}
                >
                  <ListItemButton
                    onClick={() => handleViewVersion(commit)}
                    sx={listItemButtonSx}
                  >
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="body2" sx={commitMessageSx}>
                            {commit.message}
                          </Typography>
                          <Box sx={commitMetaSx}>
                            <Chip
                              label={commit.hash.substring(0, 7)}
                              size="small"
                              sx={hashChipSx}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {commit.author}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" sx={commitDateSx}>
                          {formatRelativeDate(commit.date)}
                        </Typography>
                      }
                    />
                    {selectedHash === commit.hash && (
                      <ViewIcon fontSize="small" color="primary" sx={{ ml: 1 }} />
                    )}
                  </ListItemButton>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {history.length > 0 && (
        <Box sx={footerSx(isDark)}>
          <Typography variant="caption" color="text.secondary">
            {history.length} {HISTORY_PANEL_TEXT.commitSuffix}
            {history.length !== 1 ? 's' : ''} found
          </Typography>
        </Box>
      )}
    </Box>
  );
}
