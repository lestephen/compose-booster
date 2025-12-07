// Prompts Tab
// Manage prompt templates - create, edit, delete

import { AppConfig, Prompt } from '../../../shared/types';
import { DEFAULT_CONFIG } from '../../../main/config/defaultConfig';

export class PromptsTab {
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
      <button id="addPromptBtn" class="btn btn-primary add-item-btn">+ Add New Prompt</button>
      <button id="resetPromptsBtn" class="btn btn-secondary add-item-btn" style="margin-left: 8px;">Reset to Defaults</button>
      <div id="promptsList" class="item-list"></div>
    `;

    this.populatePromptsList();
    this.setupEventListeners();
  }

  private populatePromptsList(): void {
    const listContainer = document.getElementById('promptsList');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    this.config.prompts.forEach((prompt, index) => {
      const isDefault = this.isDefaultPrompt(prompt.id);
      const card = document.createElement('div');
      card.className = 'item-card';

      const preview = this.getPromptPreview(prompt.text);

      card.innerHTML = `
        <div class="item-card-header">
          <div class="item-card-title">
            ${this.escapeHtml(prompt.name)}
            ${isDefault ? '<span class="lock-icon">🔒</span>' : ''}
          </div>
          <div class="item-card-actions">
            <button class="btn btn-small btn-secondary" data-edit-index="${index}">Edit</button>
            <button class="btn btn-small btn-secondary" data-duplicate-index="${index}">Duplicate</button>
            ${!isDefault ? `<button class="btn btn-small btn-danger" data-delete-index="${index}">Delete</button>` : ''}
          </div>
        </div>
        <div class="item-card-preview">${this.escapeHtml(preview)}</div>
      `;

      listContainer.appendChild(card);
    });

    // Setup button listeners
    this.setupCardEventListeners();
  }

  private setupEventListeners(): void {
    const addBtn = document.getElementById('addPromptBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openModal());
    }

    const resetBtn = document.getElementById('resetPromptsBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.handleResetPrompts());
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
          <h2 id="modalTitle">Add Prompt Template</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="promptName">Prompt Name</label>
            <input type="text" id="promptName" class="form-control" placeholder="e.g., Make Concise">
          </div>
          <div class="form-group">
            <label for="promptText">Prompt Template</label>
            <textarea id="promptText" class="form-control-textarea" placeholder="Enter your prompt template..."></textarea>
            <small class="form-text">
              Available variables: <code>\${content}</code> (required), <code>\${tone}</code>, <code>\${date}</code>
            </small>
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
    const nameInput = this.modalElement.querySelector('#promptName') as HTMLInputElement;
    const textInput = this.modalElement.querySelector('#promptText') as HTMLTextAreaElement;

    if (editIndex >= 0) {
      const prompt = this.config.prompts[editIndex];
      if (title) title.textContent = 'Edit Prompt Template';
      if (nameInput) nameInput.value = prompt.name;
      if (textInput) textInput.value = prompt.text;
    } else {
      if (title) title.textContent = 'Add Prompt Template';
      if (nameInput) nameInput.value = '';
      if (textInput) textInput.value = '';
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

    const nameInput = this.modalElement.querySelector('#promptName') as HTMLInputElement;
    const textInput = this.modalElement.querySelector('#promptText') as HTMLTextAreaElement;

    const name = nameInput?.value.trim();
    const text = textInput?.value.trim();

    if (!name || !text) {
      alert('Please enter both name and prompt template.');
      return;
    }

    // Validate that ${content} is present
    if (!text.includes('${content}')) {
      alert('Prompt template must include ${content} variable.');
      return;
    }

    if (this.editingIndex >= 0) {
      // Edit existing
      this.config.prompts[this.editingIndex].name = name;
      this.config.prompts[this.editingIndex].text = text;
    } else {
      // Add new
      const newPrompt: Prompt = {
        id: `custom-${Date.now()}`,
        name,
        text,
      };
      this.config.prompts.push(newPrompt);
    }

    this.onConfigChange(this.config);
    this.closeModal();
    this.render();
  }

  private handleDuplicate(index: number): void {
    const prompt = this.config.prompts[index];
    const newPrompt: Prompt = {
      id: `custom-${Date.now()}`,
      name: `${prompt.name} (Copy)`,
      text: prompt.text,
    };

    this.config.prompts.push(newPrompt);
    this.onConfigChange(this.config);
    this.render();
  }

  private handleDelete(index: number): void {
    const prompt = this.config.prompts[index];

    if (this.isDefaultPrompt(prompt.id)) {
      alert('Cannot delete default prompts.');
      return;
    }

    if (confirm(`Are you sure you want to delete "${prompt.name}"?`)) {
      this.config.prompts.splice(index, 1);
      this.onConfigChange(this.config);
      this.render();
    }
  }

  private handleResetPrompts(): void {
    if (confirm('This will reset all prompts to defaults and remove custom prompts. Continue?')) {
      this.config.prompts = JSON.parse(JSON.stringify(DEFAULT_CONFIG.prompts));
      this.onConfigChange(this.config);
      this.render();
    }
  }

  private isDefaultPrompt(promptId: string): boolean {
    return DEFAULT_CONFIG.prompts.some(p => p.id === promptId);
  }

  private getPromptPreview(text: string): string {
    if (text.length > 150) {
      return text.substring(0, 150) + '...';
    }
    return text;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
