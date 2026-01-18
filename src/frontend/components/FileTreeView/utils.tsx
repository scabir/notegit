import React from 'react';
import {
  Description as DescriptionIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Code as CodeIcon,
  TextSnippet as TextIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import type { FileTreeNode, FileType } from '../../../shared/types';

export const getFileIcon = (fileType?: FileType) => {
  switch (fileType) {
    case 'markdown':
      return <DescriptionIcon fontSize="small" sx={{ color: '#1976d2' }} />;
    case 'image':
      return <ImageIcon fontSize="small" sx={{ color: '#f50057' }} />;
    case 'pdf':
      return <PdfIcon fontSize="small" sx={{ color: '#d32f2f' }} />;
    case 'code':
      return <CodeIcon fontSize="small" sx={{ color: '#388e3c' }} />;
    case 'text':
      return <TextIcon fontSize="small" sx={{ color: '#757575' }} />;
    case 'json':
      return <CodeIcon fontSize="small" sx={{ color: '#ff9800' }} />;
    default:
      return <FileIcon fontSize="small" sx={{ color: '#757575' }} />;
  }
};

export const normalizeName = (value: string, isS3Repo: boolean): string =>
  isS3Repo ? value.replace(/ /g, '-') : value;

export const findNode = (nodes: FileTreeNode[], id: string): FileTreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

export const findNodeByPath = (nodes: FileTreeNode[], path: string): FileTreeNode | null => {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findNodeByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
};

export const getParentPath = (path: string): string => {
  const lastSlash = path.lastIndexOf('/');
  return lastSlash > 0 ? path.substring(0, lastSlash) : '';
};
