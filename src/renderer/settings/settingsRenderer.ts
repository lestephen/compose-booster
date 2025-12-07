// Settings Window Renderer

import './settingsStyles.css';
import { AppConfig } from '../../shared/types';
import { TabManager } from './components/tabManager';
import { ModelsTab } from './tabs/modelsTab';
import { PromptsTab } from './tabs/promptsTab';
import { TonesTab } from './tabs/tonesTab';
import { HotCombosTab } from './tabs/hotCombosTab';
import { AdvancedTab } from './tabs/advancedTab';

class SettingsController {
  private config: AppConfig | null = null;
  private isDirty = false;
  private tabManager: TabManager;
  private modelsTab: ModelsTab | null = null;
  private promptsTab: PromptsTab | null = null;
  private tonesTab: TonesTab | null = null;
  private hotCombosTab: HotCombosTab | null = null;
  private advancedTab: AdvancedTab | null = null;

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

    // Initialize hot combos tab
    const hotCombosContainer = document.getElementById('hotCombosContainer');
    if (hotCombosContainer) {
      this.hotCombosTab = new HotCombosTab(
        hotCombosContainer,
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
    } catch (error) {
      console.error('Failed to load config:', error);
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
      // Open external link (would need shell.openExternal in main process)
      console.log('Open https://openrouter.ai/dashboard');
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
  }

  private applyFontSize(size: number): void {
    console.log('applyFontSize called with size:', size);
    document.documentElement.style.setProperty('--font-size-base', `${size}px`);
    console.log('CSS variable set to:', document.documentElement.style.getPropertyValue('--font-size-base'));
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
      } else {
        this.showApiKeyStatus(`✗ ${result.error?.message || 'Invalid API key'}`, 'error');
      }
    } catch (error) {
      console.error('Failed to test API key:', error);
      this.showApiKeyStatus('Failed to test API key', 'error');
    } finally {
      this.testApiKeyBtn.disabled = false;
      this.testApiKeyBtn.textContent = 'Test Key';
    }
  }

  private async handleSave(): Promise<void> {
    console.log('handleSave called');
    if (!this.config) return;

    // Update config with form values
    this.config.apiKey = this.apiKeyInput.value.trim();
    this.config.preferences.theme = this.themeSelect.value as 'light' | 'dark' | 'system';
    this.config.preferences.fontSize = parseInt(this.fontSizeSlider.value, 10);
    this.config.preferences.saveWindowPosition = this.saveWindowPositionCheckbox.checked;
    this.config.preferences.clearHistoryOnExit = this.clearHistoryOnExitCheckbox.checked;
    this.config.preferences.includeClosingAndSignature = this.includeClosingAndSignatureCheckbox.checked;

    this.saveBtn.disabled = true;
    this.saveBtn.textContent = 'Saving...';

    try {
      console.log('Calling setConfig with:', this.config);
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
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showApiKeyStatus('Failed to save settings', 'error');
      this.saveBtn.disabled = false;
      this.saveBtn.textContent = 'Save Settings';
    }
  }

  private handleCancel(): void {
    console.log('handleCancel called, isDirty:', this.isDirty);
    if (this.isDirty) {
      // In a real app, we might want to confirm before closing
      const confirmed = confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }

    console.log('Calling window.electronAPI.closeWindow()');
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
