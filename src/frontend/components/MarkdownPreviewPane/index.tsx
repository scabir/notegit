import React from 'react';
import { Box, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDeflist from 'remark-deflist';
import { MermaidDiagram } from '../MermaidDiagram';
import { MARKDOWN_EDITOR_TEXT } from '../MarkdownEditor/constants';
import { remarkHighlight } from '../../utils/remarkHighlight';
import { resolveMarkdownImageSrc, resolveMarkdownLinkedFilePath } from '../../utils/pathUtils';
import markdownCheatsheetHtml from '../../assets/cheatsheets/markdown.html?raw';
import mermaidCheatsheetHtml from '../../assets/cheatsheets/mermaid.html?raw';
import { MARKDOWN_PREVIEW_PANE } from './constants';
import {
  cheatSheetContentSx,
  cheatSheetHeaderSx,
  previewPaneSx,
  previewPaperSx,
} from './styles';
import type { MarkdownPreviewPaneProps } from './types';

export function MarkdownPreviewPane({
  isDark,
  viewMode,
  editorWidth,
  repoPath,
  filePath,
  content,
  cheatSheetType,
  onCloseCheatSheet,
  onOpenLinkedFile,
}: MarkdownPreviewPaneProps) {
  const activeCheatSheetHtml = cheatSheetType === 'markdown'
    ? markdownCheatsheetHtml
    : cheatSheetType === 'mermaid'
      ? mermaidCheatsheetHtml
      : null;

  const activeCheatSheetLabel = cheatSheetType === 'markdown'
    ? MARKDOWN_EDITOR_TEXT.markdownCheatsheetLabel
    : cheatSheetType === 'mermaid'
      ? MARKDOWN_EDITOR_TEXT.mermaidCheatsheetLabel
      : '';

  return (
    <Box sx={previewPaneSx(isDark, viewMode, editorWidth)}>
      <Paper sx={previewPaperSx(isDark)} elevation={0}>
        {activeCheatSheetHtml ? (
          <>
            <Box sx={cheatSheetHeaderSx}>
              <Typography variant="subtitle1">
                {activeCheatSheetLabel}
              </Typography>
              <Tooltip title={MARKDOWN_EDITOR_TEXT.closeCheatsheetLabel}>
                <IconButton
                  size="small"
                  onClick={onCloseCheatSheet}
                  data-testid={MARKDOWN_PREVIEW_PANE.closeCheatSheetTestId}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box
              sx={cheatSheetContentSx}
              dangerouslySetInnerHTML={{ __html: activeCheatSheetHtml }}
            />
          </>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkDeflist, remarkHighlight]}
            components={{
              img: ({ node: _node, ...props }) => {
                const src = resolveMarkdownImageSrc(repoPath, filePath, props.src);
                return (
                  <img
                    {...props}
                    src={src}
                    style={{ maxWidth: '100%', height: 'auto' }}
                    alt={props.alt || ''}
                  />
                );
              },
              a: ({ node: _node, href, ...props }) => {
                const linkedFilePath = resolveMarkdownLinkedFilePath(filePath, href);
                const isInternalLink = Boolean(linkedFilePath && onOpenLinkedFile);

                const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
                  if (typeof props.onClick === 'function') {
                    props.onClick(event);
                  }
                  if (event.defaultPrevented) {
                    return;
                  }
                  if (!isInternalLink || !linkedFilePath || !onOpenLinkedFile) {
                    return;
                  }
                  event.preventDefault();
                  void onOpenLinkedFile(linkedFilePath);
                };

                return (
                  <a
                    {...props}
                    href={href}
                    onClick={handleLinkClick}
                  />
                );
              },
              code: ({ inline, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                if (!inline && match?.[1] === 'mermaid') {
                  const diagramCode = String(children).replace(/\n$/, '');
                  return <MermaidDiagram code={diagramCode} isDark={isDark} />;
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
        )}
      </Paper>
    </Box>
  );
}
