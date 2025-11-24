import * as path from 'path';
import { app } from 'electron';
import { FsAdapter } from '../adapters/FsAdapter';
import { CryptoAdapter } from '../adapters/CryptoAdapter';
import {
  FullConfig,
  AppSettings,
  RepoSettings,
  AppStateSnapshot,
  Profile,
  AuthMethod,
  DEFAULT_APP_SETTINGS,
  DEFAULT_APP_STATE,
} from '../../shared/types';
import { logger } from '../utils/logger';
import { 
  slugifyProfileName, 
  getDefaultReposBaseDir, 
  extractRepoNameFromUrl,
  findUniqueFolderName 
} from '../utils/profileHelpers';

export class ConfigService {
  private configDir: string;
  private appSettingsPath: string;
  private repoSettingsPath: string;
  private appStatePath: string;
  private profilesPath: string;
  private activeProfilePath: string;

  constructor(
    private fsAdapter: FsAdapter,
    private cryptoAdapter: CryptoAdapter
  ) {
    this.configDir = path.join(app.getPath('userData'), 'config');
    this.appSettingsPath = path.join(this.configDir, 'app-settings.json');
    this.repoSettingsPath = path.join(this.configDir, 'repo-settings.json');
    this.appStatePath = path.join(this.configDir, 'app-state.json');
    this.profilesPath = path.join(this.configDir, 'profiles.json');
    this.activeProfilePath = path.join(this.configDir, 'active-profile.json');
  }

  async ensureConfigDir(): Promise<void> {
    await this.fsAdapter.mkdir(this.configDir, { recursive: true });
  }

  async getFull(): Promise<FullConfig> {
    logger.info('Loading full configuration');
    
    await this.ensureConfigDir();
    await this.migrateToProfiles();

    const appSettings = await this.getAppSettings();
    const repoSettings = await this.getRepoSettings();
    const appStateSnapshot = await this.getAppState();
    const profiles = await this.getProfiles();
    const activeProfileId = await this.getActiveProfileId();

    return {
      appSettings,
      repoSettings,
      profiles,
      activeProfileId,
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
    // First check if we're using profiles
    const activeProfileId = await this.getActiveProfileId();
    if (activeProfileId) {
      const profiles = await this.getProfiles();
      const activeProfile = profiles.find(p => p.id === activeProfileId);
      if (activeProfile) {
        logger.debug('Loaded repo settings from active profile');
        return activeProfile.repoSettings;
      }
    }

    // Fall back to legacy repo settings file
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

  // Profile management methods

  async getProfiles(): Promise<Profile[]> {
    try {
      if (await this.fsAdapter.exists(this.profilesPath)) {
        const content = await this.fsAdapter.readFile(this.profilesPath);
        const profiles = JSON.parse(content);
        
        // Decrypt PATs for all profiles
        for (const profile of profiles) {
          if (profile.repoSettings.pat) {
            profile.repoSettings.pat = this.cryptoAdapter.decrypt(profile.repoSettings.pat);
          }
        }
        
        logger.debug('Loaded profiles', { count: profiles.length });
        return profiles;
      }
    } catch (error) {
      logger.error('Failed to load profiles', { error });
    }

    return [];
  }

  async saveProfiles(profiles: Profile[]): Promise<void> {
    logger.info('Saving profiles', { count: profiles.length });
    
    await this.ensureConfigDir();

    // Encrypt PATs before saving
    const toSave = profiles.map(profile => ({
      ...profile,
      repoSettings: {
        ...profile.repoSettings,
        pat: profile.repoSettings.pat
          ? this.cryptoAdapter.encrypt(profile.repoSettings.pat)
          : '',
      },
    }));

    await this.fsAdapter.writeFile(this.profilesPath, JSON.stringify(toSave, null, 2));
    logger.debug('Profiles saved');
  }

  async getActiveProfileId(): Promise<string | null> {
    try {
      if (await this.fsAdapter.exists(this.activeProfilePath)) {
        const content = await this.fsAdapter.readFile(this.activeProfilePath);
        const data = JSON.parse(content);
        logger.debug('Loaded active profile ID', { id: data.activeProfileId });
        return data.activeProfileId || null;
      }
    } catch (error) {
      logger.error('Failed to load active profile ID', { error });
    }

    return null;
  }

  async setActiveProfileId(profileId: string | null): Promise<void> {
    logger.info('Setting active profile ID', { profileId });
    
    await this.ensureConfigDir();

    await this.fsAdapter.writeFile(
      this.activeProfilePath,
      JSON.stringify({ activeProfileId: profileId }, null, 2)
    );
    
    logger.debug('Active profile ID saved');
  }

  async createProfile(name: string, repoSettings: Partial<RepoSettings>): Promise<Profile> {
    logger.info('Creating new profile', { name });
    
    const profiles = await this.getProfiles();
    
    // Generate a safe folder name from the profile name
    const baseName = slugifyProfileName(name);
    const baseDir = getDefaultReposBaseDir();
    
    // Ensure base directory exists
    await this.fsAdapter.mkdir(baseDir, { recursive: true });
    
    // Find a unique folder name
    const folderName = await findUniqueFolderName(baseDir, baseName, this.fsAdapter);
    const localPath = path.join(baseDir, folderName);
    
    logger.info('Assigned local path for profile', { name, localPath });
    
    // Create the full repo settings with the auto-generated local path
    const fullRepoSettings: RepoSettings = {
      remoteUrl: repoSettings.remoteUrl || '',
      branch: repoSettings.branch || 'main',
      localPath,
      pat: repoSettings.pat || '',
      authMethod: repoSettings.authMethod || AuthMethod.PAT,
    };
    
    const newProfile: Profile = {
      id: `profile-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name,
      repoSettings: fullRepoSettings,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    };

    profiles.push(newProfile);
    await this.saveProfiles(profiles);
    
    logger.info('Profile created', { id: newProfile.id });
    return newProfile;
  }

  async updateProfile(profileId: string, updates: Partial<Omit<Profile, 'id'>>): Promise<void> {
    logger.info('Updating profile', { profileId });
    
    const profiles = await this.getProfiles();
    const index = profiles.findIndex(p => p.id === profileId);
    
    if (index === -1) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    profiles[index] = {
      ...profiles[index],
      ...updates,
    };

    await this.saveProfiles(profiles);
    logger.debug('Profile updated');
  }

  async deleteProfile(profileId: string): Promise<void> {
    logger.info('Deleting profile', { profileId });
    
    const profiles = await this.getProfiles();
    const filtered = profiles.filter(p => p.id !== profileId);
    
    if (filtered.length === profiles.length) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    await this.saveProfiles(filtered);
    
    // If this was the active profile, clear it
    const activeId = await this.getActiveProfileId();
    if (activeId === profileId) {
      await this.setActiveProfileId(null);
    }
    
    logger.info('Profile deleted');
  }

  async migrateToProfiles(): Promise<void> {
    // Check if migration is needed
    const profiles = await this.getProfiles();
    const activeProfileId = await this.getActiveProfileId();
    
    // If we already have profiles, no migration needed
    if (profiles.length > 0 || activeProfileId) {
      return;
    }

    // Check if we have legacy repo settings
    try {
      if (await this.fsAdapter.exists(this.repoSettingsPath)) {
        logger.info('Migrating legacy repo settings to first profile');
        
        const content = await this.fsAdapter.readFile(this.repoSettingsPath);
        const repoSettings = JSON.parse(content);
        
        // Decrypt PAT
        if (repoSettings.pat) {
          repoSettings.pat = this.cryptoAdapter.decrypt(repoSettings.pat);
        }

        // Derive profile name from repo
        let profileName = 'Default Profile';
        
        if (repoSettings.remoteUrl) {
          // Extract repo name from remote URL
          profileName = extractRepoNameFromUrl(repoSettings.remoteUrl);
        } else if (repoSettings.localPath) {
          // Use the local folder name as fallback
          profileName = path.basename(repoSettings.localPath);
        }
        
        logger.info('Derived profile name for migration', { profileName });

        // Create first profile from legacy settings
        const firstProfile: Profile = {
          id: 'profile-default',
          name: profileName,
          repoSettings,
          createdAt: Date.now(),
          lastUsedAt: Date.now(),
        };

        await this.saveProfiles([firstProfile]);
        await this.setActiveProfileId(firstProfile.id);
        
        logger.info('Migration complete: created profile from legacy settings', { profileName });
      }
    } catch (error) {
      logger.error('Failed to migrate to profiles', { error });
    }
  }
}

