// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Configuration Service
// Manages application configuration using electron-store

import Store from 'electron-store';
import { app } from 'electron';
import { createHash } from 'crypto';
import { homedir, hostname, userInfo } from 'os';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { AppConfig, ProviderConfig } from '../../shared/types';
import { DEFAULT_CONFIG, DEFAULT_PROVIDERS } from '../config/defaultConfig';

/**
 * Generate a machine-derived encryption key
 * Uses a combination of machine-specific values to create a unique key per machine
 * This provides better security than a hardcoded key while still being deterministic
 */
function generateMachineKey(): string {
  // Combine multiple machine-specific identifiers
  const machineIdentifiers = [
    homedir(),           // User's home directory path
    hostname(),          // Machine hostname
    userInfo().username, // Current username
    process.arch,        // CPU architecture
    'compose-booster',   // App-specific salt
  ].join(':');

  // Create a SHA-256 hash of the combined identifiers
  // This produces a consistent key for the same machine/user
  return createHash('sha256').update(machineIdentifiers).digest('hex');
}

/**
 * Get the config file path without creating a Store
 * This avoids triggering deserialization of a potentially corrupted file
 */
function getConfigFilePath(): string {
  // electron-store uses app.getPath('userData') as the base directory
  // and the 'name' option (defaulting to 'config') as the filename
  return join(app.getPath('userData'), 'config.json');
}

/**
 * Delete corrupted config file if it exists
 * Returns true if file was deleted or didn't exist, false if deletion failed
 */
function deleteCorruptedConfig(): boolean {
  const configPath = getConfigFilePath();
  if (existsSync(configPath)) {
    try {
      unlinkSync(configPath);
      console.log('[ConfigService] Deleted corrupted config file:', configPath);
      return true;
    } catch (deleteError) {
      console.error('[ConfigService] Failed to delete corrupted config:', deleteError);
      return false;
    }
  }
  return true;
}

/**
 * Create a store with error recovery
 * If the config file is corrupted or encrypted with a different key,
 * delete it and create a fresh one with defaults
 */
function createStoreWithRecovery(): Store<AppConfig> {
  const storeOptions = {
    name: 'config',
    defaults: DEFAULT_CONFIG,
    encryptionKey: generateMachineKey(),
  };

  try {
    const store = new Store<AppConfig>(storeOptions);
    // Test that we can actually read the store (this triggers decryption)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = store.store;
    return store;
  } catch (error) {
    // Config file exists but can't be read (likely encrypted with different key)
    // This can happen when:
    // 1. Upgrading from a version with a different encryption key
    // 2. Config file is corrupted
    // 3. User copied config from another machine
    // 4. Sandbox environment changed the encryption key inputs
    console.error('[ConfigService] Failed to read config, attempting recovery:', error);

    // Delete the corrupted config file using the path we can get without Store
    deleteCorruptedConfig();

    // Create a fresh store with defaults
    try {
      return new Store<AppConfig>(storeOptions);
    } catch (retryError) {
      // If we still can't create a store, try without encryption as last resort
      console.error('[ConfigService] Recovery failed, trying without encryption:', retryError);
      return new Store<AppConfig>({
        name: 'config',
        defaults: DEFAULT_CONFIG,
        // No encryption key - store will be unencrypted but at least functional
      });
    }
  }
}

class ConfigService {
  private store: Store<AppConfig>;

  constructor() {
    this.store = createStoreWithRecovery();
  }

  /**
   * Get the entire configuration
   */
  getConfig(): AppConfig {
    const config = this.store.store;
    return this.validateAndMergeConfig(config);
  }

  /**
   * Set the entire configuration
   */
  setConfig(config: Partial<AppConfig>): void {
    const current = this.getConfig();
    const merged = { ...current, ...config };
    this.store.store = merged;
  }

  /**
   * Get a specific config value
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.store.get(key) || DEFAULT_CONFIG[key];
  }

  /**
   * Set a specific config value
   */
  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.store.set(key, value);
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void {
    this.store.clear();
    this.store.store = DEFAULT_CONFIG;
  }

  /**
   * Validate and merge config with defaults
   * Ensures all required fields exist and model IDs are valid
   * Also handles migration from older config versions
   */
  private validateAndMergeConfig(config: Partial<AppConfig>): AppConfig {
    // Migrate providers: if missing, create from existing apiKey
    let providers = config.providers;
    if (!providers || providers.length === 0) {
      console.log('[ConfigService] Migrating: Creating providers array from existing config');
      providers = this.migrateProviders(config.apiKey);
    }

    // Ensure all default providers exist in the config
    providers = this.ensureAllProviders(providers);

    // Get active provider, defaulting to openrouter
    const activeProvider = config.activeProvider || 'openrouter';

    // Migrate models: ensure all models have a provider field
    let models = config.models || DEFAULT_CONFIG.models;
    models = models.map(model => ({
      ...model,
      provider: model.provider || 'openrouter',
    }));

    const enabledModelIds = models.filter(m => m.enabled).map(m => m.id);
    const defaultModelId = models.find(m => m.isDefault)?.id || enabledModelIds[0] || DEFAULT_CONFIG.models[0].id;

    // Validate quick actions - ensure model IDs exist in enabled models
    let quickActions = config.quickActions || DEFAULT_CONFIG.quickActions;
    quickActions = quickActions.map(action => {
      if (!enabledModelIds.includes(action.model)) {
        console.log(`[ConfigService] Quick action "${action.name}" has invalid model "${action.model}", replacing with "${defaultModelId}"`);
        return { ...action, model: defaultModelId };
      }
      return action;
    });

    // Validate lastUsed model
    let lastUsed = config.lastUsed || DEFAULT_CONFIG.lastUsed;
    if (!enabledModelIds.includes(lastUsed.model)) {
      console.log(`[ConfigService] lastUsed has invalid model "${lastUsed.model}", replacing with "${defaultModelId}"`);
      lastUsed = { ...lastUsed, model: defaultModelId };
    }

    return {
      apiKey: config.apiKey || DEFAULT_CONFIG.apiKey,
      providers,
      activeProvider,
      models,
      prompts: config.prompts || DEFAULT_CONFIG.prompts,
      tones: config.tones || DEFAULT_CONFIG.tones,
      styles: config.styles || DEFAULT_CONFIG.styles,
      quickActions,
      lastUsed,
      preferences: {
        ...DEFAULT_CONFIG.preferences,
        ...config.preferences,
      },
      windowBounds: {
        ...DEFAULT_CONFIG.windowBounds,
        ...config.windowBounds,
      },
      settingsWindowBounds: config.settingsWindowBounds,
      statistics: {
        ...DEFAULT_CONFIG.statistics,
        ...config.statistics,
      },
    };
  }

  /**
   * Migrate from v1.0 config: create providers array from existing apiKey
   */
  private migrateProviders(apiKey?: string): ProviderConfig[] {
    const providers: ProviderConfig[] = DEFAULT_PROVIDERS.map(p => ({
      ...p,
      // If there's an existing API key, assign it to OpenRouter
      apiKey: p.id === 'openrouter' && apiKey ? apiKey : undefined,
    }));
    return providers;
  }

  /**
   * Ensure all default providers exist in the config
   * Adds any missing providers from defaults
   */
  private ensureAllProviders(providers: ProviderConfig[]): ProviderConfig[] {
    const existingIds = new Set(providers.map(p => p.id));
    const missingProviders = DEFAULT_PROVIDERS.filter(p => !existingIds.has(p.id));

    if (missingProviders.length > 0) {
      console.log('[ConfigService] Adding missing providers:', missingProviders.map(p => p.id).join(', '));
      return [...providers, ...missingProviders];
    }

    return providers;
  }

  /**
   * Export configuration as JSON string
   */
  exportConfig(): string {
    const config = this.getConfig();
    // Optionally remove API key for security
    const exportData = { ...config };
    // User can choose whether to include API key
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  importConfig(jsonString: string): { success: boolean; error?: string } {
    try {
      const imported = JSON.parse(jsonString) as Partial<AppConfig>;

      // Validate basic structure
      if (typeof imported !== 'object' || imported === null) {
        return { success: false, error: 'Invalid configuration format' };
      }

      // Merge with current config
      const merged = this.validateAndMergeConfig(imported);
      this.store.store = merged;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get the file path where config is stored
   */
  getConfigPath(): string {
    return this.store.path;
  }

  /**
   * Update statistics
   */
  incrementStatistics(cost = 0): void {
    const stats = this.get('statistics');
    this.set('statistics', {
      ...stats,
      totalCalls: stats.totalCalls + 1,
      totalCost: stats.totalCost + cost,
      monthlyCost: stats.monthlyCost + cost,
    });
  }

  /**
   * Reset monthly statistics
   */
  resetMonthlyStatistics(): void {
    const stats = this.get('statistics');
    this.set('statistics', {
      ...stats,
      monthlyCost: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
    });
  }

  /**
   * Update last used combo
   */
  updateLastUsed(model: string, prompt: string, tone: string): void {
    this.set('lastUsed', { model, prompt, tone });
  }

  /**
   * Update window bounds
   */
  updateWindowBounds(bounds: { width: number; height: number; x?: number; y?: number }): void {
    this.set('windowBounds', bounds);
  }

  /**
   * Update settings window bounds
   */
  updateSettingsWindowBounds(bounds: { width: number; height: number; x?: number; y?: number }): void {
    this.set('settingsWindowBounds', bounds);
  }
}

// Export singleton instance
export const configService = new ConfigService();
