// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Settings Tab Manager
// Handles tab navigation in settings window

export class TabManager {
  private currentTab: string = 'general';
  private tabButtons: NodeListOf<HTMLButtonElement>;
  private tabContents: NodeListOf<HTMLDivElement>;

  constructor() {
    this.tabButtons = document.querySelectorAll('.tab-btn');
    this.tabContents = document.querySelectorAll('.tab-content');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.tabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        if (tabName) {
          this.switchTab(tabName);
        }
      });
    });
  }

  public switchTab(tabName: string): void {
    // Update current tab
    this.currentTab = tabName;

    // Update button active states
    this.tabButtons.forEach((button) => {
      const buttonTab = button.getAttribute('data-tab');
      if (buttonTab === tabName) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });

    // Update content visibility
    this.tabContents.forEach((content) => {
      const contentId = content.getAttribute('id');
      if (contentId === `${tabName}-tab`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }

  public getCurrentTab(): string {
    return this.currentTab;
  }
}
