import { Stats } from 'fs';
export declare class FsAdapter {
    readFile(filePath: string): Promise<string>;
    writeFile(filePath: string, content: string): Promise<void>;
    deleteFile(filePath: string): Promise<void>;
    rename(oldPath: string, newPath: string): Promise<void>;
    mkdir(dirPath: string, options?: {
        recursive?: boolean;
    }): Promise<void>;
    readdir(dirPath: string): Promise<string[]>;
    stat(filePath: string): Promise<Stats>;
    exists(filePath: string): Promise<boolean>;
    copyFile(src: string, dest: string): Promise<void>;
    existsSync(filePath: string): boolean;
    private createError;
}
