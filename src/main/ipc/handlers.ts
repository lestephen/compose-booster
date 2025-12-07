// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// IPC Handlers
// Central registration of all IPC handlers

import { ipcMain, clipboard, dialog, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from './channels';
import { configService } from '../services/configService';
import { apiService } from '../services/apiService';
import { closeSettingsWindow } from '../windows/settingsWindow';
import { ProcessEmailRequest, IpcResponse, AppConfig } from '../../shared/types';
import * as fs from 'fs';

/**
 * Register all IPC handlers
 */
export function registerIpcHandlers(): void {
  // Configuration handlers
  registerConfigHandlers();

  // API handlers
  registerApiHandlers();

  // Clipboard handlers
  registerClipboardHandlers();

  // Theme handlers
  registerThemeHandlers();

  // Window handlers
  registerWindowHandlers();
}

/**
 * Configuration IPC handlers
 */
function registerConfigHandlers(): void {
  // Get entire config
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET_ALL, async () => {
    try {
      const config = configService.getConfig();
      return { success: true, data: config } as IpcResponse<AppConfig>;
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get config',
        },
      } as IpcResponse;
    }
  });

  // Set entire config
  ipcMain.handle(IPC_CHANNELS.CONFIG_SET, async (event, config: Partial<AppConfig>) => {
    try {
      configService.setConfig(config);

      // Broadcast config update to all windows
      BrowserWindow.getAllWindows().forEach(window => {
        window.webContents.send(IPC_CHANNELS.CONFIG_UPDATED);
      });

      return { success: true } as IpcResponse;
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to save config',
        },
      } as IpcResponse;
    }
  });

  // Get defaults
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET_DEFAULTS, async () => {
    try {
      const { DEFAULT_CONFIG } = await import('../config/defaultConfig');
      return { success: true, data: DEFAULT_CONFIG } as IpcResponse<AppConfig>;
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get defaults',
        },
      } as IpcResponse;
    }
  });

  // Reset config to defaults
  ipcMain.handle(IPC_CHANNELS.CONFIG_RESET, async () => {
    try {
      const { DEFAULT_CONFIG } = await import('../config/defaultConfig');
      configService.setConfig(DEFAULT_CONFIG);
      return { success: true, data: DEFAULT_CONFIG } as IpcResponse<AppConfig>;
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to reset config',
        },
      } as IpcResponse;
    }
  });

  // Export config
  ipcMain.handle(IPC_CHANNELS.CONFIG_EXPORT, async () => {
    try {
      const result = await dialog.showSaveDialog({
        title: 'Export Configuration',
        defaultPath: 'compose-booster-config.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: { message: 'Export canceled' } } as IpcResponse;
      }

      const configJson = configService.exportConfig();
      fs.writeFileSync(result.filePath, configJson, 'utf-8');

      return { success: true, data: result.filePath } as IpcResponse<string>;
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to export config',
        },
      } as IpcResponse;
    }
  });

  // Import config
  ipcMain.handle(IPC_CHANNELS.CONFIG_IMPORT, async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Import Configuration',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile'],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: { message: 'Import canceled' } } as IpcResponse;
      }

      const configJson = fs.readFileSync(result.filePaths[0], 'utf-8');
      const importResult = configService.importConfig(configJson);

      if (!importResult.success) {
        return {
          success: false,
          error: { message: importResult.error || 'Import failed' },
        } as IpcResponse;
      }

      return { success: true } as IpcResponse;
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to import config',
        },
      } as IpcResponse;
    }
  });

  // Test API key
  ipcMain.handle(IPC_CHANNELS.CONFIG_TEST_API_KEY, async (event, apiKey: string) => {
    try {
      const result = await apiService.testApiKey(apiKey);
      if (result.valid) {
        return { success: true } as IpcResponse;
      } else {
        return {
          success: false,
          error: { message: result.error || 'Invalid API key' },
        } as IpcResponse;
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to test API key',
        },
      } as IpcResponse;
    }
  });
}

/**
 * API IPC handlers
 */
function registerApiHandlers(): void {
  // Process email
  ipcMain.handle(IPC_CHANNELS.API_PROCESS_EMAIL, async (event, request: ProcessEmailRequest) => {
    try {
      const { input, model, prompt, tone } = request;

      // Validate input
      if (!input || input.trim() === '') {
        return {
          success: false,
          error: { message: 'Please enter some text to process', code: 'EMPTY_INPUT' },
        };
      }

      // Get config
      const config = configService.getConfig();

      // Validate API key (skip check in mock mode)
      const isMockMode = process.env.MOCK_API === 'true';
      if (!isMockMode && (!config.apiKey || config.apiKey.trim() === '')) {
        return {
          success: false,
          error: {
            message: 'API key not configured. Please set your OpenRouter API key in Settings.',
            code: 'NO_API_KEY',
            action: 'OPEN_SETTINGS',
          },
        };
      }

      // Get prompt template
      const promptTemplate = config.prompts[prompt];
      if (!promptTemplate) {
        return {
          success: false,
          error: { message: `Prompt "${prompt}" not found`, code: 'INVALID_PROMPT' },
        };
      }

      // Get tone
      const toneObj = config.tones.find((t) => t.id === tone);

      // Build final prompt
      const finalPrompt = apiService.buildPrompt(
        promptTemplate.text,
        toneObj,
        input,
        config.preferences.includeClosingAndSignature
      );

      // Make API call
      const result = await apiService.processEmail(config.apiKey, model, finalPrompt);

      // Update statistics if successful
      if (result.success && result.cost) {
        configService.incrementStatistics(result.cost);
      }

      // Update last used
      if (result.success) {
        configService.updateLastUsed(model, prompt, tone);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
        },
      };
    }
  });

  // Get available models from OpenRouter
  ipcMain.handle(IPC_CHANNELS.API_GET_MODELS, async () => {
    try {
      const config = configService.getConfig();
      const apiKey = config.apiKey;

      if (!apiKey || apiKey.trim() === '') {
        return {
          success: false,
          error: {
            message: 'API key not configured. Please set your OpenRouter API key first.',
          },
        } as IpcResponse;
      }

      const result = await apiService.getAvailableModels(apiKey);

      if (result.success) {
        return {
          success: true,
          data: result.data,
        } as IpcResponse;
      } else {
        return {
          success: false,
          error: {
            message: result.error || 'Failed to fetch models',
          },
        } as IpcResponse;
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch models',
        },
      } as IpcResponse;
    }
  });
}

/**
 * Clipboard IPC handlers
 */
function registerClipboardHandlers(): void {
  // Read from clipboard
  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_READ, async () => {
    try {
      const text = clipboard.readText();
      return { success: true, data: text } as IpcResponse<string>;
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to read clipboard',
        },
      } as IpcResponse;
    }
  });

  // Write to clipboard
  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_WRITE, async (event, text: string) => {
    try {
      clipboard.writeText(text);
      return { success: true } as IpcResponse;
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to write clipboard',
        },
      } as IpcResponse;
    }
  });
}

/**
 * Theme IPC handlers
 */
function registerThemeHandlers(): void {
  // Get current theme
  ipcMain.handle(IPC_CHANNELS.THEME_GET, async () => {
    try {
      const config = configService.getConfig();
      return { success: true, data: config.preferences.theme } as IpcResponse<string>;
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get theme',
        },
      } as IpcResponse;
    }
  });

  // Set theme
  ipcMain.handle(IPC_CHANNELS.THEME_SET, async (event, theme: 'light' | 'dark' | 'system') => {
    try {
      const config = configService.getConfig();
      config.preferences.theme = theme;
      configService.setConfig(config);
      return { success: true } as IpcResponse;
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to set theme',
        },
      } as IpcResponse;
    }
  });
}

/**
 * Window IPC handlers
 */
function registerWindowHandlers(): void {
  // Close settings window
  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE_SETTINGS, () => {
    closeSettingsWindow();
  });
}
