// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Models Tab
// Manage AI models - enable/disable, add custom models

import { AppConfig, Model, ProviderId } from '../../../shared/types';
import { DEFAULT_CONFIG } from '../../../main/config/defaultConfig';

// Provider display names
const PROVIDER_NAMES: Record<ProviderId, string> = {
  'openrouter': 'OpenRouter',
  'anthropic': 'Anthropic',
  'openai': 'OpenAI',
  'ollama': 'Ollama',
  'openai-compatible': 'OpenAI-Compatible',
};

export class ModelsTab {
  private container: HTMLElement;
  private config: AppConfig;
  private onConfigChange: (config: AppConfig) => void;
  private availableModels: any[] = [];
  private showDetailedView = false;
  private dropdownVisible = false;
  private selectedDropdownIndex = -1;
  private filteredModels: any[] = [];
  private providerFilter: ProviderId | 'all' = 'all';
  private addModelProvider: ProviderId = 'openrouter';
  private isLoadingModels = false;

  constructor(container: HTMLElement, config: AppConfig, onConfigChange: (config: AppConfig) => void) {
    this.container = container;
    this.config = config;
    this.onConfigChange = onConfigChange;
    // Set default provider to first enabled provider
    this.addModelProvider = this.getFirstEnabledProvider();
    this.render();
    this.reloadModels();
  }

  public updateConfig(config: AppConfig): void {
    this.config = config;
    this.render();
  }

  private render(): void {
    // Get unique providers from configured models
    const enabledProviders = this.getEnabledProviders();

    this.container.innerHTML = `
      <div class="models-view-controls">
        <div class="models-filter-row">
          <div class="provider-filter-group">
            <label for="providerFilter">Provider:</label>
            <select id="providerFilter" class="form-control form-control-inline">
              <option value="all" ${this.providerFilter === 'all' ? 'selected' : ''}>All Providers</option>
              ${enabledProviders.map(p => `
                <option value="${p}" ${this.providerFilter === p ? 'selected' : ''}>${PROVIDER_NAMES[p] || p}</option>
              `).join('')}
            </select>
          </div>
          <label class="checkbox-label">
            <input type="checkbox" id="detailedViewToggle" ${this.showDetailedView ? 'checked' : ''}>
            Show detailed view (model IDs and cost per million tokens)
          </label>
        </div>
      </div>

      <div class="models-table-wrapper">
        <table class="models-table">
          <thead>
            <tr>
              <th style="width: 50px;"></th>
              <th>Model Name</th>
              <th style="width: 100px;">Provider</th>
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
        <h3>Add Model</h3>
        <div class="form-group">
          <label for="addModelProviderSelect">Provider</label>
          <select id="addModelProviderSelect" class="form-control">
            ${this.getAddModelProviderOptions()}
          </select>
        </div>
        <div class="form-group" id="modelSearchGroup">
          <label for="modelSearchInput">Search and Select Model</label>
          <div class="model-search-container">
            <input
              type="text"
              id="modelSearchInput"
              class="form-control"
              placeholder="Type to search models..."
              autocomplete="off"
              ${this.addModelProvider === 'openai-compatible' ? 'style="display: none;"' : ''}
            >
            <div id="modelDropdown" class="model-dropdown hidden"></div>
          </div>
          ${this.addModelProvider === 'openai-compatible' ? `
            <input
              type="text"
              id="customModelIdInput"
              class="form-control"
              placeholder="Enter model ID (e.g., gpt-4, claude-3-opus)"
              autocomplete="off"
            >
            <small class="form-text">Enter the model ID supported by your endpoint.</small>
          ` : `
            <small class="form-text" id="loadingModelsText">${this.getLoadingText()}</small>
          `}
        </div>
        <button id="addModelBtn" class="btn btn-primary" ${this.addModelProvider === 'openai-compatible' ? '' : 'disabled'}>Add Model</button>
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

    if (this.filteredModels.length === 0) {
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

    // Filter models by provider if filter is set
    const modelsToShow = this.providerFilter === 'all'
      ? this.config.models
      : this.config.models.filter(m => (m.provider || 'openrouter') === this.providerFilter);

    modelsToShow.forEach((model) => {
      // Get the original index in the config.models array
      const index = this.config.models.indexOf(model);
      const isDefault = this.isDefaultModel(model.id);
      const provider = (model.provider || 'openrouter') as ProviderId;
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
        const costBadgeClass = this.getCostBadgeClass(model.cost);
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
        <td>
          <span class="provider-badge provider-badge-${provider}">${this.getProviderDisplayName(provider)}</span>
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
    // Provider filter dropdown
    const providerFilter = document.getElementById('providerFilter') as HTMLSelectElement;
    if (providerFilter) {
      providerFilter.addEventListener('change', () => {
        this.providerFilter = providerFilter.value as ProviderId | 'all';
        this.populateModelsTable();
        this.setupDragAndDrop();
        // Re-setup toggle and delete listeners
        this.setupModelRowListeners();
      });
    }

    // Add model provider selector
    const addModelProviderSelect = document.getElementById('addModelProviderSelect') as HTMLSelectElement;
    if (addModelProviderSelect) {
      addModelProviderSelect.addEventListener('change', () => {
        this.addModelProvider = addModelProviderSelect.value as ProviderId;
        this.availableModels = []; // Clear cached models
        this.render(); // Re-render to update UI for provider
        this.reloadModels(); // Load models for new provider
      });
    }

    // Detailed view toggle
    const detailedViewToggle = document.getElementById('detailedViewToggle') as HTMLInputElement;
    if (detailedViewToggle) {
      detailedViewToggle.addEventListener('change', () => {
        this.showDetailedView = detailedViewToggle.checked;
        this.render();
      });
    }

    // Setup toggle and delete listeners
    this.setupModelRowListeners();

    // Setup drag-and-drop
    this.setupDragAndDrop();

    // Add model button - shared for all input types
    const addBtn = document.getElementById('addModelBtn') as HTMLButtonElement;
    if (addBtn) {
      addBtn.addEventListener('click', () => this.handleAddModel());
    }

    // Custom model ID input for OpenAI-compatible provider
    const customModelIdInput = document.getElementById('customModelIdInput') as HTMLInputElement;
    if (customModelIdInput && addBtn) {
      customModelIdInput.addEventListener('input', () => {
        addBtn.disabled = !customModelIdInput.value.trim();
      });
    }

    // Model search input with custom dropdown (for providers with model lists)
    const searchInput = document.getElementById('modelSearchInput') as HTMLInputElement;
    if (searchInput && addBtn) {
      // Update dropdown as user types
      searchInput.addEventListener('input', () => {
        this.updateDropdown(searchInput.value);
        // Enable button only if input matches a valid model ID
        const modelExists = this.availableModels.some(m => m.id === searchInput.value);
        addBtn.disabled = !modelExists;
      });

      // Show dropdown on focus (show all models if empty)
      searchInput.addEventListener('focus', () => {
        if (this.availableModels.length > 0) {
          this.updateDropdown(searchInput.value);
        }
      });

      // Handle keyboard navigation
      searchInput.addEventListener('keydown', (e) => this.handleDropdownKeydown(e));
    }

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => this.handleDocumentClick(e));

    // Reset button
    const resetBtn = document.getElementById('resetModelsBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.handleResetModels());
    }
  }

  /**
   * Setup toggle and delete button listeners for model rows
   * Separated so it can be called when filter changes
   */
  private setupModelRowListeners(): void {
    // Toggle switches
    const toggles = this.container.querySelectorAll<HTMLInputElement>('.toggle-switch input[type="checkbox"]');
    toggles.forEach((toggle) => {
      toggle.addEventListener('change', () => {
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
    // Handle custom model entry for OpenAI-compatible provider
    if (this.addModelProvider === 'openai-compatible') {
      this.handleAddCustomModel();
      return;
    }

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

    // Determine cost tier and details based on provider and pricing info
    const { costTier, costDetails } = this.calculateCostInfo(selectedModel);

    const newModel: Model = {
      id: selectedModel.id,
      name: selectedModel.name,
      provider: this.addModelProvider,
      cost: costTier,
      costDetails: costDetails,
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

  /**
   * Handle adding a custom model for OpenAI-compatible provider
   */
  private handleAddCustomModel(): void {
    const customInput = document.getElementById('customModelIdInput') as HTMLInputElement;
    const modelId = customInput?.value.trim();

    if (!modelId) {
      alert('Please enter a model ID.');
      return;
    }

    // Check if model ID already exists
    if (this.config.models.some(m => m.id === modelId)) {
      alert('This model has already been added.');
      return;
    }

    const newModel: Model = {
      id: modelId,
      name: modelId, // Use ID as name since we don't know the display name
      provider: 'openai-compatible',
      cost: 'N/A',
      costDetails: undefined, // No pricing info for custom endpoints
      enabled: true,
    };

    this.config.models.push(newModel);
    this.onConfigChange(this.config);

    // Reset input
    if (customInput) customInput.value = '';
    const addBtn = document.getElementById('addModelBtn') as HTMLButtonElement;
    if (addBtn) addBtn.disabled = true;

    this.render();
  }

  /**
   * Calculate cost tier and details based on provider and pricing info
   */
  private calculateCostInfo(model: any): { costTier: 'Low' | 'Medium' | 'High' | 'Free' | 'N/A'; costDetails?: { input: string; output: string } } {
    // Ollama is free (local models)
    if (this.addModelProvider === 'ollama') {
      return { costTier: 'Free', costDetails: { input: 'Free', output: 'Free' } };
    }

    // Check if pricing info is available
    const hasPromptPricing = model.pricing?.prompt !== undefined && model.pricing?.prompt !== null;
    const hasCompletionPricing = model.pricing?.completion !== undefined && model.pricing?.completion !== null;

    if (!hasPromptPricing && !hasCompletionPricing) {
      // No pricing info available (common for Anthropic, OpenAI direct APIs)
      // Use static pricing if we know the provider
      const staticPricing = this.getStaticPricing(model.id);
      if (staticPricing) {
        return staticPricing;
      }
      return { costTier: 'N/A', costDetails: undefined };
    }

    // Calculate from available pricing
    const inputCost = parseFloat(model.pricing?.prompt || '0');
    const outputCost = parseFloat(model.pricing?.completion || '0');

    let costTier: 'Low' | 'Medium' | 'High' = 'Medium';
    if (inputCost < 0.000005) {
      costTier = 'Low';
    } else if (inputCost > 0.00001) {
      costTier = 'High';
    }

    return {
      costTier,
      costDetails: {
        input: `$${(inputCost * 1000000).toFixed(2)}/M`,
        output: `$${(outputCost * 1000000).toFixed(2)}/M`,
      },
    };
  }

  /**
   * Get static pricing for known models (when API doesn't provide pricing)
   */
  private getStaticPricing(modelId: string): { costTier: 'Low' | 'Medium' | 'High'; costDetails: { input: string; output: string } } | null {
    // Known Anthropic model pricing (as of Dec 2024)
    const anthropicPricing: Record<string, { input: number; output: number }> = {
      'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
      'claude-3-5-haiku-20241022': { input: 1, output: 5 },
      'claude-3-opus-20240229': { input: 15, output: 75 },
      'claude-3-sonnet-20240229': { input: 3, output: 15 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    };

    // Known OpenAI model pricing (as of Dec 2024)
    const openaiPricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 2.50, output: 10 },
      'gpt-4o-mini': { input: 0.15, output: 0.60 },
      'gpt-4-turbo': { input: 10, output: 30 },
      'gpt-4': { input: 30, output: 60 },
      'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
      'o1-preview': { input: 15, output: 60 },
      'o1-mini': { input: 3, output: 12 },
    };

    const pricing = anthropicPricing[modelId] || openaiPricing[modelId];
    if (!pricing) return null;

    let costTier: 'Low' | 'Medium' | 'High' = 'Medium';
    if (pricing.input < 1) {
      costTier = 'Low';
    } else if (pricing.input > 10) {
      costTier = 'High';
    }

    return {
      costTier,
      costDetails: {
        input: `$${pricing.input.toFixed(2)}/M`,
        output: `$${pricing.output.toFixed(2)}/M`,
      },
    };
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

  /**
   * Public method to reload available models for the selected provider
   * Call this after API key is validated/changed
   */
  public async reloadModels(): Promise<void> {
    const loadingText = document.getElementById('loadingModelsText');

    // Skip loading for openai-compatible (manual entry)
    if (this.addModelProvider === 'openai-compatible') {
      this.availableModels = [];
      return;
    }

    this.isLoadingModels = true;
    if (loadingText) {
      loadingText.textContent = `Loading models from ${PROVIDER_NAMES[this.addModelProvider]}...`;
      loadingText.style.color = '';
    }

    try {
      // Get provider config
      const providerConfig = this.config.providers?.find(p => p.id === this.addModelProvider);

      if (!providerConfig) {
        if (loadingText) {
          loadingText.textContent = 'Provider not configured. Please configure it in the Providers tab.';
          loadingText.style.color = 'var(--error-color)';
        }
        this.isLoadingModels = false;
        return;
      }

      // Use the provider-specific models API
      const result = await window.electronAPI.getProviderModels(this.addModelProvider, providerConfig);

      if (result.success && result.data) {
        // Sort models alphabetically by name
        this.availableModels = this.sortModelsAlphabetically(result.data);

        if (loadingText) {
          if (this.availableModels.length > 0) {
            loadingText.textContent = `${this.availableModels.length} models available - type to search`;
          } else {
            loadingText.textContent = 'No models available. Check provider configuration.';
          }
          loadingText.style.color = '';
        }
      } else {
        if (loadingText) {
          const errorMsg = result.error || 'Failed to load models. Please check your API key.';
          loadingText.textContent = errorMsg;
          loadingText.style.color = 'var(--error-color)';
        }
      }
    } catch (error) {
      if (loadingText) {
        loadingText.textContent = `Error loading models from ${PROVIDER_NAMES[this.addModelProvider]}`;
        loadingText.style.color = 'var(--error-color)';
      }
    } finally {
      this.isLoadingModels = false;
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get list of providers that have enabled models or models configured
   */
  private getEnabledProviders(): ProviderId[] {
    const providers = new Set<ProviderId>();

    // Get providers from configured models
    this.config.models.forEach(model => {
      const provider = model.provider || 'openrouter';
      providers.add(provider);
    });

    // Also include enabled providers from config
    this.config.providers?.forEach(p => {
      if (p.enabled) {
        providers.add(p.id);
      }
    });

    return Array.from(providers);
  }

  /**
   * Get provider display name
   */
  private getProviderDisplayName(providerId: ProviderId): string {
    return PROVIDER_NAMES[providerId] || providerId;
  }

  /**
   * Get CSS class for cost badge based on cost tier
   */
  private getCostBadgeClass(cost: string | undefined): string {
    switch (cost) {
      case 'Low': return 'cost-badge-low';
      case 'Medium': return 'cost-badge-medium';
      case 'High': return 'cost-badge-high';
      case 'Free': return 'cost-badge-free';
      case 'N/A': return 'cost-badge-na';
      default: return 'cost-badge-na';
    }
  }

  /**
   * Get the first enabled provider from config, defaulting to OpenRouter
   */
  private getFirstEnabledProvider(): ProviderId {
    const enabledProvider = this.config.providers?.find(p => p.enabled);
    return enabledProvider?.id || 'openrouter';
  }

  /**
   * Generate options HTML for the add model provider selector
   */
  private getAddModelProviderOptions(): string {
    const enabledProviders = this.config.providers?.filter(p => p.enabled) || [];
    if (enabledProviders.length === 0) {
      // Fallback to OpenRouter if no providers configured
      return `<option value="openrouter" selected>OpenRouter</option>`;
    }
    return enabledProviders.map(p =>
      `<option value="${p.id}" ${p.id === this.addModelProvider ? 'selected' : ''}>${PROVIDER_NAMES[p.id] || p.name}</option>`
    ).join('');
  }

  /**
   * Get loading text based on current state
   */
  private getLoadingText(): string {
    if (this.isLoadingModels) {
      return `Loading models from ${PROVIDER_NAMES[this.addModelProvider]}...`;
    }
    if (this.availableModels.length > 0) {
      return `${this.availableModels.length} models available - type to search`;
    }
    return `Loading models from ${PROVIDER_NAMES[this.addModelProvider]}...`;
  }
}
