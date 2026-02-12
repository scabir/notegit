export const getParentPath = (path: string): string => {
  const lastSlash = path.lastIndexOf('/');
  return lastSlash > 0 ? path.substring(0, lastSlash) : '';
};

const URL_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

const normalizeFileSystemPath = (path: string): string => path.replace(/\\/g, '/');

const splitPathSegments = (value: string): string[] =>
  value.split('/').filter((segment) => segment.length > 0);

const decodePathSafely = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

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

export const resolveMarkdownLinkedFilePath = (
  markdownFilePath: string | null,
  href: string | undefined
): string | null => {
  if (!href) {
    return null;
  }

  const trimmedHref = href.trim();
  if (
    !trimmedHref ||
    trimmedHref.startsWith('#') ||
    trimmedHref.startsWith('//') ||
    URL_SCHEME_PATTERN.test(trimmedHref)
  ) {
    return null;
  }

  const hrefWithoutFragment = trimmedHref.split('#', 1)[0];
  const hrefWithoutQuery = hrefWithoutFragment.split('?', 1)[0];
  if (!hrefWithoutQuery) {
    return null;
  }

  const normalizedHrefPath = normalizeFileSystemPath(decodePathSafely(hrefWithoutQuery));
  const isRepoRootPath = normalizedHrefPath.startsWith('/');
  const targetSegments = splitPathSegments(normalizedHrefPath);

  if (targetSegments.length === 0) {
    return null;
  }

  const baseSegments = isRepoRootPath ? [] : splitPathSegments(getFileDirectoryPath(markdownFilePath));
  const resolvedSegments = [...baseSegments];

  for (const segment of targetSegments) {
    if (segment === '.') {
      continue;
    }
    if (segment === '..') {
      if (resolvedSegments.length > 0) {
        resolvedSegments.pop();
      }
      continue;
    }
    resolvedSegments.push(segment);
  }

  return resolvedSegments.length > 0 ? resolvedSegments.join('/') : null;
};
