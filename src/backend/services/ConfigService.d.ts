import { FsAdapter } from '../adapters/FsAdapter';
import { CryptoAdapter } from '../adapters/CryptoAdapter';
import { FullConfig, AppSettings, RepoSettings, AppStateSnapshot } from '../../shared/types';
export declare class ConfigService {
    private fsAdapter;
    private cryptoAdapter;
    private configDir;
    private appSettingsPath;
    private repoSettingsPath;
    private appStatePath;
    constructor(fsAdapter: FsAdapter, cryptoAdapter: CryptoAdapter);
    ensureConfigDir(): Promise<void>;
    getFull(): Promise<FullConfig>;
    getAppSettings(): Promise<AppSettings>;
    updateAppSettings(settings: Partial<AppSettings>): Promise<void>;
    getRepoSettings(): Promise<RepoSettings | null>;
    updateRepoSettings(settings: RepoSettings): Promise<void>;
    getAppState(): Promise<AppStateSnapshot>;
    updateAppState(state: Partial<AppStateSnapshot>): Promise<void>;
    clearRepoSettings(): Promise<void>;
}
