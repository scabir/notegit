import * as path from "path";
import { app } from "electron";
import { FsAdapter } from "../adapters/FsAdapter";
import { CryptoAdapter } from "../adapters/CryptoAdapter";
import {
  FullConfig,
  AppSettings,
  RepoSettings,
  GitRepoSettings,
  S3RepoSettings,
  LocalRepoSettings,
  RepoProviderType,
  AppStateSnapshot,
  Profile,
  AuthMethod,
  ApiErrorCode,
  DEFAULT_APP_SETTINGS,
  DEFAULT_APP_STATE,
  REPO_PROVIDERS,
} from "../../shared/types";
import { logger } from "../utils/logger";
import {
  slugifyProfileName,
  getDefaultReposBaseDir,
  extractRepoNameFromUrl,
  findUniqueFolderName,
} from "../utils/profileHelpers";

export class ConfigService {
  private configDir: string;
  private appSettingsPath: string;
  private repoSettingsPath: string;
  private appStatePath: string;
  private profilesPath: string;
  private activeProfilePath: string;
  private favoritesPath: string;

  constructor(
    private fsAdapter: FsAdapter,
    private cryptoAdapter: CryptoAdapter,
  ) {
    this.configDir = path.join(app.getPath("userData"), "config");
    this.appSettingsPath = path.join(this.configDir, "app-settings.json");
    this.repoSettingsPath = path.join(this.configDir, "repo-settings.json");
    this.appStatePath = path.join(this.configDir, "app-state.json");
    this.profilesPath = path.join(this.configDir, "profiles.json");
    this.activeProfilePath = path.join(this.configDir, "active-profile.json");
    this.favoritesPath = path.join(this.configDir, "favorites.json");
  }

  private normalizeRepoSettings(raw: any): RepoSettings {
    const provider: RepoProviderType =
      raw?.provider === REPO_PROVIDERS.s3
        ? REPO_PROVIDERS.s3
        : raw?.provider === REPO_PROVIDERS.local
          ? REPO_PROVIDERS.local
          : REPO_PROVIDERS.git;
    if (provider === REPO_PROVIDERS.s3) {
      return {
        provider: REPO_PROVIDERS.s3,
        bucket: raw?.bucket || "",
        region: raw?.region || "",
        prefix: raw?.prefix || "",
        localPath: raw?.localPath || "",
        accessKeyId: raw?.accessKeyId || "",
        secretAccessKey: raw?.secretAccessKey || "",
        sessionToken: raw?.sessionToken || "",
      };
    }

    if (provider === REPO_PROVIDERS.local) {
      return {
        provider: REPO_PROVIDERS.local,
        localPath: raw?.localPath || "",
      };
    }

    return {
      provider: REPO_PROVIDERS.git,
      remoteUrl: raw?.remoteUrl || "",
      branch: raw?.branch || "main",
      localPath: raw?.localPath || "",
      pat: raw?.pat || "",
      authMethod: raw?.authMethod || AuthMethod.PAT,
    };
  }

  private decryptRepoSettings(settings: RepoSettings): RepoSettings {
    if (settings.provider === REPO_PROVIDERS.s3) {
      const decrypted: S3RepoSettings = { ...settings };
      if (decrypted.accessKeyId) {
        decrypted.accessKeyId = this.cryptoAdapter.decrypt(
          decrypted.accessKeyId,
        );
      }
      if (decrypted.secretAccessKey) {
        decrypted.secretAccessKey = this.cryptoAdapter.decrypt(
          decrypted.secretAccessKey,
        );
      }
      if (decrypted.sessionToken) {
        decrypted.sessionToken = this.cryptoAdapter.decrypt(
          decrypted.sessionToken,
        );
      }
      return decrypted;
    }

    if (settings.provider === REPO_PROVIDERS.local) {
      return settings;
    }

    const decrypted: GitRepoSettings = { ...settings };
    if (decrypted.pat) {
      decrypted.pat = this.cryptoAdapter.decrypt(decrypted.pat);
    }
    return decrypted;
  }

  private encryptRepoSettings(settings: RepoSettings): RepoSettings {
    if (settings.provider === REPO_PROVIDERS.s3) {
      const encrypted: S3RepoSettings = { ...settings };
      if (encrypted.accessKeyId) {
        encrypted.accessKeyId = this.cryptoAdapter.encrypt(
          encrypted.accessKeyId,
        );
      }
      if (encrypted.secretAccessKey) {
        encrypted.secretAccessKey = this.cryptoAdapter.encrypt(
          encrypted.secretAccessKey,
        );
      }
      if (encrypted.sessionToken) {
        encrypted.sessionToken = this.cryptoAdapter.encrypt(
          encrypted.sessionToken,
        );
      }
      return encrypted;
    }

    if (settings.provider === REPO_PROVIDERS.local) {
      return settings;
    }

    const encrypted: GitRepoSettings = { ...settings };
    if (encrypted.pat) {
      encrypted.pat = this.cryptoAdapter.encrypt(encrypted.pat);
    }
    return encrypted;
  }

  async ensureConfigDir(): Promise<void> {
    await this.fsAdapter.mkdir(this.configDir, { recursive: true });
  }

  async getFull(): Promise<FullConfig> {
    logger.info("Loading full configuration");

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
        logger.debug("Loaded app settings", { settings });
        return { ...DEFAULT_APP_SETTINGS, ...settings };
      }
    } catch (error) {
      logger.error("Failed to load app settings, using defaults", { error });
    }

    return DEFAULT_APP_SETTINGS;
  }

  async updateAppSettings(settings: Partial<AppSettings>): Promise<void> {
    logger.info("Updating app settings", { settings });

    await this.ensureConfigDir();

    const current = await this.getAppSettings();
    const updated = { ...current, ...settings };

    await this.fsAdapter.writeFile(
      this.appSettingsPath,
      JSON.stringify(updated, null, 2),
    );
    logger.debug("App settings saved");
  }

  async getFavorites(): Promise<string[]> {
    try {
      await this.ensureConfigDir();
      if (await this.fsAdapter.exists(this.favoritesPath)) {
        const content = await this.fsAdapter.readFile(this.favoritesPath);
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed.filter((entry) => typeof entry === "string");
        }
      } else {
        await this.fsAdapter.writeFile(
          this.favoritesPath,
          JSON.stringify([], null, 2),
        );
      }
    } catch (error: any) {
      logger.error("Failed to load favorites", { error });
    }
    return [];
  }

  async updateFavorites(favorites: string[]): Promise<void> {
    logger.info("Updating favorites", { total: favorites.length });
    await this.ensureConfigDir();
    await this.fsAdapter.writeFile(
      this.favoritesPath,
      JSON.stringify(favorites, null, 2),
    );
    logger.debug("Favorites saved");
  }

  async getRepoSettings(): Promise<RepoSettings | null> {
    const activeProfileId = await this.getActiveProfileId();
    if (activeProfileId) {
      const profiles = await this.getProfiles();
      const activeProfile = profiles.find((p) => p.id === activeProfileId);
      if (activeProfile) {
        logger.debug("Loaded repo settings from active profile");
        return activeProfile.repoSettings;
      }
    }

    try {
      if (await this.fsAdapter.exists(this.repoSettingsPath)) {
        const content = await this.fsAdapter.readFile(this.repoSettingsPath);
        const rawSettings = JSON.parse(content);
        const settings = this.normalizeRepoSettings(rawSettings);
        const decrypted = this.decryptRepoSettings(settings);

        logger.debug("Loaded repo settings");
        return decrypted;
      }
    } catch (error) {
      logger.error("Failed to load repo settings", { error });
    }

    return null;
  }

  async updateRepoSettings(settings: RepoSettings): Promise<void> {
    const existing = await this.getRepoSettings();
    if (existing && existing.provider !== settings.provider) {
      throw {
        code: ApiErrorCode.REPO_PROVIDER_MISMATCH,
        message: "Repository provider cannot be changed",
        details: { from: existing.provider, to: settings.provider },
      };
    }

    logger.info("Updating repo settings", {
      provider: settings.provider,
      remoteUrl:
        settings.provider === REPO_PROVIDERS.git
          ? settings.remoteUrl
          : undefined,
      bucket:
        settings.provider === REPO_PROVIDERS.s3 ? settings.bucket : undefined,
      region:
        settings.provider === REPO_PROVIDERS.s3 ? settings.region : undefined,
    });

    await this.ensureConfigDir();

    const toSave = this.encryptRepoSettings(settings);
    await this.fsAdapter.writeFile(
      this.repoSettingsPath,
      JSON.stringify(toSave, null, 2),
    );
    logger.debug("Repo settings saved");
  }

  async getAppState(): Promise<AppStateSnapshot> {
    try {
      if (await this.fsAdapter.exists(this.appStatePath)) {
        const content = await this.fsAdapter.readFile(this.appStatePath);
        const state = JSON.parse(content);
        logger.debug("Loaded app state", { state });
        return { ...DEFAULT_APP_STATE, ...state };
      }
    } catch (error) {
      logger.error("Failed to load app state, using defaults", { error });
    }

    return DEFAULT_APP_STATE;
  }

  async updateAppState(state: Partial<AppStateSnapshot>): Promise<void> {
    await this.ensureConfigDir();

    const current = await this.getAppState();
    const updated = { ...current, ...state };

    await this.fsAdapter.writeFile(
      this.appStatePath,
      JSON.stringify(updated, null, 2),
    );
    logger.debug("App state saved");
  }

  async clearRepoSettings(): Promise<void> {
    logger.info("Clearing repo settings");

    if (await this.fsAdapter.exists(this.repoSettingsPath)) {
      await this.fsAdapter.deleteFile(this.repoSettingsPath);
    }
  }

  async getProfiles(): Promise<Profile[]> {
    try {
      if (await this.fsAdapter.exists(this.profilesPath)) {
        const content = await this.fsAdapter.readFile(this.profilesPath);
        const profiles = JSON.parse(content);
        const hydrated = profiles.map((profile: Profile) => {
          const normalizedSettings = this.normalizeRepoSettings(
            profile.repoSettings,
          );
          return {
            ...profile,
            repoSettings: this.decryptRepoSettings(normalizedSettings),
          };
        });

        logger.debug("Loaded profiles", { count: profiles.length });
        return hydrated;
      }
    } catch (error) {
      logger.error("Failed to load profiles", { error });
    }

    return [];
  }

  async saveProfiles(profiles: Profile[]): Promise<void> {
    logger.info("Saving profiles", { count: profiles.length });

    await this.ensureConfigDir();

    const toSave = profiles.map((profile) => ({
      ...profile,
      repoSettings: this.encryptRepoSettings(profile.repoSettings),
    }));

    await this.fsAdapter.writeFile(
      this.profilesPath,
      JSON.stringify(toSave, null, 2),
    );
    logger.debug("Profiles saved");
  }

  async getActiveProfileId(): Promise<string | null> {
    try {
      if (await this.fsAdapter.exists(this.activeProfilePath)) {
        const content = await this.fsAdapter.readFile(this.activeProfilePath);
        const data = JSON.parse(content);
        logger.debug("Loaded active profile ID", { id: data.activeProfileId });
        return data.activeProfileId || null;
      }
    } catch (error) {
      logger.error("Failed to load active profile ID", { error });
    }

    return null;
  }

  async setActiveProfileId(profileId: string | null): Promise<void> {
    logger.info("Setting active profile ID", { profileId });

    await this.ensureConfigDir();

    await this.fsAdapter.writeFile(
      this.activeProfilePath,
      JSON.stringify({ activeProfileId: profileId }, null, 2),
    );

    logger.debug("Active profile ID saved");
  }

  async createProfile(
    name: string,
    repoSettings: Partial<RepoSettings>,
  ): Promise<Profile> {
    logger.info("Creating new profile", { name });

    const profiles = await this.getProfiles();

    const provider = this.resolveProviderType(repoSettings);
    const baseName = slugifyProfileName(name);
    const baseDir = getDefaultReposBaseDir();

    await this.fsAdapter.mkdir(baseDir, { recursive: true });

    const baseFolderName = this.getProfileBaseFolderName(baseName, provider);
    const folderName = await findUniqueFolderName(
      baseDir,
      baseFolderName,
      this.fsAdapter,
    );
    const localPath = path.join(baseDir, folderName);

    logger.info("Assigned local path for profile", { name, localPath });

    let fullRepoSettings: RepoSettings;
    if (provider === REPO_PROVIDERS.git) {
      fullRepoSettings = this.buildGitProfileSettings(repoSettings, localPath);
    } else if (provider === REPO_PROVIDERS.s3) {
      fullRepoSettings = this.buildS3ProfileSettings(repoSettings, localPath);
    } else {
      fullRepoSettings = this.buildLocalProfileSettings(localPath);
    }

    const newProfile: Profile = {
      id: `profile-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name,
      repoSettings: fullRepoSettings,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    };

    profiles.push(newProfile);
    await this.saveProfiles(profiles);

    logger.info("Profile created", { id: newProfile.id });
    return newProfile;
  }

  private resolveProviderType(
    repoSettings: Partial<RepoSettings>,
  ): RepoProviderType {
    if (repoSettings.provider === REPO_PROVIDERS.s3) {
      return REPO_PROVIDERS.s3;
    }
    if (repoSettings.provider === REPO_PROVIDERS.local) {
      return REPO_PROVIDERS.local;
    }
    return REPO_PROVIDERS.git;
  }

  private getProfileBaseFolderName(
    baseName: string,
    provider: RepoProviderType,
  ): string {
    if (provider === REPO_PROVIDERS.s3) {
      return `${baseName}-s3`;
    }
    if (provider === REPO_PROVIDERS.local) {
      return `${baseName}-local`;
    }
    return baseName;
  }

  private buildGitProfileSettings(
    repoSettings: Partial<RepoSettings>,
    localPath: string,
  ): GitRepoSettings {
    const gitSettings = repoSettings as Partial<GitRepoSettings>;
    return {
      provider: REPO_PROVIDERS.git,
      remoteUrl: gitSettings.remoteUrl || "",
      branch: gitSettings.branch || "main",
      localPath,
      pat: gitSettings.pat || "",
      authMethod: gitSettings.authMethod || AuthMethod.PAT,
    };
  }

  private buildS3ProfileSettings(
    repoSettings: Partial<RepoSettings>,
    localPath: string,
  ): S3RepoSettings {
    const s3Settings = repoSettings as Partial<S3RepoSettings>;
    if (
      !s3Settings.bucket ||
      !s3Settings.region ||
      !s3Settings.accessKeyId ||
      !s3Settings.secretAccessKey
    ) {
      throw {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: "S3 bucket, region, access key, and secret are required",
      };
    }

    return {
      provider: REPO_PROVIDERS.s3,
      bucket: s3Settings.bucket,
      region: s3Settings.region,
      prefix: s3Settings.prefix || "",
      localPath,
      accessKeyId: s3Settings.accessKeyId,
      secretAccessKey: s3Settings.secretAccessKey,
      sessionToken: s3Settings.sessionToken || "",
    };
  }

  private buildLocalProfileSettings(localPath: string): LocalRepoSettings {
    return {
      provider: REPO_PROVIDERS.local,
      localPath,
    };
  }

  async updateProfile(
    profileId: string,
    updates: Partial<Omit<Profile, "id">>,
  ): Promise<void> {
    logger.info("Updating profile", { profileId });

    const profiles = await this.getProfiles();
    const index = profiles.findIndex((p) => p.id === profileId);

    if (index === -1) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    if (
      updates.repoSettings?.provider &&
      updates.repoSettings.provider !== profiles[index].repoSettings.provider
    ) {
      throw {
        code: ApiErrorCode.REPO_PROVIDER_MISMATCH,
        message: "Repository provider cannot be changed",
        details: {
          from: profiles[index].repoSettings.provider,
          to: updates.repoSettings.provider,
        },
      };
    }

    profiles[index] = {
      ...profiles[index],
      ...updates,
    };

    await this.saveProfiles(profiles);
    logger.debug("Profile updated");
  }

  async deleteProfile(profileId: string): Promise<void> {
    logger.info("Deleting profile", { profileId });

    const profiles = await this.getProfiles();
    const filtered = profiles.filter((p) => p.id !== profileId);

    if (filtered.length === profiles.length) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    await this.saveProfiles(filtered);

    const activeId = await this.getActiveProfileId();
    if (activeId === profileId) {
      await this.setActiveProfileId(null);
    }

    logger.info("Profile deleted");
  }

  async migrateToProfiles(): Promise<void> {
    const profiles = await this.getProfiles();
    const activeProfileId = await this.getActiveProfileId();

    if (profiles.length > 0 || activeProfileId) {
      return;
    }

    try {
      if (await this.fsAdapter.exists(this.repoSettingsPath)) {
        logger.info("Migrating legacy repo settings to first profile");

        const content = await this.fsAdapter.readFile(this.repoSettingsPath);
        const rawSettings = JSON.parse(content);
        const normalizedSettings = this.normalizeRepoSettings(rawSettings);
        const repoSettings = this.decryptRepoSettings(normalizedSettings);

        let profileName = "Default Profile";

        if (
          repoSettings.provider === REPO_PROVIDERS.git &&
          repoSettings.remoteUrl
        ) {
          profileName = extractRepoNameFromUrl(repoSettings.remoteUrl);
        } else if (repoSettings.localPath) {
          profileName = path.basename(repoSettings.localPath);
        }

        logger.info("Derived profile name for migration", { profileName });

        const firstProfile: Profile = {
          id: "profile-default",
          name: profileName,
          repoSettings,
          createdAt: Date.now(),
          lastUsedAt: Date.now(),
        };

        await this.saveProfiles([firstProfile]);
        await this.setActiveProfileId(firstProfile.id);

        logger.info(
          "Migration complete: created profile from legacy settings",
          { profileName },
        );
      }
    } catch (error) {
      logger.error("Failed to migrate to profiles", { error });
    }
  }
}
