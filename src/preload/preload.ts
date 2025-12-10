// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Main Window Preload Script
// Exposes secure IPC API to renderer via contextBridge

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../main/ipc/channels';
import { ProcessEmailRequest, RegenerateRequest, AppConfig, IpcResponse, ApiResponse, UpdateStatus } from '../shared/types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Configuration
  getConfig: (): Promise<IpcResponse<AppConfig>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET_ALL),

  setConfig: (config: Partial<AppConfig>): Promise<IpcResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET, config),

  getDefaults: (): Promise<IpcResponse<AppConfig>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET_DEFAULTS),

  exportConfig: (): Promise<IpcResponse<string>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_EXPORT),

  importConfig: (): Promise<IpcResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_IMPORT),

  testApiKey: (apiKey: string): Promise<IpcResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_TEST_API_KEY, apiKey),

  // API Operations
  processEmail: (request: ProcessEmailRequest): Promise<ApiResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.API_PROCESS_EMAIL, request),

  regenerate: (request: RegenerateRequest): Promise<ApiResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.API_REGENERATE, request),

  // Clipboard
  readClipboard: (): Promise<IpcResponse<string>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CLIPBOARD_READ),

  writeClipboard: (content: { text: string; html?: string }): Promise<IpcResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.CLIPBOARD_WRITE, content),

  // Theme
  getTheme: (): Promise<IpcResponse<string>> =>
    ipcRenderer.invoke(IPC_CHANNELS.THEME_GET),

  setTheme: (theme: 'light' | 'dark' | 'system'): Promise<IpcResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.THEME_SET, theme),

  // Window Management
  openSettings: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_OPEN_SETTINGS),

  closeSettings: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE_SETTINGS),

  // Menu Events (Renderer listens)
  onMenuEvent: (callback: (event: string) => void) => {
    const events = [
      IPC_CHANNELS.MENU_UNDO,
      IPC_CHANNELS.MENU_CLEAR_INPUT,
      IPC_CHANNELS.MENU_CLEAR_OUTPUT,
      IPC_CHANNELS.MENU_TOGGLE_DARK_MODE,
      IPC_CHANNELS.MENU_FONT_SIZE_INCREASE,
      IPC_CHANNELS.MENU_FONT_SIZE_DECREASE,
      IPC_CHANNELS.MENU_FONT_SIZE_RESET,
    ];

    events.forEach((eventName) => {
      ipcRenderer.on(eventName, () => callback(eventName));
    });
  },

  // Config Updated Events
  onConfigUpdated: (callback: () => void) => {
    ipcRenderer.on(IPC_CHANNELS.CONFIG_UPDATED, callback);
  },

  // Updates (for main window notification banner)
  getUpdateStatus: (): Promise<IpcResponse<UpdateStatus>> =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_GET_STATUS),

  installUpdate: (): Promise<IpcResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_INSTALL),

  onUpdateStatusChanged: (callback: (status: UpdateStatus) => void) => {
    ipcRenderer.on(IPC_CHANNELS.UPDATE_STATUS_CHANGED, (_, status) => callback(status));
  },
});

// TypeScript declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      getConfig: () => Promise<IpcResponse<AppConfig>>;
      setConfig: (config: Partial<AppConfig>) => Promise<IpcResponse>;
      getDefaults: () => Promise<IpcResponse<AppConfig>>;
      exportConfig: () => Promise<IpcResponse<string>>;
      importConfig: () => Promise<IpcResponse>;
      testApiKey: (apiKey: string) => Promise<IpcResponse>;
      processEmail: (request: ProcessEmailRequest) => Promise<ApiResponse>;
      regenerate: (request: RegenerateRequest) => Promise<ApiResponse>;
      readClipboard: () => Promise<IpcResponse<string>>;
      writeClipboard: (content: { text: string; html?: string }) => Promise<IpcResponse>;
      getTheme: () => Promise<IpcResponse<string>>;
      setTheme: (theme: 'light' | 'dark' | 'system') => Promise<IpcResponse>;
      openSettings: () => Promise<void>;
      closeSettings: () => Promise<void>;
      onMenuEvent: (callback: (event: string) => void) => void;
      onConfigUpdated: (callback: () => void) => void;
      // Updates
      getUpdateStatus: () => Promise<IpcResponse<UpdateStatus>>;
      installUpdate: () => Promise<IpcResponse>;
      onUpdateStatusChanged: (callback: (status: UpdateStatus) => void) => void;
    };
  }
}
