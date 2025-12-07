// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Hot Combos Component
// Manages the quick-action hot combo buttons

import { AppConfig, HotCombo } from '../../../shared/types';

export class HotCombosManager {
  private config: AppConfig | null = null;
  private hotCombo1Btn: HTMLButtonElement;
  private hotCombo2Btn: HTMLButtonElement;
  private hotCombo3Btn: HTMLButtonElement;

  constructor() {
    this.hotCombo1Btn = document.getElementById('hotCombo1') as HTMLButtonElement;
    this.hotCombo2Btn = document.getElementById('hotCombo2') as HTMLButtonElement;
    this.hotCombo3Btn = document.getElementById('hotCombo3') as HTMLButtonElement;
  }

  /**
   * Initialize hot combos with config data
   */
  async initialize(): Promise<void> {
    const result = await window.electronAPI.getConfig();
    if (result.success && result.data) {
      this.config = result.data;
      this.updateButtons();
    }
  }

  /**
   * Update button labels and icons from config
   */
  private updateButtons(): void {
    if (!this.config || this.config.hotCombos.length < 3) return;

    this.updateButton(this.hotCombo1Btn, this.config.hotCombos[0]);
    this.updateButton(this.hotCombo2Btn, this.config.hotCombos[1]);
    this.updateButton(this.hotCombo3Btn, this.config.hotCombos[2]);
  }

  /**
   * Update a single button with combo data
   */
  private updateButton(button: HTMLButtonElement, combo: HotCombo): void {
    const iconSpan = button.querySelector('.hot-combo-icon');
    const labelSpan = button.querySelector('.hot-combo-label');

    if (iconSpan) {
      iconSpan.textContent = combo.icon;
    }

    if (labelSpan) {
      labelSpan.textContent = combo.name;
    }
  }

  /**
   * Get the configuration for a hot combo by index (0-2)
   */
  getHotCombo(index: number): HotCombo | null {
    if (!this.config || index < 0 || index >= this.config.hotCombos.length) {
      return null;
    }
    return this.config.hotCombos[index];
  }

  /**
   * Setup click handlers for hot combo buttons
   */
  setupHandlers(onHotComboClick: (index: number) => void): void {
    this.hotCombo1Btn.addEventListener('click', () => onHotComboClick(0));
    this.hotCombo2Btn.addEventListener('click', () => onHotComboClick(1));
    this.hotCombo3Btn.addEventListener('click', () => onHotComboClick(2));
  }

  /**
   * Enable or disable all hot combo buttons
   */
  setEnabled(enabled: boolean): void {
    this.hotCombo1Btn.disabled = !enabled;
    this.hotCombo2Btn.disabled = !enabled;
    this.hotCombo3Btn.disabled = !enabled;
  }

  /**
   * Reload hot combos from config
   */
  async reload(): Promise<void> {
    await this.initialize();
  }
}
