// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Status Bar Component
// Manages status bar display

import { UpdateStatus } from '../../../shared/types';

export class StatusBarManager {
  private statusBar: HTMLElement;
  private messageElement: HTMLElement;
  private costElement: HTMLElement;
  private timeElement: HTMLElement;
  private modelElement: HTMLElement;
  private updateIndicator: HTMLElement;

  constructor() {
    this.statusBar = document.getElementById('statusBar') as HTMLElement;
    this.messageElement = this.statusBar.querySelector('.status-message') as HTMLElement;
    this.costElement = document.getElementById('statusCost') as HTMLElement;
    this.timeElement = document.getElementById('statusTime') as HTMLElement;
    this.modelElement = document.getElementById('statusModel') as HTMLElement;
    this.updateIndicator = document.getElementById('updateIndicator') as HTMLElement;

    this.initializeUpdateListener();
  }

  private async initializeUpdateListener(): Promise<void> {
    // Check initial update status
    try {
      const result = await window.electronAPI.getUpdateStatus();
      if (result.success && result.data) {
        this.handleUpdateStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to get initial update status:', error);
    }

    // Listen for update status changes
    window.electronAPI.onUpdateStatusChanged((status: UpdateStatus) => {
      this.handleUpdateStatus(status);
    });

    // Handle click on update indicator
    this.updateIndicator.addEventListener('click', async () => {
      if (this.updateIndicator.classList.contains('update-ready')) {
        try {
          await window.electronAPI.installUpdate();
        } catch (error) {
          console.error('Failed to install update:', error);
        }
      } else {
        // Open settings to About tab
        await window.electronAPI.openSettings();
      }
    });
  }

  private handleUpdateStatus(status: UpdateStatus): void {
    if (status.downloaded) {
      // Update is downloaded and ready to install
      this.updateIndicator.textContent = `v${status.version} ready`;
      this.updateIndicator.title = 'Click to restart and install update';
      this.updateIndicator.classList.remove('hidden');
      this.updateIndicator.classList.add('update-ready');
    } else if (status.available && status.version) {
      // Update is available but not downloaded
      this.updateIndicator.textContent = `v${status.version} available`;
      this.updateIndicator.title = 'Click to open Settings and download';
      this.updateIndicator.classList.remove('hidden', 'update-ready');
    } else {
      // No update available
      this.updateIndicator.classList.add('hidden');
      this.updateIndicator.classList.remove('update-ready');
    }
  }

  setReady(): void {
    this.setStatus('Ready', 'ready');
    this.hideDetails();
  }

  setProcessing(message = 'Processing...'): void {
    this.setStatus(message, 'processing');
    this.hideDetails();
  }

  setSuccess(model?: string, time?: number, cost?: number): void {
    this.setStatus('Success! Email processed.', 'success');

    // Show details
    if (model) {
      this.modelElement.textContent = `Model: ${model}`;
      this.modelElement.classList.remove('hidden');
    }

    if (time !== undefined) {
      this.timeElement.textContent = `Time: ${(time / 1000).toFixed(1)}s`;
      this.timeElement.classList.remove('hidden');
    }

    if (cost !== undefined) {
      this.costElement.textContent = `Cost: $${cost.toFixed(4)}`;
      this.costElement.classList.remove('hidden');
    }
  }

  setError(message: string): void {
    this.setStatus(message, 'error');
    this.hideDetails();
  }

  setWarning(message: string): void {
    this.setStatus(message, 'ready');
    this.hideDetails();
  }

  setInfo(message: string): void {
    this.setStatus(message, 'ready');
    this.hideDetails();
  }

  private setStatus(message: string, type: 'ready' | 'processing' | 'success' | 'error'): void {
    this.messageElement.textContent = message;

    // Remove all status classes
    this.statusBar.classList.remove('status-ready', 'status-processing', 'status-success', 'status-error');

    // Add new status class
    this.statusBar.classList.add(`status-${type}`);
  }

  private hideDetails(): void {
    this.costElement.classList.add('hidden');
    this.timeElement.classList.add('hidden');
    this.modelElement.classList.add('hidden');
  }
}
