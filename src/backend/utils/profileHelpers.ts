import * as path from 'path';
import { app } from 'electron';

export function slugifyProfileName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/[-_]+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    || 'repo';
}

export function getDefaultReposBaseDir(): string {
  return path.join(app.getPath('userData'), 'repos');
}

export function extractRepoNameFromUrl(remoteUrl: string): string {
  try {
    let cleaned = remoteUrl.replace(/\.git$/, '');
    
    const parts = cleaned.split('/');
    const lastPart = parts[parts.length - 1];
    
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



