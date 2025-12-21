// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Shared TypeScript interfaces for Compose Booster

// Provider Types for Multi-Provider Support
export type ProviderId = 'openrouter' | 'anthropic' | 'openai' | 'ollama' | 'openai-compatible';

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  enabled: boolean;
  apiKey?: string;          // API key for the provider (not needed for Ollama)
  baseUrl?: string;         // Custom base URL (required for Ollama and OpenAI-compatible)
  isDefault?: boolean;      // True if this is the default provider
}

export interface ProviderInfo {
  id: ProviderId;
  name: string;
  description: string;
  requiresApiKey: boolean;
  requiresBaseUrl: boolean;
  defaultBaseUrl?: string;
  helpUrl?: string;
}

export interface Model {
  id: string;
  name: string;
  cost: 'Low' | 'Medium' | 'High' | 'Free' | 'N/A';  // Free for Ollama, N/A when pricing unknown
  costDetails?: {
    input: string;
    output: string;
  };
  contextLength?: number; // Maximum context window size in tokens
  enabled: boolean;
  isDefault?: boolean;
  provider?: ProviderId;   // Provider for this model (defaults to 'openrouter' if not set)
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

export interface QuickAction {
  name: string;
  icon: string;
  model: string;
  prompt: string;
  tone: string;
  style?: string;
  position: number;
}

export interface StyleProfile {
  id: string;
  name: string;
  description: string;
  samples?: string[];  // Example emails written in this style for few-shot prompting
  isDefault?: boolean;
}

export interface LastUsed {
  model: string;
  prompt: string;
  tone: string;
  style: string;
}

export type OutputFormat = 'plain' | 'markdown' | 'html';

export interface Preferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  saveWindowPosition: boolean;
  checkUpdates: boolean;
  clearHistoryOnExit: boolean;
  includeClosingAndSignature: boolean;
  showDeveloperTools: boolean;
  outputFormat: OutputFormat;
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
  apiKey: string;                      // Legacy: OpenRouter API key (kept for backward compatibility)
  providers?: ProviderConfig[];        // Multi-provider support (optional for backward compatibility)
  activeProvider?: ProviderId;         // Currently active provider (defaults to 'openrouter')
  models: Model[];
  prompts: Record<string, Prompt>;
  tones: Tone[];
  styles: StyleProfile[];
  quickActions: QuickAction[];
  lastUsed: LastUsed;
  preferences: Preferences;
  windowBounds: WindowBounds;
  settingsWindowBounds?: WindowBounds;
  statistics: Statistics;
}

// API Request/Response Types
export interface ProcessEmailRequest {
  input: string;
  model: string;
  prompt: string;
  tone: string;
  style?: string;
}

export interface RegenerateRequest {
  input: string;
  model: string;
  prompt: string;
  tone: string;
  style?: string;
  temperature: number;
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

// Response Version (for regenerate feature)
export interface ResponseVersion {
  id: string;
  content: string;
  model: string;
  prompt: string;
  tone: string;
  temperature: number;
  timestamp: number;
  cost?: number;
}

// Auto-Update Types
export interface UpdateStatus {
  available: boolean;
  checking: boolean;
  downloading: boolean;
  downloaded: boolean;
  error: string | null;
  progress: number;
  version: string | null;
  releaseNotes: string | null;
}

export type DistributionChannel = 'github' | 'ms-store' | 'mac-store';
