// Theme Manager
// Handles dark/light/system theme switching

export class ThemeManager {
  private currentTheme: 'light' | 'dark' | 'system' = 'light';
  private systemMediaQuery: MediaQueryList;

  constructor() {
    this.systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.init();
  }

  private async init(): Promise<void> {
    // Load saved theme and font size preferences
    const result = await window.electronAPI.getConfig();
    if (result.success && result.data) {
      this.currentTheme = result.data.preferences.theme;
      this.applyTheme(this.currentTheme);
      this.applyFontSize(result.data.preferences.fontSize);
    }

    // Listen for system theme changes
    this.systemMediaQuery.addEventListener('change', (e) => {
      if (this.currentTheme === 'system') {
        this.applySystemTheme();
      }
    });
  }

  private applyFontSize(size: number): void {
    document.documentElement.style.setProperty('--font-size-base', `${size}px`);
  }

  public setTheme(theme: 'light' | 'dark' | 'system'): void {
    this.currentTheme = theme;
    this.applyTheme(theme);
  }

  private applyTheme(theme: 'light' | 'dark' | 'system'): void {
    if (theme === 'system') {
      this.applySystemTheme();
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  private applySystemTheme(): void {
    const prefersDark = this.systemMediaQuery.matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }

  public getCurrentTheme(): 'light' | 'dark' | 'system' {
    return this.currentTheme;
  }

  public getEffectiveTheme(): 'light' | 'dark' {
    if (this.currentTheme === 'system') {
      return this.systemMediaQuery.matches ? 'dark' : 'light';
    }
    return this.currentTheme;
  }
}
