// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Providers Tab
// Manage AI provider configurations

import { AppConfig, ProviderConfig, ProviderInfo, ProviderId } from '../../../shared/types';

export class ProvidersTab {
  private container: HTMLElement;
  private config: AppConfig;
  private onConfigChange: (config: AppConfig) => void;
  private providerInfo: ProviderInfo[] = [];

  constructor(container: HTMLElement, config: AppConfig, onConfigChange: (config: AppConfig) => void) {
    this.container = container;
    this.config = config;
    this.onConfigChange = onConfigChange;
    this.loadProviderInfo();
  }

  public updateConfig(config: AppConfig): void {
    this.config = config;
    this.render();
  }

  private async loadProviderInfo(): Promise<void> {
    try {
      const result = await window.electronAPI.getAllProviderInfo();
      if (result.success && result.data) {
        this.providerInfo = result.data;
      }
    } catch (error) {
      console.error('Failed to load provider info:', error);
    }
    this.render();
  }

  private getProviderConfig(providerId: ProviderId): ProviderConfig | undefined {
    return this.config.providers?.find(p => p.id === providerId);
  }

  private render(): void {
    this.container.innerHTML = `
      <section class="settings-section">
        <h2>AI Providers</h2>
        <p class="section-description">Configure which AI providers to use for processing emails.</p>

        <div class="provider-list">
          ${this.providerInfo.map(info => this.renderProviderCard(info, this.getProviderConfig(info.id))).join('')}
        </div>
      </section>
    `;

    this.setupEventListeners();
  }

  private renderProviderCard(info: ProviderInfo, config?: ProviderConfig): string {
    const isEnabled = config?.enabled ?? false;
    const isDefault = config?.isDefault ?? false;
    const hasApiKey = !!config?.apiKey;
    const hasBaseUrl = !!config?.baseUrl;

    // Determine status
    let statusClass = 'provider-status-disabled';
    let statusText = 'Disabled';
    if (isEnabled) {
      if (info.requiresApiKey && !hasApiKey) {
        statusClass = 'provider-status-warning';
        statusText = 'API Key Required';
      } else if (info.requiresBaseUrl && !hasBaseUrl) {
        statusClass = 'provider-status-warning';
        statusText = 'Base URL Required';
      } else {
        statusClass = 'provider-status-enabled';
        statusText = 'Enabled';
      }
    }

    return `
      <div class="provider-card ${isEnabled ? 'provider-enabled' : ''}" data-provider-id="${info.id}">
        <div class="provider-card-header">
          <div class="provider-info">
            <h3 class="provider-name">
              ${info.name}
              ${isDefault ? '<span class="provider-default-badge">Default</span>' : ''}
            </h3>
            <p class="provider-description">${info.description}</p>
          </div>
          <div class="provider-status ${statusClass}">${statusText}</div>
        </div>

        <div class="provider-card-body">
          <div class="provider-toggle-row">
            <label class="toggle-switch">
              <input type="checkbox" class="provider-enable-toggle" data-provider-id="${info.id}" ${isEnabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label-text">Enable ${info.name}</span>
          </div>

          ${isEnabled ? this.renderProviderConfig(info, config) : ''}
        </div>

        ${info.helpUrl ? `
          <div class="provider-card-footer">
            <a href="#" class="provider-help-link" data-url="${info.helpUrl}">Get API Key</a>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderProviderConfig(info: ProviderInfo, config?: ProviderConfig): string {
    const sections: string[] = [];

    if (info.requiresApiKey) {
      sections.push(`
        <div class="provider-config-field">
          <label>API Key</label>
          <div class="api-key-input-group">
            <input type="password" class="form-control provider-api-key"
                   data-provider-id="${info.id}"
                   value="${config?.apiKey || ''}"
                   placeholder="Enter your ${info.name} API key">
            <button class="btn btn-secondary btn-small provider-test-btn" data-provider-id="${info.id}">Test</button>
          </div>
        </div>
      `);
    }

    if (info.requiresBaseUrl) {
      sections.push(`
        <div class="provider-config-field">
          <label>Base URL</label>
          <input type="text" class="form-control provider-base-url"
                 data-provider-id="${info.id}"
                 value="${config?.baseUrl || info.defaultBaseUrl || ''}"
                 placeholder="${info.defaultBaseUrl || 'https://api.example.com/v1'}">
        </div>
      `);
    }

    return sections.length > 0 ? `<div class="provider-config">${sections.join('')}</div>` : '';
  }

  private setupEventListeners(): void {
    // Enable/disable toggles
    this.container.querySelectorAll('.provider-enable-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const providerId = target.dataset.providerId as ProviderId;
        this.handleToggleProvider(providerId, target.checked);
      });
    });

    // API key inputs
    this.container.querySelectorAll('.provider-api-key').forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const providerId = target.dataset.providerId as ProviderId;
        this.handleApiKeyChange(providerId, target.value);
      });
    });

    // Base URL inputs
    this.container.querySelectorAll('.provider-base-url').forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const providerId = target.dataset.providerId as ProviderId;
        this.handleBaseUrlChange(providerId, target.value);
      });
    });

    // Test buttons
    this.container.querySelectorAll('.provider-test-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const providerId = target.dataset.providerId as ProviderId;
        this.handleTestConnection(providerId);
      });
    });

    // Help links
    this.container.querySelectorAll('.provider-help-link').forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const url = (e.target as HTMLAnchorElement).dataset.url;
        if (url) {
          await window.electronAPI.openExternal(url);
        }
      });
    });
  }

  private handleToggleProvider(providerId: ProviderId, enabled: boolean): void {
    const providers = [...(this.config.providers || [])];
    const index = providers.findIndex(p => p.id === providerId);

    if (index >= 0) {
      providers[index] = { ...providers[index], enabled };
    }

    const updatedConfig: AppConfig = {
      ...this.config,
      providers,
    };

    this.config = updatedConfig;
    this.onConfigChange(updatedConfig);
    this.render();
  }

  private handleApiKeyChange(providerId: ProviderId, apiKey: string): void {
    const providers = [...(this.config.providers || [])];
    const index = providers.findIndex(p => p.id === providerId);

    if (index >= 0) {
      providers[index] = { ...providers[index], apiKey };
    }

    const updatedConfig: AppConfig = {
      ...this.config,
      providers,
    };

    this.config = updatedConfig;
    this.onConfigChange(updatedConfig);
  }

  private handleBaseUrlChange(providerId: ProviderId, baseUrl: string): void {
    const providers = [...(this.config.providers || [])];
    const index = providers.findIndex(p => p.id === providerId);

    if (index >= 0) {
      providers[index] = { ...providers[index], baseUrl };
    }

    const updatedConfig: AppConfig = {
      ...this.config,
      providers,
    };

    this.config = updatedConfig;
    this.onConfigChange(updatedConfig);
  }

  private async handleTestConnection(providerId: ProviderId): Promise<void> {
    const providerConfig = this.getProviderConfig(providerId);
    if (!providerConfig) {
      alert('Provider not configured');
      return;
    }

    const btn = this.container.querySelector(`.provider-test-btn[data-provider-id="${providerId}"]`) as HTMLButtonElement;
    const originalText = btn.textContent;
    btn.textContent = 'Testing...';
    btn.disabled = true;

    try {
      const result = await window.electronAPI.testProvider(providerId, providerConfig);
      if (result.success) {
        alert('Connection successful!');
      } else {
        alert(`Connection failed: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Connection test failed. Please check your configuration.');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }
}
