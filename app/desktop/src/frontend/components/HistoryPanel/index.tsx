import React, { useState, useEffect, useCallback } from "react";
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
} from "@mui/material";
import {
  History as HistoryIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import type { CommitEntry } from "../../../shared/types";
import { useI18n } from "../../i18n";
import { HISTORY_PANEL_KEYS } from "./constants";
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
} from "./styles";
import { formatRelativeDate, getFileName } from "./utils";
import type { HistoryPanelProps } from "./types";

export function HistoryPanel({
  filePath,
  onViewVersion,
  onClose,
}: HistoryPanelProps) {
  const { t } = useI18n();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const relativeTimeText = React.useMemo(
    () => ({
      justNow: t(HISTORY_PANEL_KEYS.relativeTimeJustNow),
      minutesAgoTemplate: t(HISTORY_PANEL_KEYS.relativeTimeMinutesAgoTemplate),
      hoursAgoTemplate: t(HISTORY_PANEL_KEYS.relativeTimeHoursAgoTemplate),
      yesterday: t(HISTORY_PANEL_KEYS.relativeTimeYesterday),
      daysAgoTemplate: t(HISTORY_PANEL_KEYS.relativeTimeDaysAgoTemplate),
    }),
    [t],
  );
  const [history, setHistory] = useState<CommitEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);

  const loadHistory = useCallback(
    async (path: string) => {
      setLoading(true);
      setError(null);
      setSelectedHash(null);

      try {
        const response = await window.notegitApi.history.getForFile(path);

        if (response.ok && response.data) {
          setHistory(response.data);
        } else {
          setError(response.error?.message || t(HISTORY_PANEL_KEYS.loadFailed));
          setHistory([]);
        }
      } catch (err: any) {
        setError(err.message || t(HISTORY_PANEL_KEYS.loadFailed));
        setHistory([]);
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (filePath) {
      void loadHistory(filePath);
    } else {
      setHistory([]);
      setError(null);
    }
  }, [filePath, loadHistory]);

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
            {t(HISTORY_PANEL_KEYS.title)}
          </Typography>
          {filePath && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {getFileName(filePath)}
            </Typography>
          )}
        </Box>
        <Tooltip title={t(HISTORY_PANEL_KEYS.closeTooltip)}>
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
              {t(HISTORY_PANEL_KEYS.selectFile)}
            </Typography>
          </Box>
        )}

        {!loading && !error && filePath && history.length === 0 && (
          <Box sx={centerStateSx}>
            <Typography color="text.secondary" variant="body2">
              {t(HISTORY_PANEL_KEYS.noCommits)}
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
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {commit.author}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={commitDateSx}
                        >
                          {formatRelativeDate(commit.date, relativeTimeText)}
                        </Typography>
                      }
                    />
                    {selectedHash === commit.hash && (
                      <ViewIcon
                        fontSize="small"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
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
            {history.length === 1
              ? t(HISTORY_PANEL_KEYS.commitFoundSingularTemplate).replace(
                  "{count}",
                  String(history.length),
                )
              : t(HISTORY_PANEL_KEYS.commitFoundPluralTemplate).replace(
                  "{count}",
                  String(history.length),
                )}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
