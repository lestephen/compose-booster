// Text Areas Component
// Manages input and output text areas

export class TextAreaManager {
  private inputElement: HTMLTextAreaElement;
  private outputElement: HTMLTextAreaElement;
  private charCountElement: HTMLSpanElement;

  constructor() {
    this.inputElement = document.getElementById('inputText') as HTMLTextAreaElement;
    this.outputElement = document.getElementById('outputText') as HTMLTextAreaElement;
    this.charCountElement = document.getElementById('charCount') as HTMLSpanElement;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Update character count on input
    this.inputElement.addEventListener('input', () => {
      this.updateCharCount();
    });

    // Initial character count
    this.updateCharCount();
  }

  getInput(): string {
    return this.inputElement.value;
  }

  setInput(text: string): void {
    this.inputElement.value = text;
    this.updateCharCount();
  }

  getOutput(): string {
    return this.outputElement.value;
  }

  setOutput(text: string): void {
    this.outputElement.value = text;
  }

  clearInput(): void {
    this.setInput('');
  }

  clearOutput(): void {
    this.setOutput('');
  }

  private updateCharCount(): void {
    const count = this.inputElement.value.length;
    this.charCountElement.textContent = count.toString();

    // Warning for large inputs
    if (count > 10000) {
      this.charCountElement.style.color = 'var(--color-warning)';
    } else {
      this.charCountElement.style.color = 'var(--text-secondary)';
    }
  }

  focusInput(): void {
    this.inputElement.focus();
  }

  focusOutput(): void {
    this.outputElement.focus();
  }
}
