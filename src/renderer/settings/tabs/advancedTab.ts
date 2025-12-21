// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Advanced Tab
// Export/import settings, about information

import { AppConfig } from '../../../shared/types';

export class AdvancedTab {
  private container: HTMLElement;
  private config: AppConfig;
  private onConfigChange: (config: AppConfig) => void;

  constructor(container: HTMLElement, config: AppConfig, onConfigChange: (config: AppConfig) => void) {
    this.container = container;
    this.config = config;
    this.onConfigChange = onConfigChange;
    this.render();
  }

  public updateConfig(config: AppConfig): void {
    this.config = config;
  }

  private render(): void {
    this.container.innerHTML = `
      <section class="settings-section">
        <h2>Updates</h2>

        <div class="form-group">
          <label class="toggle-label">
            <input type="checkbox" id="checkUpdatesToggle" ${this.config.preferences.checkUpdates ? 'checked' : ''}>
            <span>Check for updates automatically</span>
          </label>
          <small class="form-text">When enabled, the app will check for updates on startup. You can always check manually from the About tab.</small>
        </div>
      </section>

      <section class="settings-section">
        <h2>Developer Options</h2>

        <div class="form-group">
          <label class="toggle-label">
            <input type="checkbox" id="showDevToolsToggle" ${this.config.preferences.showDeveloperTools ? 'checked' : ''}>
            <span>Show Developer Tools in View menu</span>
          </label>
          <small class="form-text">Enable to show Reload, Force Reload, and Toggle Developer Tools options in the View menu.</small>
        </div>
      </section>

      <section class="settings-section">
        <h2>Data Management</h2>

        <div class="form-group">
          <button id="exportSettingsBtn" class="btn btn-secondary">Export Settings</button>
          <small class="form-text">Download your configuration as a JSON file for backup or transfer.</small>
        </div>

        <div class="form-group">
          <label for="importSettingsFile">Import Settings</label>
          <input type="file" id="importSettingsFile" accept=".json" style="display: none;">
          <button id="importSettingsBtn" class="btn btn-secondary">Import Settings</button>
          <small class="form-text">Load configuration from a previously exported JSON file.</small>
        </div>

        <div class="form-group">
          <button id="resetAllSettingsBtn" class="btn btn-danger">Reset All Settings</button>
          <small class="form-text">⚠️ This will reset all settings to factory defaults. This action cannot be undone.</small>
        </div>
      </section>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Check for updates toggle
    const checkUpdatesToggle = document.getElementById('checkUpdatesToggle') as HTMLInputElement;
    if (checkUpdatesToggle) {
      checkUpdatesToggle.addEventListener('change', () => this.handleCheckUpdatesToggle(checkUpdatesToggle.checked));
    }

    // Developer Tools toggle
    const devToolsToggle = document.getElementById('showDevToolsToggle') as HTMLInputElement;
    if (devToolsToggle) {
      devToolsToggle.addEventListener('change', () => this.handleDevToolsToggle(devToolsToggle.checked));
    }

    // Export button
    const exportBtn = document.getElementById('exportSettingsBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExport());
    }

    // Import button
    const importBtn = document.getElementById('importSettingsBtn');
    const importFile = document.getElementById('importSettingsFile') as HTMLInputElement;
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', (e) => this.handleImport(e));
    }

    // Reset button
    const resetBtn = document.getElementById('resetAllSettingsBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.handleResetAll());
    }
  }

  private handleCheckUpdatesToggle(enabled: boolean): void {
    const updatedConfig: AppConfig = {
      ...this.config,
      preferences: {
        ...this.config.preferences,
        checkUpdates: enabled,
      },
    };
    this.config = updatedConfig;
    this.onConfigChange(updatedConfig);
  }

  private async handleDevToolsToggle(enabled: boolean): Promise<void> {
    const updatedConfig: AppConfig = {
      ...this.config,
      preferences: {
        ...this.config.preferences,
        showDeveloperTools: enabled,
      },
    };
    this.config = updatedConfig;
    this.onConfigChange(updatedConfig);

    // Save the config immediately so the menu rebuild can read the new value
    try {
      await window.electronAPI.setConfig(updatedConfig);
      // Rebuild the menu to reflect the change
      await window.electronAPI.rebuildMenu();
    } catch {
      alert('Failed to update developer tools setting. Please try again.');
    }
  }

  private handleExport(): void {
    try {
      // Create a sanitized copy of config (without sensitive data like API key)
      const exportData = {
        ...this.config,
        apiKey: '', // Don't export API key for security
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `compose-booster-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Settings exported successfully!');
    } catch {
      alert('Failed to export settings. Please try again.');
    }
  }

  private async handleImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text) as Partial<AppConfig>;

      // Validate imported data
      if (!this.validateImportedConfig(imported)) {
        alert('Invalid configuration file. Please check the file and try again.');
        return;
      }

      // Confirm import
      if (!confirm('This will replace your current settings (except API key). Continue?')) {
        return;
      }

      // Merge imported settings with current config (preserve API key)
      const updatedConfig: AppConfig = {
        ...imported as AppConfig,
        apiKey: this.config.apiKey, // Preserve existing API key
      };

      this.config = updatedConfig;
      this.onConfigChange(updatedConfig);

      alert('Settings imported successfully! Changes will be applied when you save.');
    } catch {
      alert('Failed to import settings. Please check the file format.');
    } finally {
      // Clear the file input
      input.value = '';
    }
  }

  private async handleResetAll(): Promise<void> {
    const confirmation = confirm(
      'Are you absolutely sure you want to reset ALL settings to factory defaults?\n\n' +
      'This will:\n' +
      '- Remove all custom models, prompts, and tones\n' +
      '- Reset all preferences\n' +
      '- Clear your API key\n\n' +
      'This action cannot be undone!'
    );

    if (!confirmation) return;

    const doubleConfirmation = confirm('Last chance! Click OK to proceed with reset.');

    if (!doubleConfirmation) return;

    try {
      // Request reset from main process
      const result = await window.electronAPI.resetConfig();

      if (result.success && result.data) {
        this.config = result.data;
        this.onConfigChange(result.data);
        alert('All settings have been reset to defaults. The settings window will now close.');
        window.electronAPI.closeWindow();
      } else {
        alert('Failed to reset settings. Please try again.');
      }
    } catch {
      alert('Failed to reset settings. Please try again.');
    }
  }

  private validateImportedConfig(config: any): boolean {
    // Basic validation
    if (!config || typeof config !== 'object') return false;

    // Check required fields
    if (!Array.isArray(config.models)) return false;
    if (!Array.isArray(config.prompts)) return false;
    if (!Array.isArray(config.tones)) return false;
    if (!Array.isArray(config.quickActions)) return false;
    if (!config.preferences || typeof config.preferences !== 'object') return false;

    return true;
  }
}
