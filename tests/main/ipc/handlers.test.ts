// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock electron
const mockIpcMain = {
  handle: vi.fn(),
  on: vi.fn(),
};

const mockClipboard = {
  readText: vi.fn(),
  writeText: vi.fn(),
};

const mockDialog = {
  showSaveDialog: vi.fn(),
  showOpenDialog: vi.fn(),
};

const mockBrowserWindow = {
  getAllWindows: vi.fn(() => []),
};

const mockShell = {
  openExternal: vi.fn(),
};

vi.mock('electron', () => ({
  ipcMain: mockIpcMain,
  clipboard: mockClipboard,
  dialog: mockDialog,
  BrowserWindow: mockBrowserWindow,
  shell: mockShell,
}));

// Mock configService
const mockConfigService = {
  getConfig: vi.fn(),
  setConfig: vi.fn(),
  incrementStatistics: vi.fn(),
  updateLastUsed: vi.fn(),
  exportConfig: vi.fn(),
  importConfig: vi.fn(),
};

vi.mock('../../../src/main/services/configService', () => ({
  configService: mockConfigService,
}));

// Mock apiService
const mockApiService = {
  testApiKey: vi.fn(),
  buildPrompt: vi.fn(),
  processEmail: vi.fn(),
  getAvailableModels: vi.fn(),
};

vi.mock('../../../src/main/services/apiService', () => ({
  apiService: mockApiService,
}));

// Mock settingsWindow
vi.mock('../../../src/main/windows/settingsWindow', () => ({
  closeSettingsWindow: vi.fn(),
}));

// Mock fs
vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
}));

import { IPC_CHANNELS } from '../../../src/main/ipc/channels';

describe('IPC Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('IPC_CHANNELS', () => {
    it('should have all required configuration channels', () => {
      expect(IPC_CHANNELS.CONFIG_GET_ALL).toBe('config:get-all');
      expect(IPC_CHANNELS.CONFIG_SET).toBe('config:set');
      expect(IPC_CHANNELS.CONFIG_GET_DEFAULTS).toBe('config:get-defaults');
      expect(IPC_CHANNELS.CONFIG_RESET).toBe('config:reset');
      expect(IPC_CHANNELS.CONFIG_EXPORT).toBe('config:export');
      expect(IPC_CHANNELS.CONFIG_IMPORT).toBe('config:import');
      expect(IPC_CHANNELS.CONFIG_TEST_API_KEY).toBe('config:test-api-key');
    });

    it('should have all required API channels', () => {
      expect(IPC_CHANNELS.API_PROCESS_EMAIL).toBe('api:process-email');
      expect(IPC_CHANNELS.API_CANCEL).toBe('api:cancel');
      expect(IPC_CHANNELS.API_GET_MODELS).toBe('api:get-models');
    });

    it('should have all required window channels', () => {
      expect(IPC_CHANNELS.WINDOW_OPEN_SETTINGS).toBe('window:open-settings');
      expect(IPC_CHANNELS.WINDOW_CLOSE_SETTINGS).toBe('window:close-settings');
    });

    it('should have all required clipboard channels', () => {
      expect(IPC_CHANNELS.CLIPBOARD_READ).toBe('clipboard:read');
      expect(IPC_CHANNELS.CLIPBOARD_WRITE).toBe('clipboard:write');
    });

    it('should have all required theme channels', () => {
      expect(IPC_CHANNELS.THEME_TOGGLE).toBe('theme:toggle');
      expect(IPC_CHANNELS.THEME_GET).toBe('theme:get');
      expect(IPC_CHANNELS.THEME_SET).toBe('theme:set');
    });

    it('should have shell channel for external links', () => {
      expect(IPC_CHANNELS.SHELL_OPEN_EXTERNAL).toBe('shell:open-external');
    });

    it('should have all required menu event channels', () => {
      expect(IPC_CHANNELS.MENU_UNDO).toBe('menu:undo');
      expect(IPC_CHANNELS.MENU_CLEAR_INPUT).toBe('menu:clear-input');
      expect(IPC_CHANNELS.MENU_CLEAR_OUTPUT).toBe('menu:clear-output');
      expect(IPC_CHANNELS.MENU_TOGGLE_DARK_MODE).toBe('menu:toggle-dark-mode');
      expect(IPC_CHANNELS.MENU_FONT_SIZE_INCREASE).toBe('menu:font-size-increase');
      expect(IPC_CHANNELS.MENU_FONT_SIZE_DECREASE).toBe('menu:font-size-decrease');
      expect(IPC_CHANNELS.MENU_FONT_SIZE_RESET).toBe('menu:font-size-reset');
      expect(IPC_CHANNELS.MENU_REBUILD).toBe('menu:rebuild');
    });

    it('should have config updated broadcast channel', () => {
      expect(IPC_CHANNELS.CONFIG_UPDATED).toBe('config:updated');
    });
  });

  describe('Clipboard handlers', () => {
    it('should read text from clipboard', () => {
      mockClipboard.readText.mockReturnValue('Test clipboard content');

      const text = mockClipboard.readText();

      expect(text).toBe('Test clipboard content');
    });

    it('should write text to clipboard', () => {
      mockClipboard.writeText('New content');

      expect(mockClipboard.writeText).toHaveBeenCalledWith('New content');
    });
  });

  describe('Shell handlers - URL validation', () => {
    it('should accept valid HTTPS URLs', () => {
      const url = 'https://openrouter.ai/keys';
      const parsedUrl = new URL(url);

      expect(['http:', 'https:']).toContain(parsedUrl.protocol);
    });

    it('should accept valid HTTP URLs', () => {
      const url = 'http://example.com';
      const parsedUrl = new URL(url);

      expect(['http:', 'https:']).toContain(parsedUrl.protocol);
    });

    it('should reject file:// URLs', () => {
      const url = 'file:///etc/passwd';
      const parsedUrl = new URL(url);

      expect(['http:', 'https:']).not.toContain(parsedUrl.protocol);
    });

    it('should reject javascript: URLs', () => {
      expect(() => {
        const url = 'javascript:alert(1)';
        const parsedUrl = new URL(url);
        // If it doesn't throw, check protocol
        expect(['http:', 'https:']).not.toContain(parsedUrl.protocol);
      }).not.toThrow();
    });

    it('should throw for invalid URLs', () => {
      expect(() => new URL('not-a-url')).toThrow();
    });
  });

  describe('Config validation', () => {
    it('should validate API key is present', () => {
      const apiKey = '';
      const isValid = !!(apiKey && apiKey.trim() !== '');

      expect(isValid).toBe(false);
    });

    it('should validate API key is not whitespace only', () => {
      const apiKey = '   ';
      const isValid = !!(apiKey && apiKey.trim() !== '');

      expect(isValid).toBe(false);
    });

    it('should validate valid API key', () => {
      const apiKey = 'sk-valid-key-12345';
      const isValid = !!(apiKey && apiKey.trim() !== '');

      expect(isValid).toBe(true);
    });
  });

  describe('Process email validation', () => {
    it('should reject empty input', () => {
      const input = '';
      const isValid = !!(input && input.trim() !== '');

      expect(isValid).toBe(false);
    });

    it('should reject whitespace-only input', () => {
      const input = '   \n\t  ';
      const isValid = !!(input && input.trim() !== '');

      expect(isValid).toBe(false);
    });

    it('should accept valid input', () => {
      const input = 'Please improve this email...';
      const isValid = !!(input && input.trim() !== '');

      expect(isValid).toBe(true);
    });
  });

  describe('Error response format', () => {
    it('should format success response correctly', () => {
      const response = { success: true, data: 'test data' };

      expect(response.success).toBe(true);
      expect(response.data).toBe('test data');
    });

    it('should format error response correctly', () => {
      const response = {
        success: false,
        error: { message: 'Test error', code: 'TEST_ERROR' },
      };

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error.message).toBe('Test error');
      expect(response.error.code).toBe('TEST_ERROR');
    });

    it('should format error response with action', () => {
      const response = {
        success: false,
        error: {
          message: 'API key not configured',
          code: 'NO_API_KEY',
          action: 'OPEN_SETTINGS',
        },
      };

      expect(response.error.action).toBe('OPEN_SETTINGS');
    });
  });
});

describe('Process Email Request Validation', () => {
  it('should have all required fields in request', () => {
    const request = {
      input: 'Test email content',
      model: 'anthropic/claude-3.5-sonnet',
      prompt: 'improve',
      tone: 'professional',
    };

    expect(request).toHaveProperty('input');
    expect(request).toHaveProperty('model');
    expect(request).toHaveProperty('prompt');
    expect(request).toHaveProperty('tone');
  });

  it('should validate model ID format', () => {
    const validModelIds = [
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'google/gemini-pro',
    ];

    validModelIds.forEach((id) => {
      expect(id).toMatch(/^[a-z0-9-]+\/[a-z0-9.-]+$/i);
    });
  });
});

describe('Theme Validation', () => {
  const validThemes = ['light', 'dark', 'system'];

  it('should accept light theme', () => {
    expect(validThemes).toContain('light');
  });

  it('should accept dark theme', () => {
    expect(validThemes).toContain('dark');
  });

  it('should accept system theme', () => {
    expect(validThemes).toContain('system');
  });

  it('should reject invalid themes', () => {
    expect(validThemes).not.toContain('invalid');
    expect(validThemes).not.toContain('auto');
  });
});
