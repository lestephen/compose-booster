// Shared TypeScript interfaces for Compose Booster

export interface Model {
  id: string;
  name: string;
  cost: 'Low' | 'Medium' | 'High';
  costDetails?: {
    input: string;
    output: string;
  };
  enabled: boolean;
  isDefault?: boolean;
}

export interface Prompt {
  name: string;
  text: string;
  isDefault?: boolean;
}

export interface Tone {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
}

export interface HotCombo {
  name: string;
  icon: string;
  model: string;
  prompt: string;
  tone: string;
  position: number;
}

export interface LastUsed {
  model: string;
  prompt: string;
  tone: string;
}

export interface Preferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  saveWindowPosition: boolean;
  checkUpdates: boolean;
  clearHistoryOnExit: boolean;
  includeClosingAndSignature: boolean;
}

export interface WindowBounds {
  width: number;
  height: number;
  x?: number;
  y?: number;
}

export interface Statistics {
  totalCalls: number;
  totalCost: number;
  monthlyCost: number;
  lastResetDate: string;
}

export interface AppConfig {
  apiKey: string;
  models: Model[];
  prompts: Record<string, Prompt>;
  tones: Tone[];
  hotCombos: HotCombo[];
  lastUsed: LastUsed;
  preferences: Preferences;
  windowBounds: WindowBounds;
  statistics: Statistics;
}

// API Request/Response Types
export interface ProcessEmailRequest {
  input: string;
  model: string;
  prompt: string;
  tone: string;
}

export interface ApiUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ApiResponse {
  success: boolean;
  data?: string;
  model?: string;
  cost?: number;
  time?: number;
  usage?: ApiUsage;
  error?: ApiError;
}

export interface ApiError {
  message: string;
  code: string;
  retryable?: boolean;
  action?: 'OPEN_SETTINGS' | 'RETRY';
  retryAfter?: number;
}

// IPC Types
export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Window Types
export type WindowType = 'main' | 'settings';

// History Item
export interface HistoryItem {
  input: string;
  output: string;
  timestamp: number;
}
