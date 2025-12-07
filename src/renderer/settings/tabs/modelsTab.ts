// Models Tab
// Manage AI models - enable/disable, add custom models

import { AppConfig, Model } from '../../../shared/types';
import { DEFAULT_CONFIG } from '../../../main/config/defaultConfig';

export class ModelsTab {
  private container: HTMLElement;
  private config: AppConfig;
  private onConfigChange: (config: AppConfig) => void;
  private availableModels: any[] = [];
  private showDetailedView: boolean = false;

  constructor(container: HTMLElement, config: AppConfig, onConfigChange: (config: AppConfig) => void) {
    this.container = container;
    this.config = config;
    this.onConfigChange = onConfigChange;
    this.render();
    this.loadAvailableModels();
  }

  public updateConfig(config: AppConfig): void {
    this.config = config;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="models-view-controls">
        <label class="checkbox-label">
          <input type="checkbox" id="detailedViewToggle" ${this.showDetailedView ? 'checked' : ''}>
          Show detailed view (model IDs and cost per million tokens)
        </label>
      </div>

      <div class="models-table-wrapper">
        <table class="models-table">
          <thead>
            <tr>
              <th style="width: 50px;"></th>
              <th>Model Name</th>
              ${this.showDetailedView ? '<th>Model ID</th>' : ''}
              ${this.showDetailedView ? '<th>Cost Details</th>' : '<th>Cost</th>'}
              <th style="width: 150px;">Status</th>
              <th style="width: 100px;">Actions</th>
            </tr>
          </thead>
          <tbody id="modelsTableBody">
          </tbody>
        </table>
      </div>

      <div class="add-model-section">
        <h3>Add Model from OpenRouter</h3>
        <div class="form-group">
          <label for="modelSearchInput">Search and Select Model</label>
          <input
            type="text"
            id="modelSearchInput"
            class="form-control"
            list="modelDatalist"
            placeholder="Type to search models..."
            autocomplete="off"
          >
          <datalist id="modelDatalist"></datalist>
          <small class="form-text" id="loadingModelsText">Loading models from OpenRouter...</small>
        </div>
        <button id="addModelBtn" class="btn btn-primary" disabled>Add Model</button>
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

      // Build cost cell content based on view mode
      let costCellContent = '';
      if (this.showDetailedView) {
        // Detailed view: show raw cost per million
        costCellContent = model.costDetails
          ? `<small class="cost-details-detailed">Input: ${this.escapeHtml(model.costDetails.input)}<br>Output: ${this.escapeHtml(model.costDetails.output)}</small>`
          : 'N/A';
      } else {
        // Simple view: show cost tier with color badge
        const costBadgeClass = model.cost === 'Low' ? 'cost-badge-low' : model.cost === 'High' ? 'cost-badge-high' : 'cost-badge-medium';
        costCellContent = `<span class="cost-badge ${costBadgeClass}">${this.escapeHtml(model.cost || 'N/A')}</span>`;
      }

      row.setAttribute('draggable', 'true');
      row.setAttribute('data-index', index.toString());
      row.classList.add('draggable-row');

      row.innerHTML = `
        <td>
          <div class="drag-handle" title="Drag to reorder">
            <span>⋮⋮</span>
          </div>
        </td>
        <td>
          <div class="model-name">${this.escapeHtml(model.name)}</div>
        </td>
        ${this.showDetailedView ? `<td><code class="model-id">${this.escapeHtml(model.id)}</code></td>` : ''}
        <td>${costCellContent}</td>
        <td>
          <label class="toggle-switch">
            <input type="checkbox" ${model.enabled ? 'checked' : ''} data-model-index="${index}">
            <span class="toggle-slider"></span>
          </label>
        </td>
        <td>
          <button
            class="btn btn-small btn-danger"
            data-delete-index="${index}"
            ${isDefault ? 'disabled' : ''}
            ${isDefault ? 'title="Default models cannot be deleted"' : ''}
          >Delete</button>
        </td>
      `;

      tbody.appendChild(row);
    });
  }

  private setupEventListeners(): void {
    // Detailed view toggle
    const detailedViewToggle = document.getElementById('detailedViewToggle') as HTMLInputElement;
    if (detailedViewToggle) {
      detailedViewToggle.addEventListener('change', () => {
        this.showDetailedView = detailedViewToggle.checked;
        this.render();
      });
    }

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

    // Setup drag-and-drop
    this.setupDragAndDrop();

    // Model search input
    const searchInput = document.getElementById('modelSearchInput') as HTMLInputElement;
    const addBtn = document.getElementById('addModelBtn') as HTMLButtonElement;
    if (searchInput && addBtn) {
      searchInput.addEventListener('input', () => {
        // Enable button only if input matches a valid model ID
        const modelExists = this.availableModels.some(m => m.id === searchInput.value || m.name === searchInput.value);
        addBtn.disabled = !modelExists;
      });
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

  private setupDragAndDrop(): void {
    const rows = this.container.querySelectorAll<HTMLTableRowElement>('.draggable-row');
    let draggedRow: HTMLTableRowElement | null = null;
    let draggedIndex: number = -1;

    rows.forEach((row) => {
      row.addEventListener('dragstart', (e) => {
        draggedRow = row;
        draggedIndex = parseInt(row.getAttribute('data-index') || '-1', 10);
        row.classList.add('dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
        }
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('dragging');
        // Remove all drag-over classes
        rows.forEach(r => r.classList.remove('drag-over'));
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'move';
        }

        // Add visual feedback
        const targetRow = e.currentTarget as HTMLTableRowElement;
        if (targetRow !== draggedRow) {
          targetRow.classList.add('drag-over');
        }
      });

      row.addEventListener('dragleave', (e) => {
        const targetRow = e.currentTarget as HTMLTableRowElement;
        targetRow.classList.remove('drag-over');
      });

      row.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetRow = e.currentTarget as HTMLTableRowElement;
        targetRow.classList.remove('drag-over');

        if (draggedRow && targetRow !== draggedRow) {
          const targetIndex = parseInt(targetRow.getAttribute('data-index') || '-1', 10);

          if (draggedIndex !== -1 && targetIndex !== -1) {
            // Reorder the models array
            const movedModel = this.config.models[draggedIndex];
            this.config.models.splice(draggedIndex, 1);
            this.config.models.splice(targetIndex, 0, movedModel);

            this.onConfigChange(this.config);
            this.render();
          }
        }
      });
    });
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
    const searchInput = document.getElementById('modelSearchInput') as HTMLInputElement;
    const inputValue = searchInput?.value;

    if (!inputValue) {
      alert('Please select a model.');
      return;
    }

    // Find the selected model in availableModels (by ID or name)
    const selectedModel = this.availableModels.find(m => m.id === inputValue || m.name === inputValue);
    if (!selectedModel) {
      alert('Model not found. Please select a model from the suggestions.');
      return;
    }

    // Check if model ID already exists
    if (this.config.models.some(m => m.id === selectedModel.id)) {
      alert('This model has already been added.');
      return;
    }

    // Determine cost tier based on pricing
    const inputCost = parseFloat(selectedModel.pricing?.prompt || '0');
    let costTier: 'Low' | 'Medium' | 'High' = 'Medium';
    if (inputCost < 0.000005) {
      costTier = 'Low';
    } else if (inputCost > 0.00001) {
      costTier = 'High';
    }

    const newModel: Model = {
      id: selectedModel.id,
      name: selectedModel.name,
      cost: costTier,
      costDetails: {
        input: `$${(parseFloat(selectedModel.pricing?.prompt || '0') * 1000000).toFixed(2)}/M`,
        output: `$${(parseFloat(selectedModel.pricing?.completion || '0') * 1000000).toFixed(2)}/M`,
      },
      enabled: true,
    };

    this.config.models.push(newModel);
    this.onConfigChange(this.config);

    // Reset input
    if (searchInput) searchInput.value = '';
    const addBtn = document.getElementById('addModelBtn') as HTMLButtonElement;
    if (addBtn) addBtn.disabled = true;

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

  private async loadAvailableModels(): Promise<void> {
    const loadingText = document.getElementById('loadingModelsText');
    const datalist = document.getElementById('modelDatalist') as HTMLDataListElement;

    try {
      const result = await window.electronAPI.getAvailableModels();

      if (result.success && result.data) {
        this.availableModels = result.data;

        // Populate datalist with searchable options
        if (datalist) {
          datalist.innerHTML = '';
          this.availableModels.forEach((model: any) => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = `${model.name} - ${model.id}`;
            datalist.appendChild(option);
          });
        }

        if (loadingText) {
          loadingText.textContent = `${this.availableModels.length} models available - type to search`;
          loadingText.style.color = '';
        }
      } else {
        if (loadingText) {
          loadingText.textContent = 'Failed to load models. Please check your API key.';
          loadingText.style.color = 'var(--error-color)';
        }
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      if (loadingText) {
        loadingText.textContent = 'Error loading models from OpenRouter';
        loadingText.style.color = 'var(--error-color)';
      }
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
