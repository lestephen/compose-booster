// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Quick Actions Tab
// Configure the 3 quick action hot combo buttons

import { AppConfig, QuickAction } from '../../../shared/types';

export class QuickActionsTab {
  private container: HTMLElement;
  private config: AppConfig;
  private onConfigChange: (config: AppConfig) => void;

  constructor(container: HTMLElement, config: AppConfig, onConfigChange: (config: AppConfig) => void) {
    this.container = container;
    this.config = config;
    this.onConfigChange = onConfigChange;
    this.render();
  }

  public updateConfig(config: AppConfig): void {
    this.config = config;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';

    this.config.quickActions.forEach((combo, index) => {
      const card = this.createComboCard(combo, index);
      this.container.appendChild(card);
    });

    // Setup drag-and-drop
    this.setupDragAndDrop();
  }

  private createComboCard(combo: QuickAction, index: number): HTMLElement {
    const card = document.createElement('div');
    card.className = 'quick-action-config-card draggable-card';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-index', index.toString());

    const shortcut = this.getShortcutDisplay(index);

    card.innerHTML = `
      <div class="drag-handle-card" title="Drag to reorder">
        <span>⋮⋮</span>
      </div>
      <div class="quick-action-card-content">
        <div class="quick-action-header">
          <h3>
            <span>${this.escapeHtml(combo.icon)}</span>
            ${this.escapeHtml(combo.name)}
            <span class="combo-shortcut">${shortcut}</span>
          </h3>
          <div class="quick-action-reorder-buttons">
            <button class="btn-icon-small" data-move-up="${index}" ${index === 0 ? 'disabled' : ''} title="Move up">▲</button>
            <button class="btn-icon-small" data-move-down="${index}" ${index === this.config.quickActions.length - 1 ? 'disabled' : ''} title="Move down">▼</button>
          </div>
        </div>

      <div class="form-group">
        <label for="comboName${index}">Button Name</label>
        <input
          type="text"
          id="comboName${index}"
          class="form-control"
          value="${this.escapeHtml(combo.name)}"
          data-combo-index="${index}"
          data-field="name"
        >
      </div>

      <div class="form-group">
        <label for="comboIcon${index}">Icon (emoji)</label>
        <input
          type="text"
          id="comboIcon${index}"
          class="form-control"
          value="${this.escapeHtml(combo.icon)}"
          data-combo-index="${index}"
          data-field="icon"
          maxlength="2"
        >
        <small class="form-text">Single emoji character (e.g., ⚡, 🎯, ✨)</small>
      </div>

      <div class="form-group">
        <label for="comboModel${index}">AI Model</label>
        <select
          id="comboModel${index}"
          class="form-control"
          data-combo-index="${index}"
          data-field="model"
        >
          ${this.getModelOptions(combo.model)}
        </select>
      </div>

      <div class="form-group">
        <label for="comboPrompt${index}">Prompt Template</label>
        <select
          id="comboPrompt${index}"
          class="form-control"
          data-combo-index="${index}"
          data-field="prompt"
        >
          ${this.getPromptOptions(combo.prompt)}
        </select>
      </div>

      <div class="form-group">
        <label for="comboTone${index}">Tone</label>
        <select
          id="comboTone${index}"
          class="form-control"
          data-combo-index="${index}"
          data-field="tone"
        >
          <option value="">None</option>
          ${this.getToneOptions(combo.tone)}
        </select>
      </div>
      </div>
    `;

    // Setup event listeners
    this.setupCardEventListeners(card, index);

    return card;
  }

  private setupCardEventListeners(card: HTMLElement, index: number): void {
    const inputs = card.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-combo-index]');
    inputs.forEach((input) => {
      input.addEventListener('change', () => {
        const field = input.getAttribute('data-field') as keyof QuickAction;
        const value = input.value;

        if (field && index >= 0 && index < this.config.quickActions.length) {
          // Update config
          (this.config.quickActions[index] as any)[field] = value || undefined;
          this.onConfigChange(this.config);

          // Re-render to update the header
          this.render();
        }
      });
    });

    // Move up button
    const moveUpBtn = card.querySelector<HTMLButtonElement>('[data-move-up]');
    if (moveUpBtn) {
      moveUpBtn.addEventListener('click', () => {
        this.handleMoveQuickAction(index, -1);
      });
    }

    // Move down button
    const moveDownBtn = card.querySelector<HTMLButtonElement>('[data-move-down]');
    if (moveDownBtn) {
      moveDownBtn.addEventListener('click', () => {
        this.handleMoveQuickAction(index, 1);
      });
    }
  }

  private getModelOptions(selectedModel: string): string {
    return this.config.models
      .filter(m => m.enabled)
      .map(model => {
        const selected = model.id === selectedModel ? 'selected' : '';
        return `<option value="${this.escapeHtml(model.id)}" ${selected}>${this.escapeHtml(model.name)}</option>`;
      })
      .join('');
  }

  private getPromptOptions(selectedPrompt: string): string {
    return Object.values(this.config.prompts)
      .map(prompt => {
        const selected = prompt.name === selectedPrompt ? 'selected' : '';
        return `<option value="${this.escapeHtml(prompt.name)}" ${selected}>${this.escapeHtml(prompt.name)}</option>`;
      })
      .join('');
  }

  private getToneOptions(selectedTone: string | undefined): string {
    return this.config.tones
      .map(tone => {
        const selected = tone.id === selectedTone ? 'selected' : '';
        return `<option value="${this.escapeHtml(tone.id)}" ${selected}>${this.escapeHtml(tone.name)}</option>`;
      })
      .join('');
  }

  private getShortcutDisplay(index: number): string {
    const isMac = navigator.platform.includes('Mac');
    const modifier = isMac ? 'Cmd' : 'Ctrl';
    return `${modifier}+${index + 1}`;
  }

  private handleMoveQuickAction(index: number, direction: number): void {
    const newIndex = index + direction;

    // Validate bounds
    if (newIndex < 0 || newIndex >= this.config.quickActions.length) {
      return;
    }

    // Swap quick actions
    const temp = this.config.quickActions[index];
    this.config.quickActions[index] = this.config.quickActions[newIndex];
    this.config.quickActions[newIndex] = temp;

    this.onConfigChange(this.config);
    this.render();
  }

  private setupDragAndDrop(): void {
    const cards = this.container.querySelectorAll<HTMLElement>('.draggable-card');
    let draggedCard: HTMLElement | null = null;
    let draggedIndex = -1;

    cards.forEach((card) => {
      card.addEventListener('dragstart', (e) => {
        draggedCard = card;
        draggedIndex = parseInt(card.getAttribute('data-index') || '-1', 10);
        card.classList.add('dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
        }
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        // Remove all drag-over classes
        cards.forEach(c => c.classList.remove('drag-over'));
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'move';
        }

        // Add visual feedback
        const targetCard = e.currentTarget as HTMLElement;
        if (targetCard !== draggedCard) {
          targetCard.classList.add('drag-over');
        }
      });

      card.addEventListener('dragleave', (e) => {
        const targetCard = e.currentTarget as HTMLElement;
        targetCard.classList.remove('drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetCard = e.currentTarget as HTMLElement;
        targetCard.classList.remove('drag-over');

        if (draggedCard && targetCard !== draggedCard) {
          const targetIndex = parseInt(targetCard.getAttribute('data-index') || '-1', 10);

          if (draggedIndex !== -1 && targetIndex !== -1) {
            // Reorder the quick actions array
            const movedAction = this.config.quickActions[draggedIndex];
            this.config.quickActions.splice(draggedIndex, 1);
            this.config.quickActions.splice(targetIndex, 0, movedAction);

            this.onConfigChange(this.config);
            this.render();
          }
        }
      });
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
