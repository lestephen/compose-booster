// Tones Tab
// Manage tone options - create, edit, delete

import { AppConfig, Tone } from '../../../shared/types';
import { DEFAULT_CONFIG } from '../../../main/config/defaultConfig';

export class TonesTab {
  private container: HTMLElement;
  private config: AppConfig;
  private onConfigChange: (config: AppConfig) => void;
  private modalElement: HTMLElement | null = null;
  private editingIndex: number = -1;

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
      <button id="addToneBtn" class="btn btn-primary add-item-btn">+ Add New Tone</button>
      <button id="resetTonesBtn" class="btn btn-secondary add-item-btn" style="margin-left: 8px;">Reset to Defaults</button>
      <div id="tonesList" class="item-list"></div>
    `;

    this.populateTonesList();
    this.setupEventListeners();
  }

  private populateTonesList(): void {
    const listContainer = document.getElementById('tonesList');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    this.config.tones.forEach((tone, index) => {
      const isDefault = this.isDefaultTone(tone.id);
      const card = document.createElement('div');
      card.className = 'item-card';

      card.innerHTML = `
        <div class="item-card-header">
          <div class="item-card-title">
            ${this.escapeHtml(tone.name)}
            ${isDefault ? '<span class="lock-icon">🔒</span>' : ''}
          </div>
          <div class="item-card-actions">
            <button class="btn btn-small btn-secondary" data-edit-index="${index}">Edit</button>
            <button class="btn btn-small btn-secondary" data-duplicate-index="${index}">Duplicate</button>
            ${!isDefault ? `<button class="btn btn-small btn-danger" data-delete-index="${index}">Delete</button>` : ''}
          </div>
        </div>
        <div class="item-card-preview">${this.escapeHtml(tone.description || 'No description')}</div>
      `;

      listContainer.appendChild(card);
    });

    // Setup button listeners
    this.setupCardEventListeners();
  }

  private setupEventListeners(): void {
    const addBtn = document.getElementById('addToneBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openModal());
    }

    const resetBtn = document.getElementById('resetTonesBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.handleResetTones());
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

  private createModal(): void {
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'modal';
    this.modalElement.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modalTitle">Add Tone</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="toneName">Tone Name</label>
            <input type="text" id="toneName" class="form-control" placeholder="e.g., Enthusiastic">
          </div>
          <div class="form-group">
            <label for="toneDescription">Description</label>
            <textarea id="toneDescription" class="form-control-textarea" placeholder="Describe the tone style..."></textarea>
            <small class="form-text">This description guides the AI on how to adjust the writing style.</small>
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

    // Close on background click
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.closeModal();
      }
    });
  }

  private openModal(editIndex: number = -1): void {
    if (!this.modalElement) return;

    this.editingIndex = editIndex;

    const title = this.modalElement.querySelector('#modalTitle');
    const nameInput = this.modalElement.querySelector('#toneName') as HTMLInputElement;
    const descriptionInput = this.modalElement.querySelector('#toneDescription') as HTMLTextAreaElement;

    if (editIndex >= 0) {
      const tone = this.config.tones[editIndex];
      if (title) title.textContent = 'Edit Tone';
      if (nameInput) nameInput.value = tone.name;
      if (descriptionInput) descriptionInput.value = tone.description || '';
    } else {
      if (title) title.textContent = 'Add Tone';
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

    const nameInput = this.modalElement.querySelector('#toneName') as HTMLInputElement;
    const descriptionInput = this.modalElement.querySelector('#toneDescription') as HTMLTextAreaElement;

    const name = nameInput?.value.trim();
    const description = descriptionInput?.value.trim();

    if (!name) {
      alert('Please enter a tone name.');
      return;
    }

    if (this.editingIndex >= 0) {
      // Edit existing
      this.config.tones[this.editingIndex].name = name;
      this.config.tones[this.editingIndex].description = description || undefined;
    } else {
      // Add new
      const newTone: Tone = {
        id: `custom-${Date.now()}`,
        name,
        description: description || undefined,
      };
      this.config.tones.push(newTone);
    }

    this.onConfigChange(this.config);
    this.closeModal();
    this.render();
  }

  private handleDuplicate(index: number): void {
    const tone = this.config.tones[index];
    const newTone: Tone = {
      id: `custom-${Date.now()}`,
      name: `${tone.name} (Copy)`,
      description: tone.description,
    };

    this.config.tones.push(newTone);
    this.onConfigChange(this.config);
    this.render();
  }

  private handleDelete(index: number): void {
    const tone = this.config.tones[index];

    if (this.isDefaultTone(tone.id)) {
      alert('Cannot delete default tones.');
      return;
    }

    if (confirm(`Are you sure you want to delete "${tone.name}"?`)) {
      this.config.tones.splice(index, 1);
      this.onConfigChange(this.config);
      this.render();
    }
  }

  private handleResetTones(): void {
    if (confirm('This will reset all tones to defaults and remove custom tones. Continue?')) {
      this.config.tones = JSON.parse(JSON.stringify(DEFAULT_CONFIG.tones));
      this.onConfigChange(this.config);
      this.render();
    }
  }

  private isDefaultTone(toneId: string): boolean {
    return DEFAULT_CONFIG.tones.some(t => t.id === toneId);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
