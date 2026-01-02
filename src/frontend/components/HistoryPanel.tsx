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
  Paper,
} from '@mui/material';
import {
  History as HistoryIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import type { CommitEntry } from '../../shared/types';

interface HistoryPanelProps {
  filePath: string | null;
  onViewVersion: (commitHash: string, commitMessage: string) => void;
  onClose: () => void;
}

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
        setError(response.error?.message || 'Failed to load history');
        setHistory([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = (commit: CommitEntry) => {
    setSelectedHash(commit.hash);
    onViewVersion(commit.hash, commit.message);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes === 0 ? 'just now' : `${minutes}m ago`;
      }
      return `${hours}h ago`;
    } else if (days === 1) {
      return 'yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return d.toLocaleDateString();
    }
  };

  const getFileName = () => {
    if (!filePath) return '';
    return filePath.split('/').pop() || filePath;
  };

  return (
    <Box
      sx={{
        width: 320,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: 1,
        borderColor: 'divider',
        bgcolor: isDark ? '#0d1117' : 'background.paper',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <HistoryIcon fontSize="small" />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            File History
          </Typography>
          {filePath && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {getFileName()}
            </Typography>
          )}
        </Box>
        <Tooltip title="Close history">
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}

        {!loading && !error && !filePath && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">
              Select a file to view its history
            </Typography>
          </Box>
        )}

        {!loading && !error && filePath && history.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">
              No commits found for this file
            </Typography>
          </Box>
        )}

        {!loading && !error && history.length > 0 && (
          <List sx={{ py: 0 }}>
            {history.map((commit, index) => (
              <React.Fragment key={commit.hash}>
                {index > 0 && <Divider />}
                <ListItem
                  disablePadding
                  sx={{
                    bgcolor:
                      selectedHash === commit.hash
                        ? isDark
                          ? 'rgba(144, 202, 249, 0.16)'
                          : 'rgba(25, 118, 210, 0.08)'
                        : 'transparent',
                  }}
                >
                  <ListItemButton
                    onClick={() => handleViewVersion(commit)}
                    sx={{ py: 1.5, px: 2 }}
                  >
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="body2" sx={{ mb: 0.5, lineHeight: 1.4 }}>
                            {commit.message}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Chip
                              label={commit.hash.substring(0, 7)}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                fontFamily: 'monospace',
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {commit.author}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          {formatDate(commit.date)}
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
        <Box
          sx={{
            p: 1.5,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {history.length} commit{history.length !== 1 ? 's' : ''} found
          </Typography>
        </Box>
      )}
    </Box>
  );
}

