// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Models Tab
// Manage AI models - enable/disable, add custom models

import { AppConfig, Model } from '../../../shared/types';
import { DEFAULT_CONFIG } from '../../../main/config/defaultConfig';

export class ModelsTab {
  private container: HTMLElement;
  private config: AppConfig;
  private onConfigChange: (config: AppConfig) => void;
  private availableModels: any[] = [];
  private showDetailedView = false;
  private dropdownVisible = false;
  private selectedDropdownIndex = -1;
  private filteredModels: any[] = [];

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
          <div class="model-search-container">
            <input
              type="text"
              id="modelSearchInput"
              class="form-control"
              placeholder="Type to search models..."
              autocomplete="off"
            >
            <div id="modelDropdown" class="model-dropdown hidden"></div>
          </div>
          <small class="form-text" id="loadingModelsText">Loading models from OpenRouter...</small>
        </div>
        <button id="addModelBtn" class="btn btn-primary" disabled>Add Model</button>
        <button id="resetModelsBtn" class="btn btn-secondary" style="margin-left: 8px;">Reset to Defaults</button>
      </div>
    `;

    this.populateModelsTable();
    this.setupEventListeners();
    this.populateDatalistFromCache(); // Repopulate datalist from cached models after render
  }

  /**
   * Update the loading text from cached models (called after render)
   * This ensures the status text persists when the view is re-rendered
   */
  private populateDatalistFromCache(): void {
    const loadingText = document.getElementById('loadingModelsText');

    if (this.availableModels.length > 0 && loadingText) {
      loadingText.textContent = `${this.availableModels.length} models available - type to search`;
    }
  }

  /**
   * Sort models alphabetically by name
   */
  private sortModelsAlphabetically(models: any[]): any[] {
    return [...models].sort((a, b) => {
      const nameA = (a.name || a.id).toLowerCase();
      const nameB = (b.name || b.id).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  /**
   * Filter and update the dropdown based on search input
   */
  private updateDropdown(searchTerm: string): void {
    const dropdown = document.getElementById('modelDropdown');
    if (!dropdown) return;

    // Filter models based on search term
    const term = searchTerm.toLowerCase();
    this.filteredModels = this.sortModelsAlphabetically(
      this.availableModels.filter(m =>
        m.name.toLowerCase().includes(term) ||
        m.id.toLowerCase().includes(term)
      )
    );

    // Reset selection
    this.selectedDropdownIndex = -1;

    if (this.filteredModels.length === 0 || searchTerm.trim() === '') {
      dropdown.classList.add('hidden');
      this.dropdownVisible = false;
      return;
    }

    // Populate dropdown
    dropdown.innerHTML = '';
    this.filteredModels.forEach((model, index) => {
      const item = document.createElement('div');
      item.className = 'model-dropdown-item';
      item.setAttribute('data-index', index.toString());
      item.setAttribute('data-model-id', model.id);
      item.innerHTML = `
        <span class="model-dropdown-name">${this.escapeHtml(model.name)}</span>
        <span class="model-dropdown-id">${this.escapeHtml(model.id)}</span>
      `;
      item.addEventListener('click', () => this.selectModelFromDropdown(model));
      dropdown.appendChild(item);
    });

    dropdown.classList.remove('hidden');
    this.dropdownVisible = true;
  }

  /**
   * Select a model from the dropdown
   */
  private selectModelFromDropdown(model: any): void {
    const searchInput = document.getElementById('modelSearchInput') as HTMLInputElement;
    const addBtn = document.getElementById('addModelBtn') as HTMLButtonElement;
    const dropdown = document.getElementById('modelDropdown');

    if (searchInput) {
      searchInput.value = model.id;
    }
    if (addBtn) {
      addBtn.disabled = false;
    }
    if (dropdown) {
      dropdown.classList.add('hidden');
      this.dropdownVisible = false;
    }
  }

  /**
   * Handle keyboard navigation in dropdown
   */
  private handleDropdownKeydown(e: KeyboardEvent): void {
    if (!this.dropdownVisible || this.filteredModels.length === 0) return;

    const dropdown = document.getElementById('modelDropdown');
    if (!dropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedDropdownIndex = Math.min(
          this.selectedDropdownIndex + 1,
          this.filteredModels.length - 1
        );
        this.updateDropdownSelection();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.selectedDropdownIndex = Math.max(this.selectedDropdownIndex - 1, 0);
        this.updateDropdownSelection();
        break;

      case 'Enter':
        e.preventDefault();
        if (this.selectedDropdownIndex >= 0 && this.selectedDropdownIndex < this.filteredModels.length) {
          this.selectModelFromDropdown(this.filteredModels[this.selectedDropdownIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        dropdown.classList.add('hidden');
        this.dropdownVisible = false;
        break;
    }
  }

  /**
   * Update visual selection in dropdown
   */
  private updateDropdownSelection(): void {
    const dropdown = document.getElementById('modelDropdown');
    if (!dropdown) return;

    const items = dropdown.querySelectorAll('.model-dropdown-item');
    items.forEach((item, index) => {
      if (index === this.selectedDropdownIndex) {
        item.classList.add('selected');
        // Scroll into view if needed
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  /**
   * Hide dropdown when clicking outside
   */
  private handleDocumentClick(e: MouseEvent): void {
    const searchContainer = document.querySelector('.model-search-container');
    if (searchContainer && !searchContainer.contains(e.target as Node)) {
      const dropdown = document.getElementById('modelDropdown');
      if (dropdown) {
        dropdown.classList.add('hidden');
        this.dropdownVisible = false;
      }
    }
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

    // Model search input with custom dropdown
    const searchInput = document.getElementById('modelSearchInput') as HTMLInputElement;
    const addBtn = document.getElementById('addModelBtn') as HTMLButtonElement;
    if (searchInput && addBtn) {
      // Update dropdown as user types
      searchInput.addEventListener('input', () => {
        this.updateDropdown(searchInput.value);
        // Enable button only if input matches a valid model ID
        const modelExists = this.availableModels.some(m => m.id === searchInput.value);
        addBtn.disabled = !modelExists;
      });

      // Show dropdown on focus if there's text
      searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim() && this.availableModels.length > 0) {
          this.updateDropdown(searchInput.value);
        }
      });

      // Handle keyboard navigation
      searchInput.addEventListener('keydown', (e) => this.handleDropdownKeydown(e));

      addBtn.addEventListener('click', () => this.handleAddModel());
    }

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => this.handleDocumentClick(e));

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
    let draggedIndex = -1;

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

    try {
      const result = await window.electronAPI.getAvailableModels();

      if (result.success && result.data) {
        // Sort models alphabetically by name
        this.availableModels = this.sortModelsAlphabetically(result.data);

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
    } catch {
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
