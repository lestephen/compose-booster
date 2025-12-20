// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Shared constants for Compose Booster

// Application Info
export const APP_NAME = 'Compose Booster';
// Note: Version is read from package.json via app.getVersion() in main process
// Use window.electronAPI.getAppVersion() in renderer to get the version

// Window Dimensions
export const MAIN_WINDOW_DEFAULT_WIDTH = 1000;
export const MAIN_WINDOW_DEFAULT_HEIGHT = 800;
export const MAIN_WINDOW_MIN_WIDTH = 800;
export const MAIN_WINDOW_MIN_HEIGHT = 600;

export const SETTINGS_WINDOW_DEFAULT_WIDTH = 1000;
export const SETTINGS_WINDOW_DEFAULT_HEIGHT = 700;
export const SETTINGS_WINDOW_MIN_WIDTH = 900;
export const SETTINGS_WINDOW_MIN_HEIGHT = 600;

// Font Size Limits
export const MIN_FONT_SIZE = 10;
export const MAX_FONT_SIZE = 20;
export const DEFAULT_FONT_SIZE = 14;

// History
export const MAX_HISTORY_ITEMS = 10;

// Character Limits
export const LARGE_INPUT_WARNING_THRESHOLD = 10000;

// Timeouts
export const API_DEFAULT_TIMEOUT = 60000; // 60 seconds
export const COPY_CONFIRMATION_DURATION = 2000; // 2 seconds

// OpenRouter API
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_REFERER = 'https://outlook-ai-assistant.local';

// Environment Variables
export const MOCK_API_ENV_VAR = 'MOCK_API';
