import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Toolbar,
  IconButton,
  Chip,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Save as SaveIcon,
  FileDownload as ExportIcon,
} from "@mui/icons-material";
import CodeMirror from "@uiw/react-codemirror";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { EditorView } from "@codemirror/view";
import { FindReplaceBar } from "../FindReplaceBar";
import {
  EXPORT_CANCELLED_REASON,
  type AppSettings,
} from "../../../shared/types";
import { useI18n } from "../../i18n";
import { buildTextEditorMessages, buildTextEditorText } from "./constants";
import {
  emptyStateSx,
  rootSx,
  toolbarSx,
  treeControlsRowSx,
  filePathSx,
  modifiedChipSx,
  editorContainerSx,
} from "./styles";
import type { TextEditorProps } from "./types";
import {
  useEditorFindReplace,
  useEditorGlobalShortcuts,
  useEditorKeymap,
} from "../../utils/editorHooks";

export function TextEditor({
  file,
  onSave,
  onChange,
  treePanelControls,
}: TextEditorProps) {
  const { t } = useI18n();
  const text = React.useMemo(() => buildTextEditorText(t), [t]);
  const messages = React.useMemo(() => buildTextEditorMessages(t), [t]);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [content, setContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const editorRef = useRef<any>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const {
    findBarOpen,
    searchMatches,
    currentMatchIndex,
    closeFindBar,
    resetFindState,
    handleOpenFind,
    handleFindNext,
    handleFindPrevious,
    handleReplace,
    handleReplaceAll,
  } = useEditorFindReplace({
    content,
    setContent,
    editorViewRef,
    onContentModified: () => setHasChanges(true),
  });

  useEffect(() => {
    const loadSettings = async () => {
      const response = await window.notegitApi.config.getAppSettings();
      if (response.ok && response.data) {
        setAppSettings(response.data);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (file) {
      setContent(file.content);
      setHasChanges(false);
      resetFindState();
    }
  }, [file, resetFindState]);

  useEffect(() => {
    onChange(content, hasChanges);
  }, [content, hasChanges, onChange]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.view) {
      editorViewRef.current = editorRef.current.view;
    }
  }, []);

  const handleSave = useCallback(() => {
    if (file && hasChanges) {
      onSave(content);
      setHasChanges(false);
    }
  }, [content, file, hasChanges, onSave]);

  const handleExport = async () => {
    if (!file) return;

    try {
      const response = await window.notegitApi.export.note(
        file.path,
        content,
        "txt",
      );
      const errorDetails =
        response.error?.details &&
        typeof response.error.details === "object" &&
        !Array.isArray(response.error.details)
          ? (response.error.details as Record<string, unknown>)
          : null;
      const isExportCancelled =
        errorDetails?.reason === EXPORT_CANCELLED_REASON;

      if (response.ok && response.data) {
        console.log("Note exported to:", response.data);
      } else if (!isExportCancelled) {
        console.error("Failed to export note:", response.error);
        alert(
          messages.failedExport(
            response.error?.message || messages.unknownError,
          ),
        );
      }
    } catch (error) {
      console.error("Export error:", error);
      alert(messages.failedExportNote);
    }
  };
  useEditorGlobalShortcuts({ onOpenFind: handleOpenFind });
  const editorKeymap = useEditorKeymap(handleSave);

  const handleChange = (value: string) => {
    setContent(value);
    setHasChanges(value !== file?.content);
  };

  if (!file) {
    return <Box sx={emptyStateSx}>{text.emptyState}</Box>;
  }

  return (
    <Box sx={rootSx}>
      <Toolbar variant="dense" disableGutters sx={toolbarSx}>
        {treePanelControls && (
          <Box sx={treeControlsRowSx}>
            <Tooltip title={text.showTreeTooltip}>
              <IconButton size="small" onClick={treePanelControls.onToggleTree}>
                <MenuIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={text.backTooltip}>
              <span>
                <IconButton
                  size="small"
                  onClick={treePanelControls.onNavigateBack}
                  disabled={!treePanelControls.canNavigateBack}
                >
                  <BackIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={text.forwardTooltip}>
              <span>
                <IconButton
                  size="small"
                  onClick={treePanelControls.onNavigateForward}
                  disabled={!treePanelControls.canNavigateForward}
                >
                  <ForwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}

        <Typography variant="subtitle2" sx={filePathSx}>
          {file.path}
        </Typography>

        {hasChanges && (
          <Chip
            label={text.modified}
            size="small"
            color="warning"
            sx={modifiedChipSx}
          />
        )}

        <Tooltip title={text.saveTooltip}>
          <span>
            <IconButton
              size="small"
              onClick={handleSave}
              disabled={!hasChanges}
              color={hasChanges ? "primary" : "default"}
            >
              <SaveIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={text.exportTooltip}>
          <IconButton size="small" onClick={handleExport} color="default">
            <ExportIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Toolbar>

      {findBarOpen && (
        <FindReplaceBar
          onClose={closeFindBar}
          onFindNext={handleFindNext}
          onFindPrevious={handleFindPrevious}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
          matchInfo={
            searchMatches.length > 0
              ? { current: currentMatchIndex + 1, total: searchMatches.length }
              : null
          }
        />
      )}

      <Box sx={editorContainerSx(isDark)}>
        <CodeMirror
          ref={editorRef}
          value={content}
          height="100%"
          extensions={[EditorView.lineWrapping, editorKeymap]}
          theme={isDark ? githubDark : githubLight}
          onChange={handleChange}
          basicSetup={{
            lineNumbers: appSettings?.editorPrefs.lineNumbers ?? true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            dropCursor: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            searchKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
      </Box>
    </Box>
  );
}
