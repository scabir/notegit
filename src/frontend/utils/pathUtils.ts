export const getParentPath = (path: string): string => {
  const lastSlash = path.lastIndexOf('/');
  return lastSlash > 0 ? path.substring(0, lastSlash) : '';
};

const URL_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

const normalizeFileSystemPath = (path: string): string => path.replace(/\\/g, '/');

const buildFileRootUrl = (repoPath: string): URL => {
  const normalizedRepoPath = normalizeFileSystemPath(repoPath).replace(/\/+$/, '');
  const hasLeadingSlash = normalizedRepoPath.startsWith('/');
  const rootPath = hasLeadingSlash ? normalizedRepoPath : `/${normalizedRepoPath}`;
  return new URL(`file://${rootPath}/`);
};

const getFileDirectoryPath = (filePath: string | null): string => {
  if (!filePath) {
    return '';
  }
  const normalizedFilePath = normalizeFileSystemPath(filePath);
  const lastSlash = normalizedFilePath.lastIndexOf('/');
  if (lastSlash < 0) {
    return '';
  }
  return normalizedFilePath.slice(0, lastSlash + 1);
};

export const resolveMarkdownImageSrc = (
  repoPath: string | null,
  markdownFilePath: string | null,
  src: string | undefined
): string => {
  if (!src) {
    return '';
  }
  if (!repoPath || src.startsWith('//') || URL_SCHEME_PATTERN.test(src)) {
    return src;
  }

  const normalizedSrc = normalizeFileSystemPath(src);
  const rootUrl = buildFileRootUrl(repoPath);
  const baseUrl = normalizedSrc.startsWith('/')
    ? rootUrl
    : new URL(getFileDirectoryPath(markdownFilePath), rootUrl);
  const relativeSrc = normalizedSrc.startsWith('/') ? normalizedSrc.slice(1) : normalizedSrc;
  return new URL(relativeSrc, baseUrl).toString();
};
