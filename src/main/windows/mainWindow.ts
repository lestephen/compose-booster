// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Main Window Manager

import { BrowserWindow } from 'electron';
import path from 'path';
import { configService } from '../services/configService';
import {
  MAIN_WINDOW_DEFAULT_WIDTH,
  MAIN_WINDOW_DEFAULT_HEIGHT,
  MAIN_WINDOW_MIN_WIDTH,
  MAIN_WINDOW_MIN_HEIGHT,
} from '../../shared/constants';

let mainWindow: BrowserWindow | null = null;

export function createMainWindow(): BrowserWindow {
  const config = configService.getConfig();
  const bounds = config.windowBounds;

  mainWindow = new BrowserWindow({
    width: bounds.width || MAIN_WINDOW_DEFAULT_WIDTH,
    height: bounds.height || MAIN_WINDOW_DEFAULT_HEIGHT,
    x: bounds.x,
    y: bounds.y,
    minWidth: MAIN_WINDOW_MIN_WIDTH,
    minHeight: MAIN_WINDOW_MIN_HEIGHT,
    title: 'Compose Booster',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/main/index.html`);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/main/index.html`));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Save window bounds on resize/move (if preference enabled)
  mainWindow.on('resize', saveWindowBounds);
  mainWindow.on('move', saveWindowBounds);

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

function saveWindowBounds(): void {
  if (!mainWindow) return;

  const config = configService.getConfig();
  if (!config.preferences.saveWindowPosition) return;

  const bounds = mainWindow.getBounds();
  configService.updateWindowBounds(bounds);
}

// Declare Vite environment variables
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;
