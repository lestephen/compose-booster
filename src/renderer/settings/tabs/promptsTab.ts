// Prompts Tab
// Manage prompt templates - create, edit, delete

import { AppConfig, Prompt } from '../../../shared/types';
import { DEFAULT_CONFIG } from '../../../main/config/defaultConfig';

export class PromptsTab {
  private container: HTMLElement;
  private config: AppConfig;
  private onConfigChange: (config: AppConfig) => void;
  private modalElement: HTMLElement | null = null;
  private editingPromptId: string = '';

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

    // Convert prompts object to array of [key, value] pairs
    const promptEntries = Object.entries(this.config.prompts);

    promptEntries.forEach(([promptId, prompt], index) => {
      const isDefault = prompt.isDefault || false;
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
            <button class="btn btn-small btn-secondary" data-edit-id="${promptId}">Edit</button>
            <button class="btn btn-small btn-secondary" data-duplicate-id="${promptId}">Duplicate</button>
            ${!isDefault ? `<button class="btn btn-small btn-danger" data-delete-id="${promptId}">Delete</button>` : ''}
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
    const editButtons = this.container.querySelectorAll<HTMLButtonElement>('[data-edit-id]');
    editButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const promptId = button.getAttribute('data-edit-id') || '';
        this.openModal(promptId);
      });
    });

    // Duplicate buttons
    const duplicateButtons = this.container.querySelectorAll<HTMLButtonElement>('[data-duplicate-id]');
    duplicateButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const promptId = button.getAttribute('data-duplicate-id') || '';
        this.handleDuplicate(promptId);
      });
    });

    // Delete buttons
    const deleteButtons = this.container.querySelectorAll<HTMLButtonElement>('[data-delete-id]');
    deleteButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const promptId = button.getAttribute('data-delete-id') || '';
        this.handleDelete(promptId);
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

  private openModal(editPromptId: string = ''): void {
    if (!this.modalElement) return;

    this.editingPromptId = editPromptId;

    const title = this.modalElement.querySelector('#modalTitle');
    const nameInput = this.modalElement.querySelector('#promptName') as HTMLInputElement;
    const textInput = this.modalElement.querySelector('#promptText') as HTMLTextAreaElement;

    if (editPromptId) {
      const prompt = this.config.prompts[editPromptId];
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
    this.editingPromptId = '';
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

    if (this.editingPromptId) {
      // Edit existing
      this.config.prompts[this.editingPromptId].name = name;
      this.config.prompts[this.editingPromptId].text = text;
    } else {
      // Add new
      const newPromptId = `custom-${Date.now()}`;
      const newPrompt: Prompt = {
        name,
        text,
      };
      this.config.prompts[newPromptId] = newPrompt;
    }

    this.onConfigChange(this.config);
    this.closeModal();
    this.render();
  }

  private handleDuplicate(promptId: string): void {
    const prompt = this.config.prompts[promptId];
    const newPromptId = `custom-${Date.now()}`;
    const newPrompt: Prompt = {
      name: `${prompt.name} (Copy)`,
      text: prompt.text,
    };

    this.config.prompts[newPromptId] = newPrompt;
    this.onConfigChange(this.config);
    this.render();
  }

  private handleDelete(promptId: string): void {
    const prompt = this.config.prompts[promptId];

    if (prompt.isDefault) {
      alert('Cannot delete default prompts.');
      return;
    }

    if (confirm(`Are you sure you want to delete "${prompt.name}"?`)) {
      delete this.config.prompts[promptId];
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
