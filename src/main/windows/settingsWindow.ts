// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Settings Window Manager

import { BrowserWindow } from 'electron';
import path from 'path';
import { configService } from '../services/configService';
import {
  SETTINGS_WINDOW_DEFAULT_WIDTH,
  SETTINGS_WINDOW_DEFAULT_HEIGHT,
  SETTINGS_WINDOW_MIN_WIDTH,
  SETTINGS_WINDOW_MIN_HEIGHT,
} from '../../shared/constants';

let settingsWindow: BrowserWindow | null = null;

export function createSettingsWindow(parent: BrowserWindow): BrowserWindow {
  // If already open, focus it
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return settingsWindow;
  }

  const config = configService.getConfig();
  const bounds = config.settingsWindowBounds;

  settingsWindow = new BrowserWindow({
    width: bounds?.width || SETTINGS_WINDOW_DEFAULT_WIDTH,
    height: bounds?.height || SETTINGS_WINDOW_DEFAULT_HEIGHT,
    x: bounds?.x,
    y: bounds?.y,
    minWidth: SETTINGS_WINDOW_MIN_WIDTH,
    minHeight: SETTINGS_WINDOW_MIN_HEIGHT,
    title: 'Settings - Compose Booster',
    parent: parent,
    modal: true,
    show: false,
    autoHideMenuBar: true, // Hide menu bar
    webPreferences: {
      preload: path.join(__dirname, 'settingsPreload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the settings page
  const loadSettings = async () => {
    try {
      if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        // In development, load from dev server
        const url = `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/src/renderer/settings/settings.html`;
        console.log('[SettingsWindow] Loading URL:', url);
        await settingsWindow!.loadURL(url);
      } else {
        // In production, load from built files
        const filePath = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/src/renderer/settings/settings.html`);
        console.log('[SettingsWindow] Loading file:', filePath);
        await settingsWindow!.loadFile(filePath);
      }
    } catch (error) {
      console.error('[SettingsWindow] Failed to load settings page:', error);
      // Show the window anyway so user can see something went wrong
      settingsWindow?.show();
    }
  };

  loadSettings();

  // Show when ready
  settingsWindow.once('ready-to-show', () => {
    settingsWindow?.show();
  });

  // Save window bounds on resize/move
  settingsWindow.on('resize', saveSettingsWindowBounds);
  settingsWindow.on('move', saveSettingsWindowBounds);

  // Handle close
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  return settingsWindow;
}

export function getSettingsWindow(): BrowserWindow | null {
  return settingsWindow;
}

export function closeSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
  }
}

function saveSettingsWindowBounds(): void {
  if (!settingsWindow) return;

  const bounds = settingsWindow.getBounds();
  configService.updateSettingsWindowBounds(bounds);
}

// Declare Vite environment variables
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;
