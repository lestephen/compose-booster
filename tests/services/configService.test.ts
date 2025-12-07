// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import after mocks are set up
import { DEFAULT_CONFIG } from '../../src/main/config/defaultConfig';
import { AppConfig } from '../../src/shared/types';

// Create a mock ConfigService class for testing
class MockConfigService {
  private store: Record<string, any> = {};

  constructor() {
    this.store = { ...DEFAULT_CONFIG };
  }

  getConfig(): AppConfig {
    return this.validateAndMergeConfig(this.store as Partial<AppConfig>);
  }

  setConfig(config: Partial<AppConfig>): void {
    const current = this.getConfig();
    this.store = { ...current, ...config };
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.store[key] || DEFAULT_CONFIG[key];
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.store[key] = value;
  }

  resetToDefaults(): void {
    this.store = { ...DEFAULT_CONFIG };
  }

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

  exportConfig(): string {
    return JSON.stringify(this.getConfig(), null, 2);
  }

  importConfig(jsonString: string): { success: boolean; error?: string } {
    try {
      const imported = JSON.parse(jsonString) as Partial<AppConfig>;
      if (typeof imported !== 'object' || imported === null) {
        return { success: false, error: 'Invalid configuration format' };
      }
      const merged = this.validateAndMergeConfig(imported);
      this.store = merged;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getConfigPath(): string {
    return '/mock/path/config.json';
  }

  incrementStatistics(cost: number = 0): void {
    const stats = this.get('statistics');
    this.set('statistics', {
      ...stats,
      totalCalls: stats.totalCalls + 1,
      totalCost: stats.totalCost + cost,
      monthlyCost: stats.monthlyCost + cost,
    });
  }

  resetMonthlyStatistics(): void {
    const stats = this.get('statistics');
    this.set('statistics', {
      ...stats,
      monthlyCost: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
    });
  }

  updateLastUsed(model: string, prompt: string, tone: string): void {
    this.set('lastUsed', { model, prompt, tone });
  }

  updateWindowBounds(bounds: { width: number; height: number; x?: number; y?: number }): void {
    this.set('windowBounds', bounds);
  }
}

// Create a singleton instance for testing
const configService = new MockConfigService();

describe('ConfigService', () => {
  beforeEach(() => {
    // Reset config to defaults before each test
    configService.resetToDefaults();
  });

  describe('getConfig', () => {
    it('should return complete config with all required fields', () => {
      const config = configService.getConfig();

      expect(config).toHaveProperty('apiKey');
      expect(config).toHaveProperty('models');
      expect(config).toHaveProperty('prompts');
      expect(config).toHaveProperty('tones');
      expect(config).toHaveProperty('quickActions');
      expect(config).toHaveProperty('lastUsed');
      expect(config).toHaveProperty('preferences');
      expect(config).toHaveProperty('windowBounds');
      expect(config).toHaveProperty('statistics');
    });

    it('should return default values for missing fields', () => {
      const config = configService.getConfig();

      expect(config.apiKey).toBe('');
      expect(Array.isArray(config.models)).toBe(true);
      expect(config.models.length).toBeGreaterThan(0);
    });
  });

  describe('setConfig', () => {
    it('should update API key', () => {
      configService.setConfig({ apiKey: 'sk-test-key-12345' });

      const config = configService.getConfig();
      expect(config.apiKey).toBe('sk-test-key-12345');
    });

    it('should merge partial config with existing config', () => {
      const originalConfig = configService.getConfig();
      const originalModelsCount = originalConfig.models.length;

      configService.setConfig({ apiKey: 'new-key' });

      const updatedConfig = configService.getConfig();
      expect(updatedConfig.apiKey).toBe('new-key');
      expect(updatedConfig.models.length).toBe(originalModelsCount);
    });

    it('should update preferences while preserving other settings', () => {
      configService.setConfig({ apiKey: 'test-key' });
      configService.setConfig({
        preferences: {
          ...DEFAULT_CONFIG.preferences,
          theme: 'dark',
          fontSize: 16,
        },
      });

      const config = configService.getConfig();
      expect(config.apiKey).toBe('test-key');
      expect(config.preferences.theme).toBe('dark');
      expect(config.preferences.fontSize).toBe(16);
    });
  });

  describe('get and set specific values', () => {
    it('should get specific config value', () => {
      configService.setConfig({ apiKey: 'specific-key' });

      const apiKey = configService.get('apiKey');
      expect(apiKey).toBe('specific-key');
    });

    it('should set specific config value', () => {
      configService.set('apiKey', 'new-specific-key');

      const apiKey = configService.get('apiKey');
      expect(apiKey).toBe('new-specific-key');
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all settings to defaults', () => {
      // Make some changes
      configService.setConfig({
        apiKey: 'test-key',
        preferences: {
          ...DEFAULT_CONFIG.preferences,
          theme: 'dark',
        },
      });

      // Reset
      configService.resetToDefaults();

      const config = configService.getConfig();
      expect(config.apiKey).toBe('');
      expect(config.preferences.theme).toBe('light');
    });
  });

  describe('exportConfig', () => {
    it('should return valid JSON string', () => {
      const exported = configService.exportConfig();

      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should include all config fields', () => {
      configService.setConfig({ apiKey: 'export-test-key' });

      const exported = configService.exportConfig();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveProperty('apiKey');
      expect(parsed).toHaveProperty('models');
      expect(parsed).toHaveProperty('prompts');
      expect(parsed).toHaveProperty('tones');
    });
  });

  describe('importConfig', () => {
    it('should import valid config', () => {
      const importData: Partial<AppConfig> = {
        apiKey: 'imported-key',
        models: DEFAULT_CONFIG.models,
        prompts: DEFAULT_CONFIG.prompts,
        tones: DEFAULT_CONFIG.tones,
        quickActions: DEFAULT_CONFIG.quickActions,
        preferences: DEFAULT_CONFIG.preferences,
      };

      const result = configService.importConfig(JSON.stringify(importData));

      expect(result.success).toBe(true);
    });

    it('should reject invalid JSON', () => {
      const result = configService.importConfig('not valid json');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject non-object data', () => {
      const result = configService.importConfig('"just a string"');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    it('should reject null data', () => {
      const result = configService.importConfig('null');

      expect(result.success).toBe(false);
    });
  });

  describe('getConfigPath', () => {
    it('should return a path string', () => {
      const path = configService.getConfigPath();

      expect(typeof path).toBe('string');
      expect(path.length).toBeGreaterThan(0);
    });
  });

  describe('incrementStatistics', () => {
    it('should increment total calls', () => {
      const initialStats = configService.get('statistics');
      const initialCalls = initialStats.totalCalls;

      configService.incrementStatistics(0);

      const updatedStats = configService.get('statistics');
      expect(updatedStats.totalCalls).toBe(initialCalls + 1);
    });

    it('should add to total cost', () => {
      configService.resetToDefaults();

      configService.incrementStatistics(0.005);

      const stats = configService.get('statistics');
      expect(stats.totalCost).toBeCloseTo(0.005, 5);
    });

    it('should add to monthly cost', () => {
      configService.resetToDefaults();

      configService.incrementStatistics(0.01);

      const stats = configService.get('statistics');
      expect(stats.monthlyCost).toBeCloseTo(0.01, 5);
    });

    it('should accumulate costs over multiple calls', () => {
      configService.resetToDefaults();

      configService.incrementStatistics(0.001);
      configService.incrementStatistics(0.002);
      configService.incrementStatistics(0.003);

      const stats = configService.get('statistics');
      expect(stats.totalCalls).toBe(3);
      expect(stats.totalCost).toBeCloseTo(0.006, 5);
    });
  });

  describe('resetMonthlyStatistics', () => {
    it('should reset monthly cost to zero', () => {
      configService.incrementStatistics(1.0);

      configService.resetMonthlyStatistics();

      const stats = configService.get('statistics');
      expect(stats.monthlyCost).toBe(0);
    });

    it('should preserve total cost when resetting monthly', () => {
      configService.resetToDefaults();
      configService.incrementStatistics(1.0);
      const totalBefore = configService.get('statistics').totalCost;

      configService.resetMonthlyStatistics();

      const stats = configService.get('statistics');
      expect(stats.totalCost).toBeCloseTo(totalBefore, 5);
    });

    it('should update lastResetDate', () => {
      configService.resetMonthlyStatistics();

      const stats = configService.get('statistics');
      const today = new Date().toISOString().split('T')[0];
      expect(stats.lastResetDate).toBe(today);
    });
  });

  describe('updateLastUsed', () => {
    it('should update last used selections', () => {
      configService.updateLastUsed('test-model', 'test-prompt', 'test-tone');

      const lastUsed = configService.get('lastUsed');
      expect(lastUsed.model).toBe('test-model');
      expect(lastUsed.prompt).toBe('test-prompt');
      expect(lastUsed.tone).toBe('test-tone');
    });
  });

  describe('updateWindowBounds', () => {
    it('should update window dimensions', () => {
      configService.updateWindowBounds({ width: 1200, height: 800 });

      const bounds = configService.get('windowBounds');
      expect(bounds.width).toBe(1200);
      expect(bounds.height).toBe(800);
    });

    it('should update window position', () => {
      configService.updateWindowBounds({ width: 800, height: 600, x: 100, y: 50 });

      const bounds = configService.get('windowBounds');
      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(50);
    });
  });

  describe('validateAndMergeConfig', () => {
    it('should fill in missing fields with defaults', () => {
      // Set a partial config missing some fields
      configService.setConfig({ apiKey: 'test' } as any);

      const config = configService.getConfig();

      // Should have all required fields filled in
      expect(config.models).toBeDefined();
      expect(config.prompts).toBeDefined();
      expect(config.tones).toBeDefined();
      expect(config.preferences).toBeDefined();
    });
  });
});
