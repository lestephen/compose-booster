// Settings Window Manager

import { BrowserWindow } from 'electron';
import path from 'path';
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

  settingsWindow = new BrowserWindow({
    width: SETTINGS_WINDOW_DEFAULT_WIDTH,
    height: SETTINGS_WINDOW_DEFAULT_HEIGHT,
    minWidth: SETTINGS_WINDOW_MIN_WIDTH,
    minHeight: SETTINGS_WINDOW_MIN_HEIGHT,
    title: 'Settings - Compose Booster',
    parent: parent,
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'settingsPreload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the settings page
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    // In development, load from dev server
    settingsWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/settings/settings.html`);
  } else {
    // In production, load from built files
    settingsWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/settings/settings.html`));
  }

  // Show when ready
  settingsWindow.once('ready-to-show', () => {
    settingsWindow?.show();
  });

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

// Declare Vite environment variables
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;
