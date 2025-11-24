import * as path from 'path';
import { app } from 'electron';

/**
 * Convert a profile name to a filesystem-safe folder name
 * Rules:
 * - Only lowercase letters, digits, hyphens, and underscores
 * - Replace spaces and invalid characters with hyphens
 * - Trim leading/trailing separators
 */
export function slugifyProfileName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove any character that's not alphanumeric, hyphen, or underscore
    .replace(/[^a-z0-9-_]/g, '-')
    // Replace multiple consecutive hyphens/underscores with a single hyphen
    .replace(/[-_]+/g, '-')
    // Remove leading and trailing hyphens/underscores
    .replace(/^[-_]+|[-_]+$/g, '')
    // Fallback to 'repo' if the result is empty
    || 'repo';
}

/**
 * Get the default base directory for all repos
 */
export function getDefaultReposBaseDir(): string {
  return path.join(app.getPath('userData'), 'repos');
}

/**
 * Extract repo name from a git remote URL
 * Examples:
 * - https://github.com/user/repo.git -> repo
 * - git@github.com:user/repo.git -> repo
 * - https://github.com/user/repo -> repo
 */
export function extractRepoNameFromUrl(remoteUrl: string): string {
  try {
    // Remove .git suffix if present
    let cleaned = remoteUrl.replace(/\.git$/, '');
    
    // Extract the last path segment
    const parts = cleaned.split('/');
    const lastPart = parts[parts.length - 1];
    
    // Handle SSH format (user@host:user/repo)
    if (lastPart.includes(':')) {
      const colonParts = lastPart.split(':');
      const afterColon = colonParts[colonParts.length - 1];
      const slashParts = afterColon.split('/');
      return slashParts[slashParts.length - 1] || 'repo';
    }
    
    return lastPart || 'repo';
  } catch (error) {
    return 'repo';
  }
}

/**
 * Find a unique folder name by appending -1, -2, etc. if the folder exists
 */
export async function findUniqueFolderName(
  baseDir: string,
  baseName: string,
  fsAdapter: { exists: (path: string) => Promise<boolean> }
): Promise<string> {
  let folderName = baseName;
  let counter = 1;
  let fullPath = path.join(baseDir, folderName);
  
  while (await fsAdapter.exists(fullPath)) {
    folderName = `${baseName}-${counter}`;
    fullPath = path.join(baseDir, folderName);
    counter++;
  }
  
  return folderName;
}


