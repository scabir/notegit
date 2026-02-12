import React, { useEffect, useRef, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import { EditorView } from '@codemirror/view';
import { FindReplaceBar } from '../FindReplaceBar';
import { MarkdownEditorHeader } from '../MarkdownEditorHeader';
import { MarkdownEditorPane } from '../MarkdownEditorPane';
import { MarkdownFormatToolbar } from '../MarkdownFormatToolbar';
import type { CheatSheetType } from '../MarkdownFormatToolbar/types';
import { MarkdownPreviewPane } from '../MarkdownPreviewPane';
import type { MarkdownCheatSheetType } from '../MarkdownPreviewPane/types';
import { useEditorFindReplace, useEditorGlobalShortcuts, useEditorKeymap } from '../../utils/editorHooks';
import { MARKDOWN_EDITOR_TEXT } from './constants';
import { useMarkdownDocumentState } from './hooks/useMarkdownDocumentState';
import { useMarkdownEditorShortcuts } from './hooks/useMarkdownEditorShortcuts';
import { useMarkdownFormatting } from './hooks/useMarkdownFormatting';
import { useSplitPane } from './hooks/useSplitPane';
import { editorContainerSx, emptyStateSx, rootSx, splitterSx } from './styles';
import type { MarkdownEditorProps, ViewMode } from './types';

export function MarkdownEditor({
  file,
  repoPath,
  onSave,
  onChange,
  treePanelControls,
  onOpenLinkedFile,
}: MarkdownEditorProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [cheatSheetType, setCheatSheetType] = useState<MarkdownCheatSheetType>(null);
  const editorRef = useRef<any>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const { editorWidth, handleMouseDown } = useSplitPane();

  const {
    appSettings,
    content,
    setContent,
    hasUnsavedChanges,
    handleSave,
    handleExport,
  } = useMarkdownDocumentState({
    file,
    onSave,
    onChange,
  });

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
  } = useEditorFindReplace({ content, setContent, editorViewRef });

  const formatters = useMarkdownFormatting({ editorRef });
  useMarkdownEditorShortcuts({ editorRef, formatters });

  useEffect(() => {
    if (file) {
      resetFindState();
    }
  }, [file, resetFindState]);

  useEffect(() => {
    editorViewRef.current = editorRef.current?.view ?? null;
  });

  useEditorGlobalShortcuts({
    onSave: handleSave,
    onOpenFind: handleOpenFind,
    enableSaveShortcut: true,
  });

  const editorKeymap = useEditorKeymap(handleSave);

  if (!file) {
    return (
      <Box sx={emptyStateSx}>
        {MARKDOWN_EDITOR_TEXT.emptyState}
      </Box>
    );
  }

  const showEditor = viewMode === 'split' || viewMode === 'editor';
  const showPreview = viewMode === 'split' || viewMode === 'preview';

  const handleSelectCheatSheet = (type: CheatSheetType) => {
    setCheatSheetType(type);
    setViewMode('split');
  };

  const handleCloseCheatSheet = () => {
    setCheatSheetType(null);
  };

  return (
    <Box sx={rootSx}>
      <MarkdownEditorHeader
        filePath={file.path}
        hasUnsavedChanges={hasUnsavedChanges}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSave={handleSave}
        onExport={handleExport}
        treePanelControls={treePanelControls}
      />

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

      {showEditor && (
        <MarkdownFormatToolbar
          formatters={formatters}
          onSelectCheatSheet={handleSelectCheatSheet}
        />
      )}

      <Box id="editor-container" sx={editorContainerSx}>
        {showEditor && (
          <MarkdownEditorPane
            isDark={isDark}
            viewMode={viewMode}
            editorWidth={editorWidth}
            content={content}
            onChange={setContent}
            editorRef={editorRef}
            editorKeymap={editorKeymap}
            appSettings={appSettings}
          />
        )}

        {viewMode === 'split' && (
          <Box onMouseDown={handleMouseDown} sx={splitterSx(isDark)} />
        )}

        {showPreview && (
          <MarkdownPreviewPane
            isDark={isDark}
            viewMode={viewMode}
            editorWidth={editorWidth}
            repoPath={repoPath}
            filePath={file.path}
            content={content}
            cheatSheetType={cheatSheetType}
            onCloseCheatSheet={handleCloseCheatSheet}
            onOpenLinkedFile={onOpenLinkedFile}
          />
        )}
      </Box>
    </Box>
  );
}

MarkdownEditor.displayName = 'MarkdownEditor';
