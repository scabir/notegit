import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  KeyboardArrowUp as PreviousIcon,
  KeyboardArrowDown as NextIcon,
  FindReplace as ReplaceIcon,
  AutoFixHigh as ReplaceAllIcon,
} from '@mui/icons-material';

interface FindReplaceBarProps {
  onClose: () => void;
  onFindNext: (query: string) => void;
  onFindPrevious: (query: string) => void;
  onReplace: (query: string, replacement: string) => void;
  onReplaceAll: (query: string, replacement: string) => void;
  initialQuery?: string;
  matchInfo?: { current: number; total: number } | null;
}

export function FindReplaceBar({
  onClose,
  onFindNext,
  onFindPrevious,
  onReplace,
  onReplaceAll,
  initialQuery = '',
  matchInfo,
}: FindReplaceBarProps) {
  const [findQuery, setFindQuery] = useState(initialQuery);
  const [replaceText, setReplaceText] = useState('');
  const findInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    findInputRef.current?.focus();
    findInputRef.current?.select();
  }, []);

  const handleFindNext = () => {
    if (findQuery.trim()) {
      onFindNext(findQuery);
    }
  };

  const handleFindPrevious = () => {
    if (findQuery.trim()) {
      onFindPrevious(findQuery);
    }
  };

  const handleReplace = () => {
    if (findQuery.trim()) {
      onReplace(findQuery, replaceText);
    }
  };

  const handleReplaceAll = () => {
    if (findQuery.trim()) {
      onReplaceAll(findQuery, replaceText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        handleFindPrevious();
      } else {
        handleFindNext();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <TextField
        inputRef={findInputRef}
        size="small"
        placeholder="Find"
        value={findQuery}
        onChange={(e) => setFindQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        sx={{ width: 200 }}
        InputProps={{
          endAdornment: matchInfo && matchInfo.total > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              {matchInfo.current}/{matchInfo.total}
            </Typography>
          ),
        }}
      />

      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Find previous (Shift+Enter)">
          <span>
            <IconButton
              size="small"
              onClick={handleFindPrevious}
              disabled={!findQuery.trim()}
            >
              <PreviousIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Find next (Enter)">
          <span>
            <IconButton
              size="small"
              onClick={handleFindNext}
              disabled={!findQuery.trim()}
            >
              <NextIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {findQuery.trim() && matchInfo && matchInfo.total === 0 && (
        <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
          No matches
        </Typography>
      )}

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <TextField
        size="small"
        placeholder="Replace"
        value={replaceText}
        onChange={(e) => setReplaceText(e.target.value)}
        onKeyDown={handleKeyDown}
        sx={{ width: 200 }}
      />

      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Replace current match">
          <span>
            <IconButton
              size="small"
              onClick={handleReplace}
              disabled={!findQuery.trim()}
            >
              <ReplaceIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Replace all matches">
          <span>
            <IconButton
              size="small"
              onClick={handleReplaceAll}
              disabled={!findQuery.trim()}
            >
              <ReplaceAllIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      <Tooltip title="Close (Esc)">
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Paper>
  );
}

