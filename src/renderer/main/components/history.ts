// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// History Manager
// Manages undo/redo history for input text

export class HistoryManager {
  private history: string[] = [];
  private maxHistorySize = 10;

  /**
   * Add current text to history
   */
  push(text: string): void {
    // Don't add if it's the same as the last entry
    if (this.history.length > 0 && this.history[this.history.length - 1] === text) {
      return;
    }

    this.history.push(text);

    // Keep history size limited
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Get previous text from history
   * Returns undefined if no history available
   */
  pop(): string | undefined {
    // Keep at least one item in history (current state)
    if (this.history.length <= 1) {
      return undefined;
    }

    // Remove current state
    this.history.pop();

    // Return previous state
    return this.history[this.history.length - 1];
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = [];
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.history.length > 1;
  }

  /**
   * Get current history size
   */
  size(): number {
    return this.history.length;
  }
}
