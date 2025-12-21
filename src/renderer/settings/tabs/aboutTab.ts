// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// About Tab
// Application information, credits, and auto-update functionality

import { APP_NAME } from '../../../shared/constants';
import { UpdateStatus } from '../../../shared/types';

export class AboutTab {
  private container: HTMLElement;
  private version = 'Loading...';
  private distributionChannel = '';
  private autoUpdateAvailable = false;
  private updateStatus: UpdateStatus = {
    available: false,
    checking: false,
    downloading: false,
    downloaded: false,
    error: null,
    progress: 0,
    version: null,
    releaseNotes: null,
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await Promise.all([
      this.loadVersion(),
      this.loadUpdateInfo(),
      this.loadUpdateStatus(),
    ]);

    // Listen for update status changes
    window.electronAPI.onUpdateStatusChanged((status: UpdateStatus) => {
      this.updateStatus = status;
      this.updateUI();
    });
  }

  private async loadVersion(): Promise<void> {
    try {
      const result = await window.electronAPI.getAppVersion();
      if (result.success && result.data) {
        this.version = result.data;
        this.updateVersionDisplay();
      }
    } catch (error) {
      console.error('Failed to get app version:', error);
      this.version = 'Unknown';
      this.updateVersionDisplay();
    }
  }

  private async loadUpdateInfo(): Promise<void> {
    try {
      const result = await window.electronAPI.getUpdateInfo();
      if (result.success && result.data) {
        this.distributionChannel = result.data.distributionChannel;
        this.autoUpdateAvailable = result.data.autoUpdateAvailable;
        this.updateUI();
      }
    } catch (error) {
      console.error('Failed to get update info:', error);
    }
  }

  private async loadUpdateStatus(): Promise<void> {
    try {
      const result = await window.electronAPI.getUpdateStatus();
      if (result.success && result.data) {
        this.updateStatus = result.data;
        this.updateUI();
      }
    } catch (error) {
      console.error('Failed to get update status:', error);
    }
  }

  private updateVersionDisplay(): void {
    const versionElement = this.container.querySelector('#app-version');
    if (versionElement) {
      versionElement.textContent = `Version ${this.version}`;
    }
  }

  private updateUI(): void {
    this.updateVersionDisplay();
    this.updateDistributionDisplay();
    this.updateUpdateSection();
  }

  private updateDistributionDisplay(): void {
    const channelElement = this.container.querySelector('#distribution-channel');
    if (channelElement && this.distributionChannel) {
      const channelName = this.getChannelDisplayName(this.distributionChannel);
      channelElement.textContent = channelName;
      channelElement.classList.remove('hidden');
    }
  }

  private getChannelDisplayName(channel: string): string {
    switch (channel) {
      case 'mac-store':
        return 'Mac App Store';
      case 'ms-store':
        return 'Microsoft Store';
      case 'github':
        return 'GitHub Release';
      default:
        return channel;
    }
  }

  private updateUpdateSection(): void {
    const updateSection = this.container.querySelector('#update-section');
    if (!updateSection) return;

    if (!this.autoUpdateAvailable) {
      // Store distribution - show store update message
      updateSection.innerHTML = `
        <div class="update-store-message">
          <p class="form-text">Updates are delivered through the ${this.getChannelDisplayName(this.distributionChannel)}.</p>
        </div>
      `;
      return;
    }

    // GitHub distribution - show update controls
    let content = '';

    if (this.updateStatus.checking) {
      content = `
        <div class="update-status update-status-info">
          <span class="spinner"></span>
          Checking for updates...
        </div>
      `;
    } else if (this.updateStatus.downloading) {
      content = `
        <div class="update-status update-status-info">
          Downloading update...
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${this.updateStatus.progress}%"></div>
        </div>
        <div class="update-progress-text">${Math.round(this.updateStatus.progress)}%</div>
      `;
    } else if (this.updateStatus.downloaded) {
      content = `
        <div class="update-status update-status-success">
          Update v${this.updateStatus.version} downloaded and ready to install!
        </div>
        <button id="install-update-btn" class="btn btn-primary">
          Restart & Install
        </button>
      `;
      if (this.updateStatus.releaseNotes) {
        content += `
          <div class="release-notes">
            <h4>Release Notes</h4>
            <div class="release-notes-content">${this.formatReleaseNotes(this.updateStatus.releaseNotes)}</div>
          </div>
        `;
      }
    } else if (this.updateStatus.error) {
      content = `
        <div class="update-status update-status-error">
          ${this.updateStatus.error}
        </div>
        <button id="check-update-btn" class="btn btn-secondary">
          Try Again
        </button>
      `;
    } else if (this.updateStatus.available && this.updateStatus.version) {
      content = `
        <div class="update-status update-status-success">
          Update v${this.updateStatus.version} is available!
        </div>
        <button id="download-update-btn" class="btn btn-primary">
          Download Update
        </button>
      `;
      if (this.updateStatus.releaseNotes) {
        content += `
          <div class="release-notes">
            <h4>Release Notes</h4>
            <div class="release-notes-content">${this.formatReleaseNotes(this.updateStatus.releaseNotes)}</div>
          </div>
        `;
      }
    } else {
      content = `
        <button id="check-update-btn" class="btn btn-secondary">
          Check for Updates
        </button>
        <div class="update-status-hint form-text">
          Last checked: ${this.getLastCheckTime()}
        </div>
      `;
    }

    updateSection.innerHTML = content;
    this.attachUpdateEventListeners();
  }

  private formatReleaseNotes(notes: string): string {
    // Basic markdown-like formatting for release notes
    return notes
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  }

  private getLastCheckTime(): string {
    // For now, just show "Never" or "Just now"
    // Could be enhanced to store last check time
    return 'Not recently';
  }

  private attachUpdateEventListeners(): void {
    const checkBtn = this.container.querySelector('#check-update-btn');
    const downloadBtn = this.container.querySelector('#download-update-btn');
    const installBtn = this.container.querySelector('#install-update-btn');

    checkBtn?.addEventListener('click', () => this.checkForUpdates());
    downloadBtn?.addEventListener('click', () => this.downloadUpdate());
    installBtn?.addEventListener('click', () => this.installUpdate());
  }

  private async checkForUpdates(): Promise<void> {
    try {
      const result = await window.electronAPI.checkForUpdates();
      if (result.success && result.data) {
        this.updateStatus = result.data;
        this.updateUI();
      } else if (result.error) {
        this.updateStatus.error = result.error.message;
        this.updateUI();
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
      this.updateStatus.error = 'Failed to check for updates';
      this.updateUI();
    }
  }

  private async downloadUpdate(): Promise<void> {
    try {
      await window.electronAPI.downloadUpdate();
      // Status will be updated via onUpdateStatusChanged listener
    } catch (error) {
      console.error('Failed to download update:', error);
      this.updateStatus.error = 'Failed to download update';
      this.updateUI();
    }
  }

  private async installUpdate(): Promise<void> {
    try {
      await window.electronAPI.installUpdate();
      // App will quit and restart
    } catch (error) {
      console.error('Failed to install update:', error);
      this.updateStatus.error = 'Failed to install update';
      this.updateUI();
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <section class="settings-section about-section">
        <h2>About ${APP_NAME}</h2>

        <div class="about-app-info">
          <div class="app-identity">
            <h3>${APP_NAME}</h3>
            <p id="app-version">Version ${this.version}</p>
            <p id="distribution-channel" class="distribution-badge hidden"></p>
          </div>
          <p class="app-description">An AI-powered email composition assistant</p>
        </div>

        <div class="form-group">
          <h3>Updates</h3>
          <div id="update-section" class="update-section">
            <div class="update-status update-status-info">
              <span class="spinner"></span>
              Loading update information...
            </div>
          </div>
        </div>

        <div class="form-group">
          <h3>Technology</h3>
          <p class="form-text">Powered by OpenRouter API with access to multiple AI models from Anthropic, OpenAI, Google, Meta, and Mistral.</p>
          <p class="form-text">Built with Electron, TypeScript, and Vite.</p>
        </div>

        <div class="form-group">
          <h3>License</h3>
          <p class="form-text">
            This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
          </p>
          <p class="form-text">
            Copyright &copy; 2025 Stephen Le
          </p>
        </div>
      </section>
    `;
  }
}
