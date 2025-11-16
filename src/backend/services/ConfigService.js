"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const path = __importStar(require("path"));
const electron_1 = require("electron");
const types_1 = require("../../shared/types");
const logger_1 = require("../utils/logger");
class ConfigService {
    constructor(fsAdapter, cryptoAdapter) {
        this.fsAdapter = fsAdapter;
        this.cryptoAdapter = cryptoAdapter;
        this.configDir = path.join(electron_1.app.getPath('userData'), 'config');
        this.appSettingsPath = path.join(this.configDir, 'app-settings.json');
        this.repoSettingsPath = path.join(this.configDir, 'repo-settings.json');
        this.appStatePath = path.join(this.configDir, 'app-state.json');
    }
    async ensureConfigDir() {
        await this.fsAdapter.mkdir(this.configDir, { recursive: true });
    }
    async getFull() {
        logger_1.logger.info('Loading full configuration');
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
    async getAppSettings() {
        try {
            if (await this.fsAdapter.exists(this.appSettingsPath)) {
                const content = await this.fsAdapter.readFile(this.appSettingsPath);
                const settings = JSON.parse(content);
                logger_1.logger.debug('Loaded app settings', { settings });
                // Merge with defaults to handle missing fields
                return { ...types_1.DEFAULT_APP_SETTINGS, ...settings };
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to load app settings, using defaults', { error });
        }
        // Return defaults if file doesn't exist or failed to load
        return types_1.DEFAULT_APP_SETTINGS;
    }
    async updateAppSettings(settings) {
        logger_1.logger.info('Updating app settings', { settings });
        await this.ensureConfigDir();
        const current = await this.getAppSettings();
        const updated = { ...current, ...settings };
        await this.fsAdapter.writeFile(this.appSettingsPath, JSON.stringify(updated, null, 2));
        logger_1.logger.debug('App settings saved');
    }
    async getRepoSettings() {
        try {
            if (await this.fsAdapter.exists(this.repoSettingsPath)) {
                const content = await this.fsAdapter.readFile(this.repoSettingsPath);
                const settings = JSON.parse(content);
                // Decrypt PAT
                if (settings.pat) {
                    settings.pat = this.cryptoAdapter.decrypt(settings.pat);
                }
                logger_1.logger.debug('Loaded repo settings (PAT decrypted)');
                return settings;
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to load repo settings', { error });
        }
        return null;
    }
    async updateRepoSettings(settings) {
        logger_1.logger.info('Updating repo settings', {
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
        logger_1.logger.debug('Repo settings saved (PAT encrypted)');
    }
    async getAppState() {
        try {
            if (await this.fsAdapter.exists(this.appStatePath)) {
                const content = await this.fsAdapter.readFile(this.appStatePath);
                const state = JSON.parse(content);
                logger_1.logger.debug('Loaded app state', { state });
                return { ...types_1.DEFAULT_APP_STATE, ...state };
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to load app state, using defaults', { error });
        }
        return types_1.DEFAULT_APP_STATE;
    }
    async updateAppState(state) {
        await this.ensureConfigDir();
        const current = await this.getAppState();
        const updated = { ...current, ...state };
        await this.fsAdapter.writeFile(this.appStatePath, JSON.stringify(updated, null, 2));
        logger_1.logger.debug('App state saved');
    }
    async clearRepoSettings() {
        logger_1.logger.info('Clearing repo settings');
        if (await this.fsAdapter.exists(this.repoSettingsPath)) {
            await this.fsAdapter.deleteFile(this.repoSettingsPath);
        }
    }
}
exports.ConfigService = ConfigService;
