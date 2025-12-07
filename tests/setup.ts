// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Test setup file
// Runs before each test file

import { vi } from 'vitest';

// Mock electron APIs
global.window = global.window || {};

// Mock electronAPI for renderer tests
(global.window as any).electronAPI = {
  getConfig: vi.fn(),
  setConfig: vi.fn(),
  getDefaults: vi.fn(),
  resetConfig: vi.fn(),
  exportConfig: vi.fn(),
  importConfig: vi.fn(),
  testApiKey: vi.fn(),
  getAvailableModels: vi.fn(),
  processEmail: vi.fn(),
  readClipboard: vi.fn(),
  writeClipboard: vi.fn(),
  getTheme: vi.fn(),
  setTheme: vi.fn(),
  openSettings: vi.fn(),
  closeSettings: vi.fn(),
  onMenuEvent: vi.fn(),
  onConfigUpdated: vi.fn(),
  closeWindow: vi.fn(),
};
