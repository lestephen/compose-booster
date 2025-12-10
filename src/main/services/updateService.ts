// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Update Service
// Handles application auto-updates for GitHub distribution using electron-updater

import { autoUpdater, UpdateInfo, ProgressInfo, UpdateDownloadedEvent } from 'electron-updater';
import { BrowserWindow, app } from 'electron';
import { IPC_CHANNELS } from '../ipc/channels';
import { isAutoUpdateAvailable, getDistributionChannel, getDistributionChannelName } from '../utils/distributionDetector';
import { UpdateStatus, DistributionChannel } from '../../shared/types';
import { APP_VERSION } from '../../shared/constants';

class UpdateService {
  private status: UpdateStatus = {
    available: false,
    checking: false,
    downloading: false,
    downloaded: false,
    error: null,
    progress: 0,
    version: null,
    releaseNotes: null,
  };

  private initialized = false;

  constructor() {
    // Configure autoUpdater settings
    autoUpdater.autoDownload = false; // Let user choose to download
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowDowngrade = false;

    // Disable auto-update in development mode
    if (!app.isPackaged) {
      autoUpdater.forceDevUpdateConfig = true;
    }
  }

  /**
   * Initialize the update service
   * Only sets up listeners if auto-update is available for this distribution
   */
  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Skip initialization for store distributions
    if (!isAutoUpdateAvailable()) {
      console.log(`[UpdateService] Auto-update disabled for ${getDistributionChannelName()} distribution`);
      return;
    }

    console.log('[UpdateService] Initializing for GitHub distribution');

    // Set up event listeners
    autoUpdater.on('checking-for-update', () => {
      console.log('[UpdateService] Checking for updates...');
      this.status.checking = true;
      this.status.error = null;
      this.broadcastStatus();
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      console.log(`[UpdateService] Update available: ${info.version}`);
      this.status.checking = false;
      this.status.available = true;
      this.status.version = info.version;
      this.status.releaseNotes = this.extractReleaseNotes(info);
      this.broadcastStatus();
    });

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      console.log('[UpdateService] No updates available');
      this.status.checking = false;
      this.status.available = false;
      this.status.version = null;
      this.broadcastStatus();
    });

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      console.log(`[UpdateService] Download progress: ${Math.round(progress.percent)}%`);
      this.status.downloading = true;
      this.status.progress = Math.round(progress.percent);
      this.broadcastStatus();
    });

    autoUpdater.on('update-downloaded', (event: UpdateDownloadedEvent) => {
      console.log(`[UpdateService] Update downloaded: ${event.version}`);
      this.status.downloading = false;
      this.status.downloaded = true;
      this.status.progress = 100;
      this.status.version = event.version;
      this.broadcastStatus();
    });

    autoUpdater.on('error', (error: Error) => {
      console.error('[UpdateService] Error:', error.message);
      this.status.checking = false;
      this.status.downloading = false;
      this.status.error = this.formatErrorMessage(error);
      this.broadcastStatus();
    });
  }

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<UpdateStatus> {
    if (!isAutoUpdateAvailable()) {
      console.log('[UpdateService] Auto-update not available for this distribution');
      return this.status;
    }

    // Reset status before checking
    this.status.error = null;
    this.status.checking = true;
    this.broadcastStatus();

    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('[UpdateService] Check for updates failed:', error);
      this.status.error = error instanceof Error ? this.formatErrorMessage(error) : 'Unknown error';
      this.status.checking = false;
      this.broadcastStatus();
    }

    return this.status;
  }

  /**
   * Download the available update
   */
  async downloadUpdate(): Promise<void> {
    if (!this.status.available || this.status.downloading) {
      console.log('[UpdateService] Cannot download: no update available or already downloading');
      return;
    }

    console.log('[UpdateService] Starting download...');
    this.status.downloading = true;
    this.status.progress = 0;
    this.status.error = null;
    this.broadcastStatus();

    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('[UpdateService] Download failed:', error);
      this.status.downloading = false;
      this.status.error = error instanceof Error ? this.formatErrorMessage(error) : 'Download failed';
      this.broadcastStatus();
    }
  }

  /**
   * Install the downloaded update and restart the app
   */
  quitAndInstall(): void {
    if (!this.status.downloaded) {
      console.log('[UpdateService] Cannot install: no update downloaded');
      return;
    }

    console.log('[UpdateService] Installing update and restarting...');
    autoUpdater.quitAndInstall();
  }

  /**
   * Get current update status
   */
  getStatus(): UpdateStatus {
    return { ...this.status };
  }

  /**
   * Check if auto-update is available for this distribution
   */
  isAvailable(): boolean {
    return isAutoUpdateAvailable();
  }

  /**
   * Get the current app version
   */
  getCurrentVersion(): string {
    return app.getVersion() || APP_VERSION;
  }

  /**
   * Get the distribution channel
   */
  getDistributionChannel(): DistributionChannel {
    return getDistributionChannel();
  }

  /**
   * Get the distribution channel name
   */
  getDistributionChannelName(): string {
    return getDistributionChannelName();
  }

  /**
   * Get update information for display
   */
  getUpdateInfo(): {
    currentVersion: string;
    distributionChannel: string;
    autoUpdateAvailable: boolean;
  } {
    return {
      currentVersion: this.getCurrentVersion(),
      distributionChannel: this.getDistributionChannelName(),
      autoUpdateAvailable: this.isAvailable(),
    };
  }

  /**
   * Extract release notes from UpdateInfo
   */
  private extractReleaseNotes(info: UpdateInfo): string | null {
    if (typeof info.releaseNotes === 'string') {
      return info.releaseNotes;
    }

    if (Array.isArray(info.releaseNotes)) {
      return info.releaseNotes.map((n) => n.note).join('\n');
    }

    return null;
  }

  /**
   * Format error messages for user display
   */
  private formatErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('net::err_internet_disconnected') || message.includes('getaddrinfo')) {
      return 'No internet connection. Please check your network.';
    }

    if (message.includes('net::err_connection_refused')) {
      return 'Could not connect to update server.';
    }

    if (message.includes('signature verification failed')) {
      return 'Update verification failed. Please try again later.';
    }

    if (message.includes('enospc') || message.includes('no space')) {
      return 'Not enough disk space to download update.';
    }

    // Return original message if no specific handling
    return error.message;
  }

  /**
   * Broadcast status to all windows
   */
  private broadcastStatus(): void {
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send(IPC_CHANNELS.UPDATE_STATUS_CHANGED, this.status);
      }
    });
  }
}

// Export singleton instance
export const updateService = new UpdateService();
