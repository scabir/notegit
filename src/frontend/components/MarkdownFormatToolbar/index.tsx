import React, { useState } from 'react';
import { Box, Divider, IconButton, Menu, MenuItem, Toolbar, Tooltip } from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatListBulleted as ListIcon,
  FormatListNumbered as NumberedListIcon,
  Code as CodeIcon,
  FormatQuote as QuoteIcon,
  Link as LinkIcon,
  TableChart as TableIcon,
  Notes as FootnoteIcon,
  Checklist as TaskListIcon,
  Highlight as HighlightIcon,
  ListAlt as DefinitionListIcon,
  MoreHoriz as MoreIcon,
  MenuBook as CheatSheetIcon,
} from '@mui/icons-material';
import { MARKDOWN_EDITOR_TEXT } from '../MarkdownEditor/constants';
import { MARKDOWN_FORMAT_TOOLBAR } from './constants';
import {
  codeBlockIconSx,
  dividerSx,
  formatToolbarSx,
  growSx,
  headingIconSx,
} from './styles';
import type { MarkdownFormatToolbarProps } from './types';

export function MarkdownFormatToolbar({ formatters, onSelectCheatSheet }: MarkdownFormatToolbarProps) {
  const [extrasAnchorEl, setExtrasAnchorEl] = useState<null | HTMLElement>(null);
  const [cheatSheetAnchorEl, setCheatSheetAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenExtras = (event: React.MouseEvent<HTMLElement>) => {
    setExtrasAnchorEl(event.currentTarget);
  };

  const handleCloseExtras = () => {
    setExtrasAnchorEl(null);
  };

  const handleInsertMermaid = () => {
    handleCloseExtras();
    formatters.formatMermaid();
  };

  const handleInsertRawMarkdown = () => {
    handleCloseExtras();
    formatters.formatRawMarkdown();
  };

  const handleOpenCheatSheetMenu = (event: React.MouseEvent<HTMLElement>) => {
    setCheatSheetAnchorEl(event.currentTarget);
  };

  const handleCloseCheatSheetMenu = () => {
    setCheatSheetAnchorEl(null);
  };

  const handleSelectCheatSheet = (type: 'markdown' | 'mermaid') => {
    handleCloseCheatSheetMenu();
    onSelectCheatSheet(type);
  };

  return (
    <Toolbar variant="dense" sx={formatToolbarSx}>
      <Tooltip title={MARKDOWN_EDITOR_TEXT.boldTooltip}>
        <IconButton size="small" onClick={formatters.formatBold}>
          <BoldIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={MARKDOWN_EDITOR_TEXT.italicTooltip}>
        <IconButton size="small" onClick={formatters.formatItalic}>
          <ItalicIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={MARKDOWN_EDITOR_TEXT.headingTooltip}>
        <IconButton size="small" onClick={formatters.formatHeading}>
          <Box sx={headingIconSx}>H</Box>
        </IconButton>
      </Tooltip>
      <Divider orientation="vertical" flexItem sx={dividerSx} />
      <Tooltip title={MARKDOWN_EDITOR_TEXT.bulletTooltip}>
        <IconButton size="small" onClick={formatters.formatBulletList}>
          <ListIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={MARKDOWN_EDITOR_TEXT.numberedTooltip}>
        <IconButton size="small" onClick={formatters.formatNumberedList}>
          <NumberedListIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={MARKDOWN_EDITOR_TEXT.quoteTooltip}>
        <IconButton size="small" onClick={formatters.formatQuote}>
          <QuoteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Divider orientation="vertical" flexItem sx={dividerSx} />
      <Tooltip title={MARKDOWN_EDITOR_TEXT.inlineCodeTooltip}>
        <IconButton size="small" onClick={formatters.formatCode}>
          <CodeIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={MARKDOWN_EDITOR_TEXT.codeBlockTooltip}>
        <IconButton size="small" onClick={formatters.formatCodeBlock}>
          <Box sx={codeBlockIconSx}>{'{ }'}</Box>
        </IconButton>
      </Tooltip>
      <Tooltip title={MARKDOWN_EDITOR_TEXT.linkTooltip}>
        <IconButton size="small" onClick={formatters.formatLink}>
          <LinkIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={MARKDOWN_EDITOR_TEXT.tableTooltip}>
        <IconButton size="small" onClick={formatters.formatTable}>
          <TableIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={MARKDOWN_EDITOR_TEXT.footnoteLabel}>
        <IconButton size="small" onClick={formatters.formatFootnote}>
          <FootnoteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={MARKDOWN_EDITOR_TEXT.taskListLabel}>
        <IconButton size="small" onClick={formatters.formatTaskList}>
          <TaskListIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={MARKDOWN_EDITOR_TEXT.highlightLabel}>
        <IconButton size="small" onClick={formatters.formatHighlight}>
          <HighlightIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={MARKDOWN_EDITOR_TEXT.definitionListLabel}>
        <IconButton size="small" onClick={formatters.formatDefinitionList}>
          <DefinitionListIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Divider orientation="vertical" flexItem sx={dividerSx} />
      <Tooltip title={MARKDOWN_EDITOR_TEXT.extrasTooltip}>
        <IconButton
          size="small"
          onClick={handleOpenExtras}
          aria-label={MARKDOWN_EDITOR_TEXT.extrasTooltip}
          aria-haspopup="true"
          aria-controls={extrasAnchorEl ? MARKDOWN_FORMAT_TOOLBAR.extrasMenuId : undefined}
          aria-expanded={extrasAnchorEl ? 'true' : undefined}
        >
          <MoreIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={MARKDOWN_EDITOR_TEXT.cheatsheetTooltip}>
        <IconButton
          size="small"
          onClick={handleOpenCheatSheetMenu}
          aria-label={MARKDOWN_EDITOR_TEXT.cheatsheetTooltip}
          aria-haspopup="true"
          aria-controls={cheatSheetAnchorEl ? MARKDOWN_FORMAT_TOOLBAR.cheatsheetMenuId : undefined}
          aria-expanded={cheatSheetAnchorEl ? 'true' : undefined}
        >
          <CheatSheetIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Box sx={growSx} />
      <Menu
        id={MARKDOWN_FORMAT_TOOLBAR.extrasMenuId}
        anchorEl={extrasAnchorEl}
        open={Boolean(extrasAnchorEl)}
        onClose={handleCloseExtras}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleInsertMermaid}>
          {MARKDOWN_EDITOR_TEXT.mermaidLabel}
        </MenuItem>
        <MenuItem onClick={handleInsertRawMarkdown}>
          {MARKDOWN_EDITOR_TEXT.rawMarkdownLabel}
        </MenuItem>
      </Menu>
      <Menu
        id={MARKDOWN_FORMAT_TOOLBAR.cheatsheetMenuId}
        anchorEl={cheatSheetAnchorEl}
        open={Boolean(cheatSheetAnchorEl)}
        onClose={handleCloseCheatSheetMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handleSelectCheatSheet('markdown')}>
          {MARKDOWN_EDITOR_TEXT.markdownCheatsheetLabel}
        </MenuItem>
        <MenuItem onClick={() => handleSelectCheatSheet('mermaid')}>
          {MARKDOWN_EDITOR_TEXT.mermaidCheatsheetLabel}
        </MenuItem>
      </Menu>
    </Toolbar>
  );
}
