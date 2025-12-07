// About Tab
// Application information and credits

import { APP_NAME, APP_VERSION } from '../../../shared/constants';

export class AboutTab {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <section class="settings-section">
        <h2>About ${APP_NAME}</h2>

        <div class="form-group">
          <p><strong>${APP_NAME}</strong></p>
          <p>Version: ${APP_VERSION}</p>
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
