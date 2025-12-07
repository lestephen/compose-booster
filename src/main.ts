// Main Process Entry Point for Compose Booster

import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import started from 'electron-squirrel-startup';
import { createMainWindow, getMainWindow } from './main/windows/mainWindow';
import { createSettingsWindow } from './main/windows/settingsWindow';
import { registerIpcHandlers } from './main/ipc/handlers';
import { IPC_CHANNELS } from './main/ipc/channels';
import { createApplicationMenu } from './main/services/menuService';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
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

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE_SETTINGS, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.close();
  });

  // Create application menu
  const menu = createApplicationMenu(() => {
    const mainWin = getMainWindow();
    if (mainWin) {
      createSettingsWindow(mainWin);
    }
  });
  Menu.setApplicationMenu(menu);

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
