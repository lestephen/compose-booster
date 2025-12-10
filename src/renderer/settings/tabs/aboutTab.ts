// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// About Tab
// Application information, credits, and auto-update controls

import { APP_NAME } from '../../../shared/constants';
import { UpdateStatus } from '../../../shared/types';

export class AboutTab {
  private container: HTMLElement;
  private autoUpdateAvailable: boolean = false;
  private currentVersion: string = '';
  private distributionChannel: string = '';

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private async init(): Promise<void> {
    // Get update info from main process
    const result = await window.electronAPI.getUpdateInfo();
    if (result.success && result.data) {
      this.autoUpdateAvailable = result.data.autoUpdateAvailable;
      this.currentVersion = result.data.currentVersion;
      this.distributionChannel = result.data.distributionChannel;
    }

    this.render();
    this.setupUpdateListener();
  }

  private render(): void {
    this.container.innerHTML = `
      <section class="settings-section">
        <h2>About ${APP_NAME}</h2>

        <div class="about-info">
          <p><strong>${APP_NAME}</strong></p>
          <p>Version: ${this.currentVersion}</p>
          <p>Distribution: ${this.distributionChannel}</p>
          <p class="app-description">An AI-powered email composition assistant</p>
        </div>

        ${this.autoUpdateAvailable ? this.renderUpdateSection() : this.renderStoreUpdateMessage()}

        <div class="about-credits">
          <p><small class="form-text">Powered by OpenRouter API with access to multiple AI models from Anthropic, OpenAI, Google, Meta, and Mistral.</small></p>
          <p><small class="form-text">Built with Electron, TypeScript, and Vite.</small></p>
        </div>
      </section>
    `;

    if (this.autoUpdateAvailable) {
      this.setupEventListeners();
    }
  }

  private renderUpdateSection(): string {
    return `
      <div class="update-section">
        <h3>Updates</h3>
        <div id="updateStatusContainer">
          <p id="updateStatusText">Click to check for updates</p>
          <div id="updateProgress" class="update-progress hidden">
            <div class="progress-bar">
              <div id="progressFill" class="progress-fill" style="width: 0%"></div>
            </div>
            <span id="progressText">0%</span>
          </div>
        </div>
        <div class="update-buttons">
          <button id="checkUpdateBtn" class="btn btn-secondary">Check for Updates</button>
          <button id="downloadUpdateBtn" class="btn btn-primary hidden">Download Update</button>
          <button id="installUpdateBtn" class="btn btn-success hidden">Install &amp; Restart</button>
        </div>
      </div>
    `;
  }

  private renderStoreUpdateMessage(): string {
    return `
      <div class="update-section store-update">
        <h3>Updates</h3>
        <p class="form-text">Updates are managed automatically by ${this.distributionChannel}.</p>
      </div>
    `;
  }

  private setupEventListeners(): void {
    const checkBtn = document.getElementById('checkUpdateBtn');
    const downloadBtn = document.getElementById('downloadUpdateBtn');
    const installBtn = document.getElementById('installUpdateBtn');

    checkBtn?.addEventListener('click', () => this.checkForUpdates());
    downloadBtn?.addEventListener('click', () => this.downloadUpdate());
    installBtn?.addEventListener('click', () => this.installUpdate());
  }

  private setupUpdateListener(): void {
    if (!this.autoUpdateAvailable) return;

    window.electronAPI.onUpdateStatusChanged((status: UpdateStatus) => {
      this.updateUI(status);
    });

    // Also check current status in case an update is already downloaded
    this.checkCurrentStatus();
  }

  private async checkCurrentStatus(): Promise<void> {
    const result = await window.electronAPI.getUpdateStatus();
    if (result.success && result.data) {
      // Only show status if there's something meaningful (not just an error from startup check)
      // We don't want to show errors from the automatic startup check
      if (result.data.available || result.data.downloaded || result.data.downloading) {
        this.updateUI(result.data);
      }
    }
  }

  /**
   * Convert raw error messages to user-friendly text
   */
  private formatErrorMessage(error: string): string {
    const lowerError = error.toLowerCase();

    // Network errors
    if (lowerError.includes('enotfound') || lowerError.includes('getaddrinfo') ||
        lowerError.includes('network') || lowerError.includes('internet')) {
      return 'Unable to connect. Please check your internet connection.';
    }

    // No releases found (common during development or before first release)
    if (lowerError.includes('404') || lowerError.includes('not found') ||
        lowerError.includes('no published') || lowerError.includes('cannot find')) {
      return 'No updates available at this time.';
    }

    // GitHub rate limiting
    if (lowerError.includes('rate limit') || lowerError.includes('403')) {
      return 'Update check temporarily unavailable. Please try again later.';
    }

    // File system errors (common in dev mode)
    if (lowerError.includes('enoent') || lowerError.includes('no such file')) {
      return 'Update check not available in development mode.';
    }

    // Timeout
    if (lowerError.includes('timeout') || lowerError.includes('etimedout')) {
      return 'Update check timed out. Please try again.';
    }

    // Generic fallback - just show a simple message
    return 'Unable to check for updates. Please try again later.';
  }

  private async checkForUpdates(): Promise<void> {
    const statusText = document.getElementById('updateStatusText');
    const checkBtn = document.getElementById('checkUpdateBtn') as HTMLButtonElement;

    if (statusText) statusText.textContent = 'Checking for updates...';
    if (checkBtn) checkBtn.disabled = true;

    const result = await window.electronAPI.checkForUpdates();

    if (result.success && result.data) {
      this.updateUI(result.data);
    } else {
      const errorMsg = result.error?.message || 'Unknown error';
      if (statusText) statusText.textContent = this.formatErrorMessage(errorMsg);
    }

    if (checkBtn) checkBtn.disabled = false;
  }

  private async downloadUpdate(): Promise<void> {
    const downloadBtn = document.getElementById('downloadUpdateBtn') as HTMLButtonElement;
    if (downloadBtn) downloadBtn.disabled = true;

    await window.electronAPI.downloadUpdate();
  }

  private async installUpdate(): Promise<void> {
    await window.electronAPI.installUpdate();
  }

  private updateUI(status: UpdateStatus): void {
    const statusText = document.getElementById('updateStatusText');
    const progressContainer = document.getElementById('updateProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const checkBtn = document.getElementById('checkUpdateBtn');
    const downloadBtn = document.getElementById('downloadUpdateBtn');
    const installBtn = document.getElementById('installUpdateBtn');

    // Reset visibility
    progressContainer?.classList.add('hidden');
    downloadBtn?.classList.add('hidden');
    installBtn?.classList.add('hidden');

    if (status.error) {
      if (statusText) statusText.textContent = this.formatErrorMessage(status.error);
      return;
    }

    if (status.checking) {
      if (statusText) statusText.textContent = 'Checking for updates...';
    } else if (status.downloading) {
      if (statusText) statusText.textContent = `Downloading version ${status.version}...`;
      progressContainer?.classList.remove('hidden');
      if (progressFill) progressFill.style.width = `${status.progress}%`;
      if (progressText) progressText.textContent = `${status.progress}%`;
    } else if (status.downloaded) {
      if (statusText) statusText.textContent = `Version ${status.version} is ready to install`;
      checkBtn?.classList.add('hidden');
      installBtn?.classList.remove('hidden');
    } else if (status.available) {
      if (statusText) statusText.textContent = `Version ${status.version} is available`;
      downloadBtn?.classList.remove('hidden');
    } else {
      if (statusText) statusText.textContent = 'You are running the latest version';
    }
  }
}
