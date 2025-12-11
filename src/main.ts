// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Main Process Entry Point for Compose Booster

import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import started from 'electron-squirrel-startup';
import { createMainWindow, getMainWindow } from './main/windows/mainWindow';
import { createSettingsWindow } from './main/windows/settingsWindow';
import { registerIpcHandlers } from './main/ipc/handlers';
import { IPC_CHANNELS } from './main/ipc/channels';
import { createApplicationMenu } from './main/services/menuService';
import { configService } from './main/services/configService';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
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
    showDeveloperTools: config.preferences.showDeveloperTools,
  });
  Menu.setApplicationMenu(menu);
}

// Register all IPC handlers before creating windows
app.whenReady().then(() => {
  registerIpcHandlers();

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

  // Create main window
  createMainWindow();
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
