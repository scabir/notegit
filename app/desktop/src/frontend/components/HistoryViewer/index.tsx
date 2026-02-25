import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Chip,
  Tooltip,
  useTheme,
  Paper,
} from "@mui/material";
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkDeflist from "remark-deflist";
import { MermaidDiagram } from "../MermaidDiagram";
import { remarkHighlight } from "../../utils/remarkHighlight";
import { useI18n } from "../../i18n";
import { HISTORY_VIEWER_KEYS } from "./constants";
import {
  dialogPaperSx,
  dialogTitleSx,
  titleRowSx,
  titleInfoSx,
  titleTextSx,
  readOnlyChipSx,
  contentRootSx,
  viewToggleBarSx,
  contentScrollSx,
  loadingStateSx,
  errorStateSx,
  previewContainerSx,
  previewPaperSx,
  codeMirrorContainerSx,
  dialogActionsSx,
  dialogActionsNoteSx,
} from "./styles";
import { getFileName, isMarkdownFile, resolveImageSrc } from "./utils";
import type { HistoryViewerProps } from "./types";

export function HistoryViewer({
  open,
  filePath,
  commitHash,
  commitMessage,
  repoPath,
  onClose,
}: HistoryViewerProps) {
  const { t } = useI18n();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"source" | "preview">("preview");

  const loadVersion = React.useCallback(async () => {
    if (!filePath || !commitHash) return;

    setLoading(true);
    setError(null);

    try {
      const response = await window.notegitApi.history.getVersion(
        commitHash,
        filePath,
      );

      if (response.ok && response.data !== undefined) {
        setContent(response.data);
      } else {
        setError(response.error?.message || t(HISTORY_VIEWER_KEYS.loadFailed));
        setContent("");
      }
    } catch (err: any) {
      setError(err.message || t(HISTORY_VIEWER_KEYS.loadFailed));
      setContent("");
    } finally {
      setLoading(false);
    }
  }, [filePath, commitHash, t]);

  useEffect(() => {
    if (open && filePath && commitHash) {
      loadVersion();
    }
  }, [open, filePath, commitHash, loadVersion]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: dialogPaperSx,
      }}
    >
      <DialogTitle sx={dialogTitleSx}>
        <Box sx={titleRowSx}>
          <Box sx={titleInfoSx}>
            <Typography variant="h6" sx={titleTextSx}>
              {getFileName(filePath)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {commitMessage}
            </Typography>
          </Box>
          <Chip
            label={t(HISTORY_VIEWER_KEYS.readOnly)}
            size="small"
            color="warning"
            sx={readOnlyChipSx}
          />
          <Tooltip title={t(HISTORY_VIEWER_KEYS.closeTooltip)}>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent sx={contentRootSx}>
        {isMarkdownFile(filePath) && !loading && !error && (
          <Box sx={viewToggleBarSx}>
            <Button
              size="small"
              variant={viewMode === "preview" ? "contained" : "outlined"}
              onClick={() => setViewMode("preview")}
            >
              {t(HISTORY_VIEWER_KEYS.preview)}
            </Button>
            <Button
              size="small"
              variant={viewMode === "source" ? "contained" : "outlined"}
              onClick={() => setViewMode("source")}
            >
              {t(HISTORY_VIEWER_KEYS.source)}
            </Button>
          </Box>
        )}

        <Box sx={contentScrollSx}>
          {loading && (
            <Box sx={loadingStateSx}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Box sx={errorStateSx}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          {!loading && !error && content && (
            <>
              {isMarkdownFile(filePath) && viewMode === "preview" ? (
                <Box sx={previewContainerSx(isDark)}>
                  <Paper sx={previewPaperSx(isDark)} elevation={0}>
                    <ReactMarkdown
                      remarkPlugins={[
                        remarkGfm,
                        remarkDeflist,
                        remarkHighlight,
                      ]}
                      components={{
                        img: ({ node: _node, ...props }) => {
                          const src = resolveImageSrc(
                            repoPath,
                            filePath,
                            props.src,
                          );
                          return (
                            <img
                              {...props}
                              src={src}
                              style={{ maxWidth: "100%", height: "auto" }}
                              alt={props.alt || ""}
                            />
                          );
                        },
                        code: ({
                          inline,
                          className,
                          children,
                          ...props
                        }: any) => {
                          const match = /language-(\w+)/.exec(className || "");
                          if (!inline && match?.[1] === "mermaid") {
                            const diagramCode = String(children).replace(
                              /\n$/,
                              "",
                            );
                            return (
                              <MermaidDiagram
                                code={diagramCode}
                                isDark={isDark}
                              />
                            );
                          }
                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </Paper>
                </Box>
              ) : (
                <Box sx={codeMirrorContainerSx(isDark)}>
                  <CodeMirror
                    value={content}
                    height="100%"
                    extensions={isMarkdownFile(filePath) ? [markdown()] : []}
                    theme={isDark ? githubDark : githubLight}
                    editable={false}
                    basicSetup={{
                      lineNumbers: true,
                      highlightActiveLineGutter: false,
                      highlightActiveLine: false,
                      foldGutter: true,
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={dialogActionsSx}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={dialogActionsNoteSx}
        >
          {t(HISTORY_VIEWER_KEYS.readOnlyNotice)}
        </Typography>
        <Button
          startIcon={<CopyIcon />}
          onClick={handleCopy}
          disabled={!content}
        >
          {t(HISTORY_VIEWER_KEYS.copyContent)}
        </Button>
        <Button onClick={onClose}>{t(HISTORY_VIEWER_KEYS.close)}</Button>
      </DialogActions>
    </Dialog>
  );
}
