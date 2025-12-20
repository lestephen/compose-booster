// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Main Process Entry Point for Compose Booster

import { app, BrowserWindow, ipcMain, Menu, nativeImage } from 'electron';
import * as path from 'path';
import started from 'electron-squirrel-startup';
import { createMainWindow, getMainWindow } from './main/windows/mainWindow';
import { createSettingsWindow } from './main/windows/settingsWindow';
import { registerIpcHandlers } from './main/ipc/handlers';
import { IPC_CHANNELS } from './main/ipc/channels';
import { createApplicationMenu } from './main/services/menuService';
import { configService } from './main/services/configService';
import { updateService } from './main/services/updateService';
import { UPDATE_CHECK_DELAY_MS } from './shared/constants';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Disable Fontations backend to prevent crash in MAS sandbox environment
// The Fontations Rust font library crashes during V8 init on macOS MAS builds
// See: https://groups.google.com/a/chromium.org/g/blink-dev/c/4xUt73fxCrU
// Note: This may not work as crash occurs before JS runs - see GitHub issue #2
if (process.platform === 'darwin') {
  app.commandLine.appendSwitch('disable-features', 'FontationsBackend');
}

// Enable remote debugging if SCREENSHOT_MODE is set (for automated screenshot capture)
if (process.env.SCREENSHOT_MODE) {
  const debugPort = process.env.DEBUG_PORT || '9222';
  app.commandLine.appendSwitch('remote-debugging-port', debugPort);
  app.commandLine.appendSwitch('remote-allow-origins', '*');
  console.log(`[Screenshot Mode] Remote debugging enabled on port ${debugPort}`);
}

// Helper function to rebuild the application menu
function rebuildMenu(): void {
  const config = configService.getConfig();
  const menu = createApplicationMenu({
    onOpenSettings: () => {
      const mainWin = getMainWindow();
      if (mainWin) {
        createSettingsWindow(mainWin);
      }
    },
    onCheckForUpdates: () => {
      // Open settings window to About tab when user clicks Check for Updates
      const mainWin = getMainWindow();
      if (mainWin) {
        createSettingsWindow(mainWin);
        // Note: The settings window will show update status in the About tab
      }
    },
    showDeveloperTools: config.preferences.showDeveloperTools,
  });
  Menu.setApplicationMenu(menu);
}

// Register all IPC handlers before creating windows
app.whenReady().then(() => {
  registerIpcHandlers();

  // Configure the macOS About panel and dock icon
  if (process.platform === 'darwin') {
    // Get the base path for assets
    const assetsBase = app.isPackaged
      ? process.resourcesPath
      : path.join(app.getAppPath(), 'assets', 'icons');

    // Use PNG for the About panel icon (more reliable than icns)
    const iconPngPath = app.isPackaged
      ? path.join(assetsBase, 'app', 'icon-256.png')  // Would need to copy this to resources
      : path.join(assetsBase, 'png', 'icon-256.png');

    // Create native image for the About panel
    let aboutIcon: Electron.NativeImage | undefined;
    try {
      aboutIcon = nativeImage.createFromPath(iconPngPath);
      if (aboutIcon.isEmpty()) {
        aboutIcon = undefined;
      }
    } catch {
      aboutIcon = undefined;
    }

    app.setAboutPanelOptions({
      applicationName: 'Compose Booster',
      applicationVersion: app.getVersion(),
      version: '', // Hide the Electron version in parentheses
      copyright: '© 2025 Stephen Le\nLicensed under MPL-2.0',
      credits: 'Powered by OpenRouter API\nBuilt with Electron, TypeScript, and Vite',
      website: 'https://github.com/lestephen/compose-booster',
      ...(aboutIcon && !aboutIcon.isEmpty() ? { icon: aboutIcon } : {}),
    });

    // Set dock icon in development mode
    if (!app.isPackaged && app.dock) {
      try {
        const pngPath = path.join(assetsBase, 'png', 'icon-256.png');
        app.dock.setIcon(pngPath);
      } catch {
        // Silently ignore if icon fails to load
      }
    }
  }

  // Register window management handlers
  ipcMain.handle(IPC_CHANNELS.WINDOW_OPEN_SETTINGS, () => {
    const mainWin = getMainWindow();
    if (mainWin) {
      createSettingsWindow(mainWin);
    }
  });

  // Handler to rebuild menu when settings change
  ipcMain.handle(IPC_CHANNELS.MENU_REBUILD, () => {
    rebuildMenu();
    return { success: true };
  });

  // Note: WINDOW_CLOSE_SETTINGS handler is in handlers.ts

  // Create application menu with initial settings
  rebuildMenu();

  // Initialize update service (will auto-skip for store distributions)
  updateService.initialize();

  // Create main window
  createMainWindow();

  // Check for updates silently on startup (after a delay to let app fully load)
  if (updateService.isAvailable()) {
    setTimeout(() => {
      updateService.checkForUpdates().catch((err) => {
        console.error('[Main] Startup update check failed:', err);
      });
    }, UPDATE_CHECK_DELAY_MS);
  }
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
