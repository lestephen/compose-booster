// Models Tab
// Manage AI models - enable/disable, add custom models

import { AppConfig, Model } from '../../../shared/types';
import { DEFAULT_CONFIG } from '../../../main/config/defaultConfig';

export class ModelsTab {
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
    this.container.innerHTML = `
      <div class="models-table-wrapper">
        <table class="models-table">
          <thead>
            <tr>
              <th>Model Name</th>
              <th>Model ID</th>
              <th>Cost</th>
              <th style="width: 150px;">Status</th>
              <th style="width: 100px;">Actions</th>
            </tr>
          </thead>
          <tbody id="modelsTableBody">
          </tbody>
        </table>
      </div>

      <div class="add-model-section">
        <h3>Add Custom Model</h3>
        <div class="form-group">
          <label for="newModelName">Model Name</label>
          <input type="text" id="newModelName" class="form-control" placeholder="e.g., Custom GPT-4">
        </div>
        <div class="form-group">
          <label for="newModelId">Model ID</label>
          <input type="text" id="newModelId" class="form-control" placeholder="e.g., openai/gpt-4">
          <small class="form-text">Find model IDs at <a href="https://openrouter.ai/models" target="_blank">OpenRouter Models</a></small>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="newModelCost">Cost Estimate</label>
            <input type="text" id="newModelCost" class="form-control" placeholder="e.g., $0.03/1K tokens">
          </div>
          <div class="form-group">
            <label for="newModelDescription">Description (optional)</label>
            <input type="text" id="newModelDescription" class="form-control" placeholder="Best for...">
          </div>
        </div>
        <button id="addModelBtn" class="btn btn-primary">Add Model</button>
        <button id="resetModelsBtn" class="btn btn-secondary" style="margin-left: 8px;">Reset to Defaults</button>
      </div>
    `;

    this.populateModelsTable();
    this.setupEventListeners();
  }

  private populateModelsTable(): void {
    const tbody = document.getElementById('modelsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    this.config.models.forEach((model, index) => {
      const isDefault = this.isDefaultModel(model.id);
      const row = document.createElement('tr');

      row.innerHTML = `
        <td>
          <div class="model-name">${this.escapeHtml(model.name)}</div>
          ${isDefault ? '<span class="model-default-badge">Default</span>' : ''}
        </td>
        <td><code class="model-id">${this.escapeHtml(model.id)}</code></td>
        <td><span class="model-cost">${this.escapeHtml(model.cost || 'N/A')}</span></td>
        <td>
          <label class="toggle-switch">
            <input type="checkbox" ${model.enabled ? 'checked' : ''} data-model-index="${index}">
            <span class="toggle-slider"></span>
          </label>
        </td>
        <td>
          ${!isDefault ? `<button class="btn btn-small btn-danger" data-delete-index="${index}">Delete</button>` : ''}
        </td>
      `;

      tbody.appendChild(row);
    });
  }

  private setupEventListeners(): void {
    // Toggle switches
    const toggles = this.container.querySelectorAll<HTMLInputElement>('.toggle-switch input[type="checkbox"]');
    toggles.forEach((toggle) => {
      toggle.addEventListener('change', (e) => {
        const index = parseInt(toggle.getAttribute('data-model-index') || '0', 10);
        this.handleToggleModel(index, toggle.checked);
      });
    });

    // Delete buttons
    const deleteButtons = this.container.querySelectorAll<HTMLButtonElement>('[data-delete-index]');
    deleteButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-delete-index') || '0', 10);
        this.handleDeleteModel(index);
      });
    });

    // Add model button
    const addBtn = document.getElementById('addModelBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.handleAddModel());
    }

    // Reset button
    const resetBtn = document.getElementById('resetModelsBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.handleResetModels());
    }
  }

  private handleToggleModel(index: number, enabled: boolean): void {
    if (index >= 0 && index < this.config.models.length) {
      this.config.models[index].enabled = enabled;
      this.onConfigChange(this.config);
    }
  }

  private handleDeleteModel(index: number): void {
    const model = this.config.models[index];

    if (this.isDefaultModel(model.id)) {
      alert('Cannot delete default models. You can disable them instead.');
      return;
    }

    if (confirm(`Are you sure you want to delete "${model.name}"?`)) {
      this.config.models.splice(index, 1);
      this.onConfigChange(this.config);
      this.render();
    }
  }

  private handleAddModel(): void {
    const nameInput = document.getElementById('newModelName') as HTMLInputElement;
    const idInput = document.getElementById('newModelId') as HTMLInputElement;
    const costInput = document.getElementById('newModelCost') as HTMLInputElement;
    const descInput = document.getElementById('newModelDescription') as HTMLInputElement;

    const name = nameInput?.value.trim();
    const id = idInput?.value.trim();
    const cost = costInput?.value.trim();
    const description = descInput?.value.trim();

    if (!name || !id) {
      alert('Please enter both model name and ID.');
      return;
    }

    // Check if model ID already exists
    if (this.config.models.some(m => m.id === id)) {
      alert('A model with this ID already exists.');
      return;
    }

    const newModel: Model = {
      id,
      name,
      cost: cost || undefined,
      description: description || undefined,
      enabled: true,
    };

    this.config.models.push(newModel);
    this.onConfigChange(this.config);

    // Clear form
    if (nameInput) nameInput.value = '';
    if (idInput) idInput.value = '';
    if (costInput) costInput.value = '';
    if (descInput) descInput.value = '';

    this.render();
  }

  private handleResetModels(): void {
    if (confirm('This will reset all models to defaults and remove custom models. Continue?')) {
      this.config.models = JSON.parse(JSON.stringify(DEFAULT_CONFIG.models));
      this.onConfigChange(this.config);
      this.render();
    }
  }

  private isDefaultModel(modelId: string): boolean {
    return DEFAULT_CONFIG.models.some(m => m.id === modelId);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
