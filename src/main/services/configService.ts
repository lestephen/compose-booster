// Configuration Service
// Manages application configuration using electron-store

import Store from 'electron-store';
import { AppConfig } from '../../shared/types';
import { DEFAULT_CONFIG } from '../config/defaultConfig';

class ConfigService {
  private store: Store<AppConfig>;

  constructor() {
    this.store = new Store<AppConfig>({
      name: 'config',
      defaults: DEFAULT_CONFIG,
      // Encrypt sensitive data (API key)
      encryptionKey: 'compose-booster-encryption-key',
    });
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
   * Ensures all required fields exist
   */
  private validateAndMergeConfig(config: Partial<AppConfig>): AppConfig {
    return {
      apiKey: config.apiKey || DEFAULT_CONFIG.apiKey,
      models: config.models || DEFAULT_CONFIG.models,
      prompts: config.prompts || DEFAULT_CONFIG.prompts,
      tones: config.tones || DEFAULT_CONFIG.tones,
      quickActions: config.quickActions || DEFAULT_CONFIG.quickActions,
      lastUsed: config.lastUsed || DEFAULT_CONFIG.lastUsed,
      preferences: {
        ...DEFAULT_CONFIG.preferences,
        ...config.preferences,
      },
      windowBounds: {
        ...DEFAULT_CONFIG.windowBounds,
        ...config.windowBounds,
      },
      statistics: {
        ...DEFAULT_CONFIG.statistics,
        ...config.statistics,
      },
    };
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
  incrementStatistics(cost: number = 0): void {
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
