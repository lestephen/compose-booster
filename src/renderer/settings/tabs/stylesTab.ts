// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Styles Tab
// Manage writing style profiles - create, edit, delete

import { AppConfig, StyleProfile } from '../../../shared/types';
import { DEFAULT_CONFIG } from '../../../main/config/defaultConfig';

export class StylesTab {
  private container: HTMLElement;
  private config: AppConfig;
  private onConfigChange: (config: AppConfig) => void;
  private modalElement: HTMLElement | null = null;
  private editingIndex = -1;

  constructor(container: HTMLElement, config: AppConfig, onConfigChange: (config: AppConfig) => void) {
    this.container = container;
    this.config = config;
    this.onConfigChange = onConfigChange;
    this.render();
    this.createModal();
  }

  public updateConfig(config: AppConfig): void {
    this.config = config;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <button id="addStyleBtn" class="btn btn-primary add-item-btn">+ Add New Style</button>
      <button id="resetStylesBtn" class="btn btn-secondary add-item-btn" style="margin-left: 8px;">Reset to Defaults</button>
      <div id="stylesList" class="item-list"></div>
    `;

    this.populateStylesList();
    this.setupEventListeners();
  }

  private populateStylesList(): void {
    const listContainer = document.getElementById('stylesList');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    this.config.styles.forEach((style, index) => {
      const isDefault = this.isDefaultStyle(style.id);
      const card = document.createElement('div');
      card.className = 'item-card draggable-card';
      card.setAttribute('draggable', 'true');
      card.setAttribute('data-index', index.toString());

      const samplesCount = style.samples?.length || 0;
      const samplesText = samplesCount > 0 ? `${samplesCount} sample email${samplesCount > 1 ? 's' : ''}` : 'No sample emails';

      card.innerHTML = `
        <div class="drag-handle-card" title="Drag to reorder">
          <span>⋮⋮</span>
        </div>
        <div class="item-card-content">
          <div class="item-card-header">
            <div class="item-card-title">
              ${this.escapeHtml(style.name)}
              ${isDefault ? '<span class="lock-icon">🔒</span>' : ''}
            </div>
            <div class="item-card-actions">
              <button class="btn btn-small btn-secondary" data-edit-index="${index}">Edit</button>
              <button class="btn btn-small btn-secondary" data-duplicate-index="${index}">Duplicate</button>
              ${!isDefault ? `<button class="btn btn-small btn-danger" data-delete-index="${index}">Delete</button>` : ''}
            </div>
          </div>
          <div class="item-card-preview">${this.escapeHtml(style.description || 'No description')}</div>
          <div class="item-card-meta">${samplesText}</div>
        </div>
      `;

      listContainer.appendChild(card);
    });

    // Setup button listeners
    this.setupCardEventListeners();

    // Setup drag-and-drop
    this.setupDragAndDrop();
  }

  private setupEventListeners(): void {
    const addBtn = document.getElementById('addStyleBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openModal());
    }

    const resetBtn = document.getElementById('resetStylesBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.handleResetStyles());
    }
  }

  private setupCardEventListeners(): void {
    // Edit buttons
    const editButtons = this.container.querySelectorAll<HTMLButtonElement>('[data-edit-index]');
    editButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-edit-index') || '0', 10);
        this.openModal(index);
      });
    });

    // Duplicate buttons
    const duplicateButtons = this.container.querySelectorAll<HTMLButtonElement>('[data-duplicate-index]');
    duplicateButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-duplicate-index') || '0', 10);
        this.handleDuplicate(index);
      });
    });

    // Delete buttons
    const deleteButtons = this.container.querySelectorAll<HTMLButtonElement>('[data-delete-index]');
    deleteButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-delete-index') || '0', 10);
        this.handleDelete(index);
      });
    });
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
            // Reorder the styles array
            const movedStyle = this.config.styles[draggedIndex];
            this.config.styles.splice(draggedIndex, 1);
            this.config.styles.splice(targetIndex, 0, movedStyle);

            this.onConfigChange(this.config);
            this.render();
          }
        }
      });
    });
  }

  private createModal(): void {
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'modal';
    this.modalElement.innerHTML = `
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2 id="modalTitle">Add Style Profile</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="styleName">Style Name</label>
            <input type="text" id="styleName" class="form-control" placeholder="e.g., My Professional Style">
          </div>
          <div class="form-group">
            <label for="styleDescription">Description (Optional)</label>
            <textarea id="styleDescription" class="form-control-textarea" placeholder="Optionally describe your writing style..."></textarea>
            <small class="form-text">A brief description of your preferred style (e.g., "Direct, professional, avoids jargon").</small>
          </div>
          <div class="form-group">
            <label>Sample Emails</label>
            <small class="form-text" style="margin-bottom: 8px; display: block;">Paste 2-3 emails you've written that demonstrate your preferred style. The AI will learn from these examples.</small>
            <div id="samplesContainer"></div>
            <button id="addSampleBtn" class="btn btn-secondary btn-small" style="margin-top: 8px;">+ Add Sample Email</button>
          </div>
        </div>
        <div class="modal-footer">
          <button id="modalCancelBtn" class="btn btn-secondary">Cancel</button>
          <button id="modalSaveBtn" class="btn btn-primary">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalElement);

    // Setup modal event listeners
    const closeBtn = this.modalElement.querySelector('.modal-close');
    closeBtn?.addEventListener('click', () => this.closeModal());

    const cancelBtn = this.modalElement.querySelector('#modalCancelBtn');
    cancelBtn?.addEventListener('click', () => this.closeModal());

    const saveBtn = this.modalElement.querySelector('#modalSaveBtn');
    saveBtn?.addEventListener('click', () => this.handleModalSave());

    const addSampleBtn = this.modalElement.querySelector('#addSampleBtn');
    addSampleBtn?.addEventListener('click', () => this.addSampleRow());

    // Close on background click
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.closeModal();
      }
    });
  }

  private addSampleRow(sample?: string): void {
    const container = this.modalElement?.querySelector('#samplesContainer');
    if (!container) return;

    const sampleIndex = container.querySelectorAll('.sample-row').length + 1;

    const row = document.createElement('div');
    row.className = 'sample-row';
    row.innerHTML = `
      <div class="sample-header">
        <label>Sample Email ${sampleIndex}</label>
        <button class="btn btn-small btn-danger remove-sample-btn">Remove</button>
      </div>
      <textarea class="form-control-textarea sample-content" placeholder="Paste an email you've written that demonstrates your preferred writing style...">${this.escapeHtml(sample || '')}</textarea>
    `;

    const removeBtn = row.querySelector('.remove-sample-btn');
    removeBtn?.addEventListener('click', () => {
      row.remove();
      this.renumberSamples();
    });

    container.appendChild(row);
  }

  private renumberSamples(): void {
    const container = this.modalElement?.querySelector('#samplesContainer');
    if (!container) return;

    const rows = container.querySelectorAll('.sample-row');
    rows.forEach((row, index) => {
      const label = row.querySelector('label');
      if (label) {
        label.textContent = `Sample Email ${index + 1}`;
      }
    });
  }

  private openModal(editIndex = -1): void {
    if (!this.modalElement) return;

    this.editingIndex = editIndex;

    const title = this.modalElement.querySelector('#modalTitle');
    const nameInput = this.modalElement.querySelector('#styleName') as HTMLInputElement;
    const descriptionInput = this.modalElement.querySelector('#styleDescription') as HTMLTextAreaElement;
    const samplesContainer = this.modalElement.querySelector('#samplesContainer');

    // Clear samples
    if (samplesContainer) {
      samplesContainer.innerHTML = '';
    }

    if (editIndex >= 0) {
      const style = this.config.styles[editIndex];
      if (title) title.textContent = 'Edit Style Profile';
      if (nameInput) nameInput.value = style.name;
      if (descriptionInput) descriptionInput.value = style.description || '';

      // Add existing samples
      if (style.samples) {
        style.samples.forEach(sample => this.addSampleRow(sample));
      }
    } else {
      if (title) title.textContent = 'Add Style Profile';
      if (nameInput) nameInput.value = '';
      if (descriptionInput) descriptionInput.value = '';
    }

    this.modalElement.classList.add('active');
  }

  private closeModal(): void {
    if (!this.modalElement) return;
    this.modalElement.classList.remove('active');
    this.editingIndex = -1;
  }

  private handleModalSave(): void {
    if (!this.modalElement) return;

    const nameInput = this.modalElement.querySelector('#styleName') as HTMLInputElement;
    const descriptionInput = this.modalElement.querySelector('#styleDescription') as HTMLTextAreaElement;

    const name = nameInput?.value.trim();
    const description = descriptionInput?.value.trim();

    if (!name) {
      alert('Please enter a style name.');
      return;
    }

    // Collect samples
    const samples: string[] = [];
    const sampleRows = this.modalElement.querySelectorAll('.sample-row');
    sampleRows.forEach(row => {
      const content = (row.querySelector('.sample-content') as HTMLTextAreaElement)?.value.trim();
      if (content) {
        samples.push(content);
      }
    });

    if (this.editingIndex >= 0) {
      // Edit existing
      this.config.styles[this.editingIndex].name = name;
      this.config.styles[this.editingIndex].description = description || '';
      this.config.styles[this.editingIndex].samples = samples.length > 0 ? samples : undefined;
    } else {
      // Add new
      const newStyle: StyleProfile = {
        id: `custom-${Date.now()}`,
        name,
        description: description || '',
        samples: samples.length > 0 ? samples : undefined,
      };
      this.config.styles.push(newStyle);
    }

    this.onConfigChange(this.config);
    this.closeModal();
    this.render();
  }

  private handleDuplicate(index: number): void {
    const style = this.config.styles[index];
    const newStyle: StyleProfile = {
      id: `custom-${Date.now()}`,
      name: `${style.name} (Copy)`,
      description: style.description,
      samples: style.samples ? [...style.samples] : undefined,
    };

    this.config.styles.push(newStyle);
    this.onConfigChange(this.config);
    this.render();
  }

  private handleDelete(index: number): void {
    const style = this.config.styles[index];

    if (this.isDefaultStyle(style.id)) {
      alert('Cannot delete default styles.');
      return;
    }

    if (confirm(`Are you sure you want to delete "${style.name}"?`)) {
      this.config.styles.splice(index, 1);
      this.onConfigChange(this.config);
      this.render();
    }
  }

  private handleResetStyles(): void {
    if (confirm('This will reset all styles to defaults and remove custom styles. Continue?')) {
      this.config.styles = JSON.parse(JSON.stringify(DEFAULT_CONFIG.styles));
      this.onConfigChange(this.config);
      this.render();
    }
  }

  private isDefaultStyle(styleId: string): boolean {
    return DEFAULT_CONFIG.styles.some(s => s.id === styleId);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
