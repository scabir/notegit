export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  fileType?: FileType;
  children?: FileTreeNode[];
  isExpanded?: boolean;
}

export enum FileType {
  MARKDOWN = 'markdown',
  IMAGE = 'image',
  PDF = 'pdf',
  TEXT = 'text',
  JSON = 'json',
  CODE = 'code',
  OTHER = 'other',
}

export interface FileContent {
  path: string;
  content: string;
  type: FileType;
  size?: number;
  lastModified?: Date;
}

export interface NoteContent extends FileContent {
  type: FileType.MARKDOWN;
}
