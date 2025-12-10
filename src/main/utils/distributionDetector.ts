// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Distribution Channel Detection Utility
// Detects whether the app is running from GitHub, Microsoft Store, or Mac App Store

import { app } from 'electron';

export type DistributionChannel = 'github' | 'ms-store' | 'mac-store';

/**
 * Detect the current distribution channel
 *
 * Detection strategies:
 * 1. Mac App Store: Check process.mas flag (set by Electron for MAS builds)
 * 2. Microsoft Store: Check process.windowsStore flag or WindowsApps path
 * 3. GitHub: Default for all other cases
 */
export function getDistributionChannel(): DistributionChannel {
  // Mac App Store detection
  if (process.platform === 'darwin') {
    // Electron sets process.mas = true for Mac App Store builds
    if ((process as NodeJS.Process & { mas?: boolean }).mas === true) {
      return 'mac-store';
    }
  }

  // Microsoft Store detection (Windows)
  if (process.platform === 'win32') {
    // Electron sets process.windowsStore = true for Windows Store builds
    if ((process as NodeJS.Process & { windowsStore?: boolean }).windowsStore === true) {
      return 'ms-store';
    }

    // Alternative: Check for WindowsApps path pattern
    const exePath = app.getPath('exe');
    if (exePath.includes('WindowsApps') || exePath.includes('Program Files\\WindowsApps')) {
      return 'ms-store';
    }
  }

  // Default to GitHub distribution
  return 'github';
}

/**
 * Check if auto-update is available for this distribution
 * Auto-update is only available for GitHub distribution.
 * Store distributions are updated through their respective stores.
 */
export function isAutoUpdateAvailable(): boolean {
  return getDistributionChannel() === 'github';
}

/**
 * Get a human-readable name for the distribution channel
 */
export function getDistributionChannelName(): string {
  const channel = getDistributionChannel();
  switch (channel) {
    case 'github':
      return 'GitHub';
    case 'ms-store':
      return 'Microsoft Store';
    case 'mac-store':
      return 'Mac App Store';
    default:
      return 'Unknown';
  }
}
