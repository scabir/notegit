import { Code as CodeIcon } from '@mui/icons-material';
import type { TechStackItem } from './types';

export const APP_INFO = {
  name: 'notegit',
  version: '2.1.1',
  description: 'A Git- or S3-backed Markdown note-taking desktop application built with Electron',
  author: 'Suleyman Cabir Ataman',
  githubUrl: 'https://github.com/scabir',
  websiteUrl: '',
  license: 'MIT License',
} as const;

export const FEATURE_LIST = [
  'Markdown editing with live preview',
  'Git or S3 version history',
  'File and folder management',
  'Full-text search across notes',
  'Dark mode support',
  'Auto-save and sync',
  'File history and version viewing',
] as const;

export const TECH_STACK: TechStackItem[] = [
  { label: 'Electron', icon: CodeIcon },
  { label: 'React' },
  { label: 'TypeScript' },
  { label: 'Material-UI' },
  { label: 'CodeMirror' },
  { label: 'Git' },
];
