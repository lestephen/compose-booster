// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Response Version Manager
// Manages multiple response versions for regenerate feature

import { ResponseVersion } from '../../../shared/types';

export class ResponseVersionManager {
  private versions: ResponseVersion[] = [];
  private currentIndex = -1;
  private maxVersions = 10;

  // Temperature settings for regeneration
  private baseTemperature = 0.7;
  private temperatureIncrement = 0.2;
  private maxTemperature = 1.5;

  /**
   * Add a new response version
   */
  addVersion(
    content: string,
    model: string,
    prompt: string,
    tone: string,
    temperature: number,
    cost?: number
  ): ResponseVersion {
    const version: ResponseVersion = {
      id: this.generateId(),
      content,
      model,
      prompt,
      tone,
      temperature,
      timestamp: Date.now(),
      cost,
    };

    this.versions.push(version);
    this.currentIndex = this.versions.length - 1;

    // Trim old versions if exceeding max
    if (this.versions.length > this.maxVersions) {
      this.versions.shift();
      this.currentIndex--;
    }

    return version;
  }

  /**
   * Get the current response version
   */
  getCurrentVersion(): ResponseVersion | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.versions.length) {
      return null;
    }
    return this.versions[this.currentIndex];
  }

  /**
   * Navigate to previous version
   */
  previousVersion(): ResponseVersion | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.versions[this.currentIndex];
    }
    return null;
  }

  /**
   * Navigate to next version
   */
  nextVersion(): ResponseVersion | null {
    if (this.currentIndex < this.versions.length - 1) {
      this.currentIndex++;
      return this.versions[this.currentIndex];
    }
    return null;
  }

  /**
   * Check if we can navigate to previous version
   */
  hasPrevious(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if we can navigate to next version
   */
  hasNext(): boolean {
    return this.currentIndex < this.versions.length - 1;
  }

  /**
   * Get the current version number (1-indexed for display)
   */
  getCurrentVersionNumber(): number {
    return this.currentIndex + 1;
  }

  /**
   * Get total number of versions
   */
  getTotalVersions(): number {
    return this.versions.length;
  }

  /**
   * Check if there are any versions
   */
  hasVersions(): boolean {
    return this.versions.length > 0;
  }

  /**
   * Get the temperature for the next regeneration
   * Increases temperature each time for more variety
   */
  getNextRegenerateTemperature(): number {
    const currentVersion = this.getCurrentVersion();
    if (!currentVersion) {
      return this.baseTemperature;
    }

    // Increase temperature for regeneration
    const nextTemp = currentVersion.temperature + this.temperatureIncrement;
    return Math.min(nextTemp, this.maxTemperature);
  }

  /**
   * Get the initial temperature for first processing
   */
  getInitialTemperature(): number {
    return this.baseTemperature;
  }

  /**
   * Clear all versions (e.g., when input changes)
   */
  clear(): void {
    this.versions = [];
    this.currentIndex = -1;
  }

  /**
   * Generate a unique ID for a version
   */
  private generateId(): string {
    return `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
