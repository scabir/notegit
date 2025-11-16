import * as path from 'path';
import { app } from 'electron';
import { FsAdapter } from '../adapters/FsAdapter';
import { CryptoAdapter } from '../adapters/CryptoAdapter';
import {
  FullConfig,
  AppSettings,
  RepoSettings,
  AppStateSnapshot,
  DEFAULT_APP_SETTINGS,
  DEFAULT_APP_STATE,
} from '../../shared/types';
import { logger } from '../utils/logger';

export class ConfigService {
  private configDir: string;
  private appSettingsPath: string;
  private repoSettingsPath: string;
  private appStatePath: string;

  constructor(
    private fsAdapter: FsAdapter,
    private cryptoAdapter: CryptoAdapter
  ) {
    this.configDir = path.join(app.getPath('userData'), 'config');
    this.appSettingsPath = path.join(this.configDir, 'app-settings.json');
    this.repoSettingsPath = path.join(this.configDir, 'repo-settings.json');
    this.appStatePath = path.join(this.configDir, 'app-state.json');
  }

  async ensureConfigDir(): Promise<void> {
    await this.fsAdapter.mkdir(this.configDir, { recursive: true });
  }

  async getFull(): Promise<FullConfig> {
    logger.info('Loading full configuration');
    
    await this.ensureConfigDir();

    const appSettings = await this.getAppSettings();
    const repoSettings = await this.getRepoSettings();
    const appStateSnapshot = await this.getAppState();

    return {
      appSettings,
      repoSettings,
      appStateSnapshot,
    };
  }

  async getAppSettings(): Promise<AppSettings> {
    try {
      if (await this.fsAdapter.exists(this.appSettingsPath)) {
        const content = await this.fsAdapter.readFile(this.appSettingsPath);
        const settings = JSON.parse(content);
        logger.debug('Loaded app settings', { settings });
        // Merge with defaults to handle missing fields
        return { ...DEFAULT_APP_SETTINGS, ...settings };
      }
    } catch (error) {
      logger.error('Failed to load app settings, using defaults', { error });
    }

    // Return defaults if file doesn't exist or failed to load
    return DEFAULT_APP_SETTINGS;
  }

  async updateAppSettings(settings: Partial<AppSettings>): Promise<void> {
    logger.info('Updating app settings', { settings });
    
    await this.ensureConfigDir();

    const current = await this.getAppSettings();
    const updated = { ...current, ...settings };

    await this.fsAdapter.writeFile(this.appSettingsPath, JSON.stringify(updated, null, 2));
    logger.debug('App settings saved');
  }

  async getRepoSettings(): Promise<RepoSettings | null> {
    try {
      if (await this.fsAdapter.exists(this.repoSettingsPath)) {
        const content = await this.fsAdapter.readFile(this.repoSettingsPath);
        const settings = JSON.parse(content);
        
        // Decrypt PAT
        if (settings.pat) {
          settings.pat = this.cryptoAdapter.decrypt(settings.pat);
        }
        
        logger.debug('Loaded repo settings (PAT decrypted)');
        return settings;
      }
    } catch (error) {
      logger.error('Failed to load repo settings', { error });
    }

    return null;
  }

  async updateRepoSettings(settings: RepoSettings): Promise<void> {
    logger.info('Updating repo settings', {
      remoteUrl: settings.remoteUrl,
      branch: settings.branch,
      authMethod: settings.authMethod,
    });
    
    await this.ensureConfigDir();

    // Encrypt PAT before saving
    const toSave = { ...settings };
    if (toSave.pat) {
      toSave.pat = this.cryptoAdapter.encrypt(toSave.pat);
    }

    await this.fsAdapter.writeFile(this.repoSettingsPath, JSON.stringify(toSave, null, 2));
    logger.debug('Repo settings saved (PAT encrypted)');
  }

  async getAppState(): Promise<AppStateSnapshot> {
    try {
      if (await this.fsAdapter.exists(this.appStatePath)) {
        const content = await this.fsAdapter.readFile(this.appStatePath);
        const state = JSON.parse(content);
        logger.debug('Loaded app state', { state });
        return { ...DEFAULT_APP_STATE, ...state };
      }
    } catch (error) {
      logger.error('Failed to load app state, using defaults', { error });
    }

    return DEFAULT_APP_STATE;
  }

  async updateAppState(state: Partial<AppStateSnapshot>): Promise<void> {
    await this.ensureConfigDir();

    const current = await this.getAppState();
    const updated = { ...current, ...state };

    await this.fsAdapter.writeFile(this.appStatePath, JSON.stringify(updated, null, 2));
    logger.debug('App state saved');
  }

  async clearRepoSettings(): Promise<void> {
    logger.info('Clearing repo settings');
    
    if (await this.fsAdapter.exists(this.repoSettingsPath)) {
      await this.fsAdapter.deleteFile(this.repoSettingsPath);
    }
  }
}

