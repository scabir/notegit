import React, { useState, useEffect } from 'react';
import { Box, Toolbar, IconButton, Chip, Tooltip, Typography, useTheme } from '@mui/material';
import { Save as SaveIcon, FileDownload as ExportIcon } from '@mui/icons-material';
import CodeMirror from '@uiw/react-codemirror';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import type { FileContent } from '../../shared/types';

interface TextEditorProps {
  file: FileContent | null;
  onSave: (content: string) => void;
  onChange: (content: string, hasChanges: boolean) => void;
}

export function TextEditor({ file, onSave, onChange }: TextEditorProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (file) {
      setContent(file.content);
      setHasChanges(false);
    }
  }, [file]);

  // Notify parent of content changes
  useEffect(() => {
    onChange(content, hasChanges);
  }, [content, hasChanges]);

  const handleSave = () => {
    if (file && hasChanges) {
      onSave(content);
      setHasChanges(false);
    }
  };

  const handleExport = async () => {
    if (!file) return;

    try {
      const response = await window.notegitApi.export.note(file.path, content, 'txt');
      if (response.ok && response.data) {
        console.log('Note exported to:', response.data);
      } else if (response.error?.message !== 'Export cancelled') {
        console.error('Failed to export note:', response.error);
        alert(`Failed to export: ${response.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export note');
    }
  };

  const handleChange = (value: string) => {
    setContent(value);
    setHasChanges(value !== file?.content);
  };

  if (!file) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        Select a file to edit
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Toolbar
        variant="dense"
        sx={{
          minHeight: '48px',
          borderBottom: 1,
          borderColor: 'divider',
          gap: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          {file.path}
        </Typography>

        {hasChanges && (
          <Chip label="Modified" size="small" color="warning" sx={{ height: 24 }} />
        )}

        <Tooltip title="Save to disk">
          <span>
            <IconButton
              size="small"
              onClick={handleSave}
              disabled={!hasChanges}
              color={hasChanges ? 'primary' : 'default'}
            >
              <SaveIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Export Note">
          <IconButton
            size="small"
            onClick={handleExport}
            color="default"
          >
            <ExportIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Toolbar>

      {/* Editor */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          bgcolor: isDark ? '#0d1117' : '#fff',
        }}
      >
        <CodeMirror
          value={content}
          height="100%"
          theme={isDark ? githubDark : githubLight}
          onChange={handleChange}
          basicSetup={{
            lineNumbers: true,
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

