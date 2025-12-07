// Custom Combo Component
// Manages the custom combination dropdown controls

import { AppConfig, Model, Prompt, Tone } from '../../../shared/types';

export class CustomComboManager {
  private modelSelect: HTMLSelectElement;
  private promptSelect: HTMLSelectElement;
  private toneSelect: HTMLSelectElement;
  private config: AppConfig | null = null;

  constructor() {
    this.modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
    this.promptSelect = document.getElementById('promptSelect') as HTMLSelectElement;
    this.toneSelect = document.getElementById('toneSelect') as HTMLSelectElement;
  }

  async initialize(): Promise<void> {
    try {
      const result = await window.electronAPI.getConfig();
      if (result.success && result.data) {
        this.config = result.data;
        this.populateDropdowns();
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  private populateDropdowns(): void {
    if (!this.config) return;

    // Populate models (only enabled ones)
    this.modelSelect.innerHTML = '';
    const enabledModels = this.config.models.filter(m => m.enabled);
    enabledModels.forEach((model: Model) => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = `${model.name} (${model.cost})`;
      this.modelSelect.appendChild(option);
    });

    // Populate prompts
    this.promptSelect.innerHTML = '';
    Object.entries(this.config.prompts).forEach(([key, prompt]: [string, Prompt]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = prompt.name;
      this.promptSelect.appendChild(option);
    });

    // Populate tones
    this.toneSelect.innerHTML = '';
    this.config.tones.forEach((tone: Tone) => {
      const option = document.createElement('option');
      option.value = tone.id;
      option.textContent = tone.name;
      this.toneSelect.appendChild(option);
    });

    // Set last used values, with fallbacks
    if (this.config.lastUsed) {
      // Try to set last used model
      this.modelSelect.value = this.config.lastUsed.model;

      // If model wasn't set (doesn't exist or not enabled), select first enabled model
      if (!this.modelSelect.value && enabledModels.length > 0) {
        this.modelSelect.value = enabledModels[0].id;
      }

      // Try to set last used prompt
      this.promptSelect.value = this.config.lastUsed.prompt;

      // If prompt wasn't set, select first prompt
      if (!this.promptSelect.value) {
        const firstPromptKey = Object.keys(this.config.prompts)[0];
        if (firstPromptKey) {
          this.promptSelect.value = firstPromptKey;
        }
      }

      // Try to set last used tone
      this.toneSelect.value = this.config.lastUsed.tone;

      // If tone wasn't set, select first tone
      if (!this.toneSelect.value && this.config.tones.length > 0) {
        this.toneSelect.value = this.config.tones[0].id;
      }
    } else {
      // No lastUsed data, select defaults
      if (enabledModels.length > 0) {
        this.modelSelect.value = enabledModels[0].id;
      }

      const firstPromptKey = Object.keys(this.config.prompts)[0];
      if (firstPromptKey) {
        this.promptSelect.value = firstPromptKey;
      }

      if (this.config.tones.length > 0) {
        this.toneSelect.value = this.config.tones[0].id;
      }
    }
  }

  getSelection(): { model: string; prompt: string; tone: string } {
    return {
      model: this.modelSelect.value,
      prompt: this.promptSelect.value,
      tone: this.toneSelect.value,
    };
  }

  setSelection(model: string, prompt: string, tone: string): void {
    this.modelSelect.value = model;
    this.promptSelect.value = prompt;
    this.toneSelect.value = tone;
  }

  setEnabled(enabled: boolean): void {
    this.modelSelect.disabled = !enabled;
    this.promptSelect.disabled = !enabled;
    this.toneSelect.disabled = !enabled;
  }

  async reload(): Promise<void> {
    await this.initialize();
  }
}
