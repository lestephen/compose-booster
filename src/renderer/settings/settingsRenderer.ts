// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Settings Window Renderer

import './settingsStyles.css';
import { AppConfig, OutputFormat } from '../../shared/types';
import { HELP_LINKS, HelpLinkKey } from '../../shared/helpLinks';
import { TabManager } from './components/tabManager';
import { ModelsTab } from './tabs/modelsTab';
import { PromptsTab } from './tabs/promptsTab';
import { TonesTab } from './tabs/tonesTab';
import { StylesTab } from './tabs/stylesTab';
import { QuickActionsTab } from './tabs/quickActionsTab';
import { AdvancedTab } from './tabs/advancedTab';
import { AboutTab } from './tabs/aboutTab';

class SettingsController {
  private config: AppConfig | null = null;
  private isDirty = false;
  private tabManager: TabManager;
  private modelsTab: ModelsTab | null = null;
  private promptsTab: PromptsTab | null = null;
  private tonesTab: TonesTab | null = null;
  private stylesTab: StylesTab | null = null;
  private quickActionsTab: QuickActionsTab | null = null;
  private advancedTab: AdvancedTab | null = null;
  private aboutTab: AboutTab | null = null;

  // UI Elements
  private apiKeyInput: HTMLInputElement;
  private testApiKeyBtn: HTMLButtonElement;
  private apiKeyStatus: HTMLElement;
  private themeSelect: HTMLSelectElement;
  private fontSizeSlider: HTMLInputElement;
  private fontSizeValue: HTMLElement;
  private saveWindowPositionCheckbox: HTMLInputElement;
  private clearHistoryOnExitCheckbox: HTMLInputElement;
  private includeClosingAndSignatureCheckbox: HTMLInputElement;
  private outputFormatSelect: HTMLSelectElement;
  private saveBtn: HTMLButtonElement;
  private cancelBtn: HTMLButtonElement;
  private openRouterLink: HTMLAnchorElement;

  constructor() {
    // Get UI elements
    this.apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
    this.testApiKeyBtn = document.getElementById('testApiKeyBtn') as HTMLButtonElement;
    this.apiKeyStatus = document.getElementById('apiKeyStatus') as HTMLElement;
    this.themeSelect = document.getElementById('themeSelect') as HTMLSelectElement;
    this.fontSizeSlider = document.getElementById('fontSize') as HTMLInputElement;
    this.fontSizeValue = document.getElementById('fontSizeValue') as HTMLElement;
    this.saveWindowPositionCheckbox = document.getElementById('saveWindowPosition') as HTMLInputElement;
    this.clearHistoryOnExitCheckbox = document.getElementById('clearHistoryOnExit') as HTMLInputElement;
    this.includeClosingAndSignatureCheckbox = document.getElementById('includeClosingAndSignature') as HTMLInputElement;
    this.outputFormatSelect = document.getElementById('outputFormat') as HTMLSelectElement;
    this.saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
    this.cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;
    this.openRouterLink = document.getElementById('openRouterLink') as HTMLAnchorElement;

    this.init();
  }

  private async init(): Promise<void> {
    // Initialize tab manager
    this.tabManager = new TabManager();

    // Load current configuration
    await this.loadConfig();

    // Initialize tabs
    this.initializeTabs();

    // Setup event listeners
    this.setupEventListeners();

    // Populate form
    this.populateForm();
  }

  private initializeTabs(): void {
    if (!this.config) return;

    // Initialize models tab
    const modelsContainer = document.getElementById('modelsTableContainer');
    if (modelsContainer) {
      this.modelsTab = new ModelsTab(
        modelsContainer,
        this.config,
        (updatedConfig) => this.handleConfigChange(updatedConfig)
      );
    }

    // Initialize prompts tab
    const promptsContainer = document.getElementById('promptsListContainer');
    if (promptsContainer) {
      this.promptsTab = new PromptsTab(
        promptsContainer,
        this.config,
        (updatedConfig) => this.handleConfigChange(updatedConfig)
      );
    }

    // Initialize tones tab
    const tonesContainer = document.getElementById('tonesListContainer');
    if (tonesContainer) {
      this.tonesTab = new TonesTab(
        tonesContainer,
        this.config,
        (updatedConfig) => this.handleConfigChange(updatedConfig)
      );
    }

    // Initialize styles tab
    const stylesContainer = document.getElementById('stylesListContainer');
    if (stylesContainer) {
      this.stylesTab = new StylesTab(
        stylesContainer,
        this.config,
        (updatedConfig) => this.handleConfigChange(updatedConfig)
      );
    }

    // Initialize hot combos tab
    const quickActionsContainer = document.getElementById('quickActionsContainer');
    if (quickActionsContainer) {
      this.quickActionsTab = new QuickActionsTab(
        quickActionsContainer,
        this.config,
        (updatedConfig) => this.handleConfigChange(updatedConfig)
      );
    }

    // Initialize advanced tab
    const advancedContainer = document.getElementById('advancedSettingsContainer');
    if (advancedContainer) {
      this.advancedTab = new AdvancedTab(
        advancedContainer,
        this.config,
        (updatedConfig) => this.handleConfigChange(updatedConfig)
      );
    }

    // Initialize about tab
    const aboutContainer = document.getElementById('aboutContainer');
    if (aboutContainer) {
      this.aboutTab = new AboutTab(aboutContainer);
    }
  }

  private handleConfigChange(updatedConfig: AppConfig): void {
    this.config = updatedConfig;
    this.markDirty();
  }

  private async loadConfig(): Promise<void> {
    try {
      const result = await window.electronAPI.getConfig();
      if (result.success && result.data) {
        this.config = result.data;
      }
    } catch {
      this.showApiKeyStatus('Failed to load configuration', 'error');
    }
  }

  private setupEventListeners(): void {
    // Test API key button
    this.testApiKeyBtn.addEventListener('click', () => this.handleTestApiKey());

    // Save button
    this.saveBtn.addEventListener('click', () => this.handleSave());

    // Cancel button
    this.cancelBtn.addEventListener('click', () => this.handleCancel());

    // OpenRouter link
    this.openRouterLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.electronAPI.openExternal('https://openrouter.ai/keys');
    });

    // Track changes
    this.apiKeyInput.addEventListener('input', () => this.markDirty());
    this.themeSelect.addEventListener('change', () => this.markDirty());
    this.fontSizeSlider.addEventListener('input', () => {
      const fontSize = this.fontSizeSlider.value;
      this.fontSizeValue.textContent = fontSize;
      this.applyFontSize(parseInt(fontSize, 10));
      this.markDirty();
    });
    this.saveWindowPositionCheckbox.addEventListener('change', () => this.markDirty());
    this.clearHistoryOnExitCheckbox.addEventListener('change', () => this.markDirty());
    this.includeClosingAndSignatureCheckbox.addEventListener('change', () => this.markDirty());
    this.outputFormatSelect.addEventListener('change', () => this.markDirty());

    // Help buttons - open documentation in browser
    this.setupHelpButtons();
  }

  private setupHelpButtons(): void {
    const helpButtons = document.querySelectorAll<HTMLButtonElement>('.help-btn[data-help]');
    helpButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const helpKey = button.getAttribute('data-help') as HelpLinkKey;
        if (helpKey && HELP_LINKS[helpKey]) {
          window.electronAPI.openExternal(HELP_LINKS[helpKey]);
        }
      });
    });
  }

  private populateForm(): void {
    if (!this.config) return;

    // API Key (show partially for security)
    this.apiKeyInput.value = this.config.apiKey || '';

    // Theme
    this.themeSelect.value = this.config.preferences.theme;

    // Font Size
    this.fontSizeSlider.value = this.config.preferences.fontSize.toString();
    this.fontSizeValue.textContent = this.config.preferences.fontSize.toString();
    this.applyFontSize(this.config.preferences.fontSize);

    // Checkboxes
    this.saveWindowPositionCheckbox.checked = this.config.preferences.saveWindowPosition;
    this.clearHistoryOnExitCheckbox.checked = this.config.preferences.clearHistoryOnExit;
    this.includeClosingAndSignatureCheckbox.checked = this.config.preferences.includeClosingAndSignature;

    // Output format
    this.outputFormatSelect.value = this.config.preferences.outputFormat || 'plain';
  }

  private applyFontSize(size: number): void {
    document.documentElement.style.setProperty('--font-size-base', `${size}px`);
  }

  private async handleTestApiKey(): Promise<void> {
    const apiKey = this.apiKeyInput.value.trim();

    if (!apiKey) {
      this.showApiKeyStatus('Please enter an API key', 'error');
      return;
    }

    this.testApiKeyBtn.disabled = true;
    this.testApiKeyBtn.textContent = 'Testing...';
    this.hideApiKeyStatus();

    try {
      const result = await window.electronAPI.testApiKey(apiKey);

      if (result.success) {
        this.showApiKeyStatus('✓ API key is valid!', 'success');
        // Save the API key immediately and reload models
        if (this.config) {
          this.config.apiKey = apiKey;
          await window.electronAPI.setConfig({ apiKey });
          // Reload models now that we have a valid API key
          if (this.modelsTab) {
            this.modelsTab.reloadModels();
          }
        }
      } else {
        this.showApiKeyStatus(`✗ ${result.error?.message || 'Invalid API key'}`, 'error');
      }
    } catch {
      this.showApiKeyStatus('Failed to test API key', 'error');
    } finally {
      this.testApiKeyBtn.disabled = false;
      this.testApiKeyBtn.textContent = 'Test Key';
    }
  }

  private async handleSave(): Promise<void> {
    if (!this.config) return;

    // Update config with form values
    this.config.apiKey = this.apiKeyInput.value.trim();
    this.config.preferences.theme = this.themeSelect.value as 'light' | 'dark' | 'system';
    this.config.preferences.fontSize = parseInt(this.fontSizeSlider.value, 10);
    this.config.preferences.saveWindowPosition = this.saveWindowPositionCheckbox.checked;
    this.config.preferences.clearHistoryOnExit = this.clearHistoryOnExitCheckbox.checked;
    this.config.preferences.includeClosingAndSignature = this.includeClosingAndSignatureCheckbox.checked;
    this.config.preferences.outputFormat = this.outputFormatSelect.value as OutputFormat;

    this.saveBtn.disabled = true;
    this.saveBtn.textContent = 'Saving...';

    try {
      const result = await window.electronAPI.setConfig(this.config);

      if (result.success) {
        this.isDirty = false;
        this.saveBtn.textContent = 'Saved!';
        setTimeout(() => {
          this.saveBtn.textContent = 'Save Settings';
          this.saveBtn.disabled = false;
          // Close window after successful save
          window.electronAPI.closeWindow();
        }, 1000);
      } else {
        this.showApiKeyStatus('Failed to save settings', 'error');
        this.saveBtn.disabled = false;
        this.saveBtn.textContent = 'Save Settings';
      }
    } catch {
      this.showApiKeyStatus('Failed to save settings', 'error');
      this.saveBtn.disabled = false;
      this.saveBtn.textContent = 'Save Settings';
    }
  }

  private handleCancel(): void {
    if (this.isDirty) {
      // In a real app, we might want to confirm before closing
      const confirmed = confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }

    window.electronAPI.closeWindow();
  }

  private markDirty(): void {
    this.isDirty = true;
    this.saveBtn.disabled = false;
  }

  private showApiKeyStatus(message: string, type: 'success' | 'error'): void {
    this.apiKeyStatus.textContent = message;
    this.apiKeyStatus.className = `status-message ${type}`;
    this.apiKeyStatus.classList.remove('hidden');
  }

  private hideApiKeyStatus(): void {
    this.apiKeyStatus.classList.add('hidden');
  }
}

// Initialize settings controller when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SettingsController());
} else {
  new SettingsController();
}
