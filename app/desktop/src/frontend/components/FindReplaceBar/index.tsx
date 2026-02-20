import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Typography,
  Paper,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  KeyboardArrowUp as PreviousIcon,
  KeyboardArrowDown as NextIcon,
  FindReplace as ReplaceIcon,
  AutoFixHigh as ReplaceAllIcon,
} from "@mui/icons-material";
import { FIND_REPLACE_TEXT } from "./constants";
import {
  containerSx,
  findInputSx,
  replaceInputSx,
  matchCountSx,
  noMatchesSx,
  buttonRowSx,
  dividerSx,
  flexSpacerSx,
} from "./styles";
import type { FindReplaceBarProps } from "./types";

export function FindReplaceBar({
  onClose,
  onFindNext,
  onFindPrevious,
  onReplace,
  onReplaceAll,
  initialQuery = "",
  matchInfo,
}: FindReplaceBarProps) {
  const [findQuery, setFindQuery] = useState(initialQuery);
  const [replaceText, setReplaceText] = useState("");
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
    if (e.key === "Enter") {
      if (e.shiftKey) {
        handleFindPrevious();
      } else {
        handleFindNext();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <Paper elevation={4} sx={containerSx}>
      <TextField
        inputRef={findInputRef}
        size="small"
        placeholder={FIND_REPLACE_TEXT.findPlaceholder}
        value={findQuery}
        onChange={(e) => setFindQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        sx={findInputSx}
        InputProps={{
          endAdornment: matchInfo && matchInfo.total > 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={matchCountSx}
            >
              {matchInfo.current}/{matchInfo.total}
            </Typography>
          ),
        }}
      />

      <Box sx={buttonRowSx}>
        <Tooltip title={FIND_REPLACE_TEXT.findPrevious}>
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
        <Tooltip title={FIND_REPLACE_TEXT.findNext}>
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
        <Typography variant="caption" color="warning.main" sx={noMatchesSx}>
          {FIND_REPLACE_TEXT.noMatches}
        </Typography>
      )}

      <Divider orientation="vertical" flexItem sx={dividerSx} />

      <TextField
        size="small"
        placeholder={FIND_REPLACE_TEXT.replacePlaceholder}
        value={replaceText}
        onChange={(e) => setReplaceText(e.target.value)}
        onKeyDown={handleKeyDown}
        sx={replaceInputSx}
      />

      <Box sx={buttonRowSx}>
        <Tooltip title={FIND_REPLACE_TEXT.replaceCurrent}>
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
        <Tooltip title={FIND_REPLACE_TEXT.replaceAll}>
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

      <Box sx={flexSpacerSx} />

      <Tooltip title={FIND_REPLACE_TEXT.close}>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Paper>
  );
}
