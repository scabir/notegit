import { resolveMarkdownImageSrc } from '../../utils/pathUtils';

export const getFileName = (filePath: string | null): string => {
  if (!filePath) return '';
  return filePath.split('/').pop() || filePath;
};

export const isMarkdownFile = (filePath: string | null): boolean => {
  if (!filePath) return false;
  const ext = filePath.split('.').pop()?.toLowerCase();
  return ext === 'md' || ext === 'markdown';
};

export const resolveImageSrc = (
  repoPath: string | null,
  filePath: string | null,
  src: string | undefined,
): string => {
  return resolveMarkdownImageSrc(repoPath, filePath, src);
};
