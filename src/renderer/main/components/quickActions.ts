// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Quick Actions Component
// Manages the quick-action buttons

import { AppConfig, QuickAction } from '../../../shared/types';

export class QuickActionsManager {
  private config: AppConfig | null = null;
  private quickAction1Btn: HTMLButtonElement;
  private quickAction2Btn: HTMLButtonElement;
  private quickAction3Btn: HTMLButtonElement;

  constructor() {
    this.quickAction1Btn = document.getElementById('quickAction1') as HTMLButtonElement;
    this.quickAction2Btn = document.getElementById('quickAction2') as HTMLButtonElement;
    this.quickAction3Btn = document.getElementById('quickAction3') as HTMLButtonElement;
  }

  /**
   * Initialize quick actions with config data
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
    if (!this.config || this.config.quickActions.length < 3) return;

    this.updateButton(this.quickAction1Btn, this.config.quickActions[0]);
    this.updateButton(this.quickAction2Btn, this.config.quickActions[1]);
    this.updateButton(this.quickAction3Btn, this.config.quickActions[2]);
  }

  /**
   * Update a single button with quick action data
   */
  private updateButton(button: HTMLButtonElement, action: QuickAction): void {
    const iconSpan = button.querySelector('.quick-action-icon');
    const labelSpan = button.querySelector('.quick-action-label');

    if (iconSpan) {
      iconSpan.textContent = action.icon;
    }

    if (labelSpan) {
      labelSpan.textContent = action.name;
    }
  }

  /**
   * Get the configuration for a quick action by index (0-2)
   */
  getQuickAction(index: number): QuickAction | null {
    if (!this.config || index < 0 || index >= this.config.quickActions.length) {
      return null;
    }
    return this.config.quickActions[index];
  }

  /**
   * Setup click handlers for quick action buttons
   */
  setupHandlers(onQuickActionClick: (index: number) => void): void {
    this.quickAction1Btn.addEventListener('click', () => onQuickActionClick(0));
    this.quickAction2Btn.addEventListener('click', () => onQuickActionClick(1));
    this.quickAction3Btn.addEventListener('click', () => onQuickActionClick(2));
  }

  /**
   * Enable or disable all quick action buttons
   */
  setEnabled(enabled: boolean): void {
    this.quickAction1Btn.disabled = !enabled;
    this.quickAction2Btn.disabled = !enabled;
    this.quickAction3Btn.disabled = !enabled;
  }

  /**
   * Reload quick actions from config
   */
  async reload(): Promise<void> {
    await this.initialize();
  }
}
