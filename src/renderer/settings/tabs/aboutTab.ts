// About Tab
// Application information and credits

import { APP_NAME } from '../../../shared/constants';

export class AboutTab {
  private container: HTMLElement;
  private version: string = 'Loading...';

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.loadVersion();
  }

  private async loadVersion(): Promise<void> {
    try {
      const result = await window.electronAPI.getAppVersion();
      if (result.success && result.data) {
        this.version = result.data;
        this.updateVersionDisplay();
      }
    } catch (error) {
      console.error('Failed to get app version:', error);
      this.version = 'Unknown';
      this.updateVersionDisplay();
    }
  }

  private updateVersionDisplay(): void {
    const versionElement = this.container.querySelector('#app-version');
    if (versionElement) {
      versionElement.textContent = `Version: ${this.version}`;
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <section class="settings-section">
        <h2>About ${APP_NAME}</h2>

        <div class="form-group">
          <p><strong>${APP_NAME}</strong></p>
          <p id="app-version">Version: ${this.version}</p>
          <p>An AI-powered email composition assistant</p>
        </div>

        <div class="form-group">
          <p><small class="form-text">Powered by OpenRouter API with access to multiple AI models from Anthropic, OpenAI, Google, Meta, and Mistral.</small></p>
        </div>

        <div class="form-group">
          <p><small class="form-text">Built with Electron, TypeScript, and Vite.</small></p>
        </div>
      </section>
    `;
  }
}
