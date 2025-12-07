// Hot Combos Tab
// Configure the 3 quick action hot combo buttons

import { AppConfig, HotCombo } from '../../../shared/types';

export class HotCombosTab {
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

    this.config.hotCombos.forEach((combo, index) => {
      const card = this.createComboCard(combo, index);
      this.container.appendChild(card);
    });
  }

  private createComboCard(combo: HotCombo, index: number): HTMLElement {
    const card = document.createElement('div');
    card.className = 'hot-combo-config-card';

    const shortcut = this.getShortcutDisplay(index);

    card.innerHTML = `
      <h3>
        <span>${this.escapeHtml(combo.icon)}</span>
        ${this.escapeHtml(combo.name)}
        <span class="combo-shortcut">${shortcut}</span>
      </h3>

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
    `;

    // Setup event listeners
    this.setupCardEventListeners(card, index);

    return card;
  }

  private setupCardEventListeners(card: HTMLElement, index: number): void {
    const inputs = card.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-combo-index]');
    inputs.forEach((input) => {
      input.addEventListener('change', () => {
        const field = input.getAttribute('data-field') as keyof HotCombo;
        const value = input.value;

        if (field && index >= 0 && index < this.config.hotCombos.length) {
          // Update config
          (this.config.hotCombos[index] as any)[field] = value || undefined;
          this.onConfigChange(this.config);

          // Re-render to update the header
          this.render();
        }
      });
    });
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

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
