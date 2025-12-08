// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// IPC Channel Constants
// Centralized IPC channel names for type safety and consistency

export const IPC_CHANNELS = {
  // Configuration
  CONFIG_GET_ALL: 'config:get-all',
  CONFIG_SET: 'config:set',
  CONFIG_GET_DEFAULTS: 'config:get-defaults',
  CONFIG_RESET: 'config:reset',
  CONFIG_EXPORT: 'config:export',
  CONFIG_IMPORT: 'config:import',
  CONFIG_TEST_API_KEY: 'config:test-api-key',

  // API Operations
  API_PROCESS_EMAIL: 'api:process-email',
  API_REGENERATE: 'api:regenerate',
  API_CANCEL: 'api:cancel',
  API_GET_MODELS: 'api:get-models',

  // Window Management
  WINDOW_OPEN_SETTINGS: 'window:open-settings',
  WINDOW_CLOSE_SETTINGS: 'window:close-settings',

  // Clipboard
  CLIPBOARD_READ: 'clipboard:read',
  CLIPBOARD_WRITE: 'clipboard:write',

  // Theme
  THEME_TOGGLE: 'theme:toggle',
  THEME_GET: 'theme:get',
  THEME_SET: 'theme:set',

  // Shell
  SHELL_OPEN_EXTERNAL: 'shell:open-external',

  // Menu Events (Main → Renderer)
  MENU_UNDO: 'menu:undo',
  MENU_CLEAR_INPUT: 'menu:clear-input',
  MENU_CLEAR_OUTPUT: 'menu:clear-output',
  MENU_TOGGLE_DARK_MODE: 'menu:toggle-dark-mode',
  MENU_FONT_SIZE_INCREASE: 'menu:font-size-increase',
  MENU_FONT_SIZE_DECREASE: 'menu:font-size-decrease',
  MENU_FONT_SIZE_RESET: 'menu:font-size-reset',
  MENU_REBUILD: 'menu:rebuild',

  // Events (broadcasts)
  CONFIG_UPDATED: 'config:updated',
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
