// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Main Window Renderer
// Main application controller

import './styles.css';
import { TextAreaManager } from './components/textAreas';
import { StatusBarManager } from './components/statusBar';
import { CustomComboManager } from './components/customCombo';
import { QuickActionsManager } from './components/quickActions';
import { HistoryManager } from './components/history';
import { ResponseVersionManager } from './components/responseVersions';
import { ThemeManager } from './utils/themeManager';
import { ProcessEmailRequest, RegenerateRequest } from '../../shared/types';

class AppController {
  private textAreas: TextAreaManager;
  private statusBar: StatusBarManager;
  private customCombo: CustomComboManager;
  private quickActions: QuickActionsManager;
  private history: HistoryManager;
  private responseVersions: ResponseVersionManager;
  private themeManager: ThemeManager;
  private isProcessing = false;

  // Track last request parameters for regeneration
  private lastRequest: ProcessEmailRequest | null = null;

  // UI Elements
  private pasteBtn: HTMLButtonElement;
  private copyBtn: HTMLButtonElement;
  private clearInputBtn: HTMLButtonElement;
  private clearOutputBtn: HTMLButtonElement;
  private processBtn: HTMLButtonElement;
  private cancelBtn: HTMLButtonElement;
  private regenerateBtn: HTMLButtonElement;
  private loadingOverlay: HTMLElement;
  private copyConfirmation: HTMLElement;
  private versionNavigator: HTMLElement;
  private versionIndicator: HTMLElement;
  private prevVersionBtn: HTMLButtonElement;
  private nextVersionBtn: HTMLButtonElement;

  constructor() {
    // Initialize components
    this.textAreas = new TextAreaManager();
    this.statusBar = new StatusBarManager();
    this.customCombo = new CustomComboManager();
    this.quickActions = new QuickActionsManager();
    this.history = new HistoryManager();
    this.responseVersions = new ResponseVersionManager();
    this.themeManager = new ThemeManager();

    // Get UI elements
    this.pasteBtn = document.getElementById('pasteBtn') as HTMLButtonElement;
    this.copyBtn = document.getElementById('copyBtn') as HTMLButtonElement;
    this.clearInputBtn = document.getElementById('clearInputBtn') as HTMLButtonElement;
    this.clearOutputBtn = document.getElementById('clearOutputBtn') as HTMLButtonElement;
    this.processBtn = document.getElementById('processBtn') as HTMLButtonElement;
    this.cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;
    this.regenerateBtn = document.getElementById('regenerateBtn') as HTMLButtonElement;
    this.loadingOverlay = document.getElementById('loadingOverlay') as HTMLElement;
    this.copyConfirmation = document.getElementById('copyConfirmation') as HTMLElement;
    this.versionNavigator = document.getElementById('versionNavigator') as HTMLElement;
    this.versionIndicator = document.getElementById('versionIndicator') as HTMLElement;
    this.prevVersionBtn = document.getElementById('prevVersionBtn') as HTMLButtonElement;
    this.nextVersionBtn = document.getElementById('nextVersionBtn') as HTMLButtonElement;

    this.init();
  }

  private async init(): Promise<void> {
    // Initialize custom combo dropdowns
    await this.customCombo.initialize();

    // Initialize hot combos
    await this.quickActions.initialize();

    // Setup event listeners
    this.setupEventListeners();

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Listen for config updates
    this.setupConfigListener();

    // Set initial status
    this.statusBar.setReady();
  }

  private setupEventListeners(): void {
    // Paste button
    this.pasteBtn.addEventListener('click', () => this.handlePaste());

    // Copy button
    this.copyBtn.addEventListener('click', () => this.handleCopy());

    // Clear buttons
    this.clearInputBtn.addEventListener('click', () => this.textAreas.clearInput());
    this.clearOutputBtn.addEventListener('click', () => this.handleClearOutput());

    // Process button
    this.processBtn.addEventListener('click', () => this.handleProcess());

    // Cancel button
    this.cancelBtn.addEventListener('click', () => this.handleCancel());

    // Regenerate button
    this.regenerateBtn.addEventListener('click', () => this.handleRegenerate());

    // Version navigation buttons
    this.prevVersionBtn.addEventListener('click', () => this.navigateVersion('prev'));
    this.nextVersionBtn.addEventListener('click', () => this.navigateVersion('next'));

    // Hot combo buttons
    this.quickActions.setupHandlers((index) => this.handleQuickAction(index));
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      const isMac = navigator.platform.includes('Mac');
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + Z - Undo
      if (modifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.handleUndo();
      }

      // Ctrl/Cmd + Shift + V - Paste
      if (modifier && e.shiftKey && e.key === 'v') {
        e.preventDefault();
        this.handlePaste();
      }

      // Ctrl/Cmd + Shift + C - Copy
      if (modifier && e.shiftKey && e.key === 'c') {
        e.preventDefault();
        this.handleCopy();
      }

      // Ctrl/Cmd + Enter - Process
      if (modifier && e.key === 'Enter') {
        e.preventDefault();
        this.handleProcess();
      }

      // Ctrl/Cmd + K - Clear input
      if (modifier && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        this.textAreas.clearInput();
      }

      // Ctrl/Cmd + Shift + K - Clear output
      if (modifier && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        this.textAreas.clearOutput();
      }

      // ESC - Cancel operation
      if (e.key === 'Escape' && this.isProcessing) {
        e.preventDefault();
        this.handleCancel();
      }

      // Ctrl/Cmd + 1/2/3 - Hot combos
      if (modifier && !e.shiftKey && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        this.handleQuickAction(index);
      }
    });
  }

  private setupConfigListener(): void {
    // Listen for config updates from settings window
    window.electronAPI.onConfigUpdated(async () => {
      // Reload dropdowns to reflect updated models/prompts/tones
      await this.customCombo.reload();
      await this.quickActions.reload();
    });
  }

  private handleUndo(): void {
    const previousText = this.history.pop();
    if (previousText !== undefined) {
      this.textAreas.setInput(previousText);
      this.statusBar.setInfo('Undo successful');
    } else {
      this.statusBar.setWarning('Nothing to undo');
    }
  }

  private async handlePaste(): Promise<void> {
    try {
      const result = await window.electronAPI.readClipboard();
      if (result.success && result.data) {
        // Save current state to history before pasting
        const currentInput = this.textAreas.getInput();
        this.history.push(currentInput);

        this.textAreas.setInput(result.data);
        this.statusBar.setReady();
      }
    } catch {
      this.statusBar.setError('Failed to paste from clipboard');
    }
  }

  private async handleCopy(): Promise<void> {
    try {
      const output = this.textAreas.getOutput();
      if (!output) {
        this.statusBar.setWarning('Nothing to copy');
        return;
      }

      const result = await window.electronAPI.writeClipboard(output);
      if (result.success) {
        // Show confirmation
        this.copyConfirmation.classList.remove('hidden');
        setTimeout(() => {
          this.copyConfirmation.classList.add('hidden');
        }, 2000);
      }
    } catch {
      this.statusBar.setError('Failed to copy to clipboard');
    }
  }

  private async handleProcess(): Promise<void> {
    if (this.isProcessing) return;

    const input = this.textAreas.getInput();
    if (!input || input.trim() === '') {
      this.statusBar.setError('Please enter some text to process');
      return;
    }

    const selection = this.customCombo.getSelection();

    // Clear response versions when starting a new process
    this.responseVersions.clear();
    this.hideVersionNavigator();

    this.isProcessing = true;
    this.showLoading();
    this.setControlsEnabled(false);

    const startTime = Date.now();
    const initialTemperature = this.responseVersions.getInitialTemperature();

    try {
      const request: ProcessEmailRequest = {
        input: input,
        model: selection.model,
        prompt: selection.prompt,
        tone: selection.tone,
      };

      // Store the request for potential regeneration
      this.lastRequest = request;

      const response = await window.electronAPI.processEmail(request);

      const time = Date.now() - startTime;

      if (response.success && response.data) {
        // Store this version
        this.responseVersions.addVersion(
          response.data,
          selection.model,
          selection.prompt,
          selection.tone,
          initialTemperature,
          response.cost
        );

        this.textAreas.setOutput(response.data);
        this.statusBar.setSuccess(response.model, time, response.cost);

        // Show regenerate button and update UI
        this.showRegenerateButton();
        this.updateVersionNavigator();
      } else if (response.error) {
        this.statusBar.setError(response.error.message);
      }
    } catch {
      this.statusBar.setError('An unexpected error occurred');
    } finally {
      this.isProcessing = false;
      this.hideLoading();
      this.setControlsEnabled(true);
    }
  }

  private async handleQuickAction(index: number): Promise<void> {
    if (this.isProcessing) return;

    const input = this.textAreas.getInput();
    if (!input || input.trim() === '') {
      this.statusBar.setError('Please enter some text to process');
      return;
    }

    const hotCombo = this.quickActions.getQuickAction(index);
    if (!hotCombo) {
      this.statusBar.setError('Hot combo not configured');
      return;
    }

    // Clear response versions when starting a new process
    this.responseVersions.clear();
    this.hideVersionNavigator();

    this.isProcessing = true;
    this.showLoading();
    this.setControlsEnabled(false);

    const startTime = Date.now();
    const initialTemperature = this.responseVersions.getInitialTemperature();

    try {
      const request: ProcessEmailRequest = {
        input: input,
        model: hotCombo.model,
        prompt: hotCombo.prompt,
        tone: hotCombo.tone,
      };

      // Store the request for potential regeneration
      this.lastRequest = request;

      const response = await window.electronAPI.processEmail(request);

      const time = Date.now() - startTime;

      if (response.success && response.data) {
        // Store this version
        this.responseVersions.addVersion(
          response.data,
          hotCombo.model,
          hotCombo.prompt,
          hotCombo.tone,
          initialTemperature,
          response.cost
        );

        this.textAreas.setOutput(response.data);
        this.statusBar.setSuccess(response.model, time, response.cost);

        // Show regenerate button and update UI
        this.showRegenerateButton();
        this.updateVersionNavigator();
      } else if (response.error) {
        this.statusBar.setError(response.error.message);
      }
    } catch {
      this.statusBar.setError('An unexpected error occurred');
    } finally {
      this.isProcessing = false;
      this.hideLoading();
      this.setControlsEnabled(true);
    }
  }

  private handleCancel(): void {
    // For now, just hide loading (actual cancellation would need API support)
    this.isProcessing = false;
    this.hideLoading();
    this.setControlsEnabled(true);
    this.statusBar.setReady();
  }

  private showLoading(): void {
    this.loadingOverlay.classList.remove('hidden');
    this.statusBar.setProcessing();
  }

  private hideLoading(): void {
    this.loadingOverlay.classList.add('hidden');
  }

  private setControlsEnabled(enabled: boolean): void {
    this.pasteBtn.disabled = !enabled;
    this.copyBtn.disabled = !enabled;
    this.clearInputBtn.disabled = !enabled;
    this.clearOutputBtn.disabled = !enabled;
    this.processBtn.disabled = !enabled;
    this.regenerateBtn.disabled = !enabled;
    this.customCombo.setEnabled(enabled);
    this.quickActions.setEnabled(enabled);
  }

  private handleClearOutput(): void {
    this.textAreas.clearOutput();
    this.responseVersions.clear();
    this.lastRequest = null;
    this.hideRegenerateButton();
    this.hideVersionNavigator();
  }

  private async handleRegenerate(): Promise<void> {
    if (this.isProcessing || !this.lastRequest) return;

    const input = this.textAreas.getInput();
    if (!input || input.trim() === '') {
      this.statusBar.setError('Please enter some text to process');
      return;
    }

    this.isProcessing = true;
    this.showLoading();
    this.setControlsEnabled(false);

    const startTime = Date.now();
    const temperature = this.responseVersions.getNextRegenerateTemperature();

    try {
      const request: RegenerateRequest = {
        input: input,
        model: this.lastRequest.model,
        prompt: this.lastRequest.prompt,
        tone: this.lastRequest.tone,
        temperature: temperature,
      };

      const response = await window.electronAPI.regenerate(request);

      const time = Date.now() - startTime;

      if (response.success && response.data) {
        // Store this version
        this.responseVersions.addVersion(
          response.data,
          this.lastRequest.model,
          this.lastRequest.prompt,
          this.lastRequest.tone,
          temperature,
          response.cost
        );

        this.textAreas.setOutput(response.data);
        this.statusBar.setSuccess(response.model, time, response.cost);

        // Update version navigator
        this.updateVersionNavigator();
      } else if (response.error) {
        this.statusBar.setError(response.error.message);
      }
    } catch {
      this.statusBar.setError('An unexpected error occurred');
    } finally {
      this.isProcessing = false;
      this.hideLoading();
      this.setControlsEnabled(true);
    }
  }

  private navigateVersion(direction: 'prev' | 'next'): void {
    const version = direction === 'prev'
      ? this.responseVersions.previousVersion()
      : this.responseVersions.nextVersion();

    if (version) {
      this.textAreas.setOutput(version.content);
      this.updateVersionNavigator();
    }
  }

  private showRegenerateButton(): void {
    this.regenerateBtn.classList.remove('hidden');
  }

  private hideRegenerateButton(): void {
    this.regenerateBtn.classList.add('hidden');
  }

  private updateVersionNavigator(): void {
    const totalVersions = this.responseVersions.getTotalVersions();

    if (totalVersions > 1) {
      this.versionNavigator.classList.remove('hidden');
      this.versionIndicator.textContent = `${this.responseVersions.getCurrentVersionNumber()} of ${totalVersions}`;
      this.prevVersionBtn.disabled = !this.responseVersions.hasPrevious();
      this.nextVersionBtn.disabled = !this.responseVersions.hasNext();
    } else {
      this.versionNavigator.classList.add('hidden');
    }
  }

  private hideVersionNavigator(): void {
    this.versionNavigator.classList.add('hidden');
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AppController());
} else {
  new AppController();
}
