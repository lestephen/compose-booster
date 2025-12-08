// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Shared TypeScript interfaces for Compose Booster

export interface Model {
  id: string;
  name: string;
  cost: 'Low' | 'Medium' | 'High';
  costDetails?: {
    input: string;
    output: string;
  };
  contextLength?: number; // Maximum context window size in tokens
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
  apiKey: string;
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
