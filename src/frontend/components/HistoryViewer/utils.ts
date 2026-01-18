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
  src: string | undefined,
): string => {
  if (!src) return '';
  if (!repoPath || src.startsWith('http') || src.startsWith('data:')) {
    return src;
  }
  return `file://${repoPath}/${src}`;
};
