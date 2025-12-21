// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Settings Window Preload Script
// Exposes secure IPC API to settings renderer via contextBridge

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../main/ipc/channels';
import { AppConfig, IpcResponse, UpdateStatus, ProviderId, ProviderConfig, ProviderInfo } from '../shared/types';

// Expose settings-specific API
contextBridge.exposeInMainWorld('electronAPI', {
  // Configuration
  getConfig: (): Promise<IpcResponse<AppConfig>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET_ALL),

  setConfig: (config: Partial<AppConfig>): Promise<IpcResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET, config),

  getDefaults: (): Promise<IpcResponse<AppConfig>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET_DEFAULTS),

  resetConfig: (): Promise<IpcResponse<AppConfig>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_RESET),

  exportConfig: (): Promise<IpcResponse<string>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_EXPORT),

  importConfig: (): Promise<IpcResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_IMPORT),

  testApiKey: (apiKey: string): Promise<IpcResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_TEST_API_KEY, apiKey),

  // Models
  getAvailableModels: (): Promise<IpcResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.API_GET_MODELS),

  // Theme
  getTheme: (): Promise<IpcResponse<string>> =>
    ipcRenderer.invoke(IPC_CHANNELS.THEME_GET),

  setTheme: (theme: 'light' | 'dark' | 'system'): Promise<IpcResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.THEME_SET, theme),

  // Config Updated Events
  onConfigUpdated: (callback: () => void) => {
    ipcRenderer.on(IPC_CHANNELS.CONFIG_UPDATED, callback);
  },

  // Menu
  rebuildMenu: (): Promise<IpcResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.MENU_REBUILD),

  // Close window
  closeWindow: (): void => {
    ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE_SETTINGS);
  },

  // Shell
  openExternal: (url: string): Promise<IpcResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.SHELL_OPEN_EXTERNAL, url),

  // App Info
  getAppVersion: (): Promise<IpcResponse<string>> =>
    ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),

  // Auto-Update
  checkForUpdates: (): Promise<IpcResponse<UpdateStatus>> =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_CHECK),

  downloadUpdate: (): Promise<IpcResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_DOWNLOAD),

  installUpdate: (): Promise<IpcResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_INSTALL),

  getUpdateStatus: (): Promise<IpcResponse<UpdateStatus>> =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_GET_STATUS),

  isAutoUpdateAvailable: (): Promise<IpcResponse<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_IS_AVAILABLE),

  getUpdateInfo: (): Promise<IpcResponse<{
    currentVersion: string;
    distributionChannel: string;
    autoUpdateAvailable: boolean;
  }>> =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_GET_INFO),

  onUpdateStatusChanged: (callback: (status: UpdateStatus) => void) => {
    ipcRenderer.on(IPC_CHANNELS.UPDATE_STATUS_CHANGED, (_event, status) => callback(status));
  },

  // Providers
  testProvider: (providerId: ProviderId, config: ProviderConfig): Promise<IpcResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_TEST, providerId, config),

  getProviderModels: (providerId: ProviderId, config: ProviderConfig): Promise<IpcResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_GET_MODELS, providerId, config),

  getAllProviderInfo: (): Promise<IpcResponse<ProviderInfo[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_GET_ALL_INFO),
});

// TypeScript declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      getConfig: () => Promise<IpcResponse<AppConfig>>;
      setConfig: (config: Partial<AppConfig>) => Promise<IpcResponse>;
      getDefaults: () => Promise<IpcResponse<AppConfig>>;
      resetConfig: () => Promise<IpcResponse<AppConfig>>;
      exportConfig: () => Promise<IpcResponse<string>>;
      importConfig: () => Promise<IpcResponse>;
      testApiKey: (apiKey: string) => Promise<IpcResponse>;
      getAvailableModels: () => Promise<IpcResponse>;
      getTheme: () => Promise<IpcResponse<string>>;
      setTheme: (theme: 'light' | 'dark' | 'system') => Promise<IpcResponse>;
      onConfigUpdated: (callback: () => void) => void;
      rebuildMenu: () => Promise<IpcResponse>;
      closeWindow: () => void;
      openExternal: (url: string) => Promise<IpcResponse>;
      getAppVersion: () => Promise<IpcResponse<string>>;
      // Auto-Update
      checkForUpdates: () => Promise<IpcResponse<UpdateStatus>>;
      downloadUpdate: () => Promise<IpcResponse>;
      installUpdate: () => Promise<IpcResponse>;
      getUpdateStatus: () => Promise<IpcResponse<UpdateStatus>>;
      isAutoUpdateAvailable: () => Promise<IpcResponse<boolean>>;
      getUpdateInfo: () => Promise<IpcResponse<{
        currentVersion: string;
        distributionChannel: string;
        autoUpdateAvailable: boolean;
      }>>;
      onUpdateStatusChanged: (callback: (status: UpdateStatus) => void) => void;
      // Providers
      testProvider: (providerId: ProviderId, config: ProviderConfig) => Promise<IpcResponse>;
      getProviderModels: (providerId: ProviderId, config: ProviderConfig) => Promise<IpcResponse>;
      getAllProviderInfo: () => Promise<IpcResponse<ProviderInfo[]>>;
    };
  }
}
