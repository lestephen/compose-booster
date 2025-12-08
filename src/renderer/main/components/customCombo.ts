// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Custom Combo Component
// Manages the custom combination dropdown controls

import { AppConfig, Model, Prompt, Tone, StyleProfile } from '../../../shared/types';

export class CustomComboManager {
  private modelSelect: HTMLSelectElement;
  private promptSelect: HTMLSelectElement;
  private toneSelect: HTMLSelectElement;
  private styleSelect: HTMLSelectElement;
  private config: AppConfig | null = null;

  constructor() {
    this.modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
    this.promptSelect = document.getElementById('promptSelect') as HTMLSelectElement;
    this.toneSelect = document.getElementById('toneSelect') as HTMLSelectElement;
    this.styleSelect = document.getElementById('styleSelect') as HTMLSelectElement;
  }

  async initialize(): Promise<void> {
    try {
      const result = await window.electronAPI.getConfig();
      if (result.success && result.data) {
        this.config = result.data;
        this.populateDropdowns();
      }
    } catch {
      // Config load failed - dropdowns will remain empty
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

    // Populate styles
    this.styleSelect.innerHTML = '';
    if (this.config.styles) {
      this.config.styles.forEach((style: StyleProfile) => {
        const option = document.createElement('option');
        option.value = style.id;
        option.textContent = style.name;
        this.styleSelect.appendChild(option);
      });
    }

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

      // Try to set last used style
      if (this.config.lastUsed.style) {
        this.styleSelect.value = this.config.lastUsed.style;
      }

      // If style wasn't set, select first style (usually 'none')
      if (!this.styleSelect.value && this.config.styles && this.config.styles.length > 0) {
        this.styleSelect.value = this.config.styles[0].id;
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

      if (this.config.styles && this.config.styles.length > 0) {
        this.styleSelect.value = this.config.styles[0].id;
      }
    }
  }

  getSelection(): { model: string; prompt: string; tone: string; style: string } {
    return {
      model: this.modelSelect.value,
      prompt: this.promptSelect.value,
      tone: this.toneSelect.value,
      style: this.styleSelect.value,
    };
  }

  setSelection(model: string, prompt: string, tone: string, style?: string): void {
    this.modelSelect.value = model;
    this.promptSelect.value = prompt;
    this.toneSelect.value = tone;
    if (style) {
      this.styleSelect.value = style;
    }
  }

  setEnabled(enabled: boolean): void {
    this.modelSelect.disabled = !enabled;
    this.promptSelect.disabled = !enabled;
    this.toneSelect.disabled = !enabled;
    this.styleSelect.disabled = !enabled;
  }

  async reload(): Promise<void> {
    await this.initialize();
  }
}
