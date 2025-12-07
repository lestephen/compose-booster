// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Default configuration for Compose Booster
// Based on SPEC.md requirements

import { AppConfig, Model, Prompt, Tone, QuickAction } from '../../shared/types';
import {
  DEFAULT_FONT_SIZE,
  MAIN_WINDOW_DEFAULT_WIDTH,
  MAIN_WINDOW_DEFAULT_HEIGHT,
} from '../../shared/constants';

export const DEFAULT_MODELS: Model[] = [
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude 4.5 Sonnet',
    cost: 'Medium',
    costDetails: { input: '$3.00/M', output: '$15.00/M' },
    enabled: true,
    isDefault: true
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    cost: 'Low',
    costDetails: { input: '$0.35/M', output: '$1.05/M' },
    enabled: true,
    isDefault: true
  },
  {
    id: 'openai/gpt-5',
    name: 'GPT 5',
    cost: 'High',
    costDetails: { input: '$10.00/M', output: '$30.00/M' },
    enabled: true,
    isDefault: true
  },
];

export const DEFAULT_PROMPTS: Record<string, Prompt> = {
  improve: {
    name: 'Improve & Polish',
    text: `You are an expert email writing assistant. Analyze the email below and improve it for clarity, professionalism, grammar, and tone ${''/* tone variable */}.

Important: The email may contain the person's draft reply followed by the original email chain (separated by "-----Original Message-----" or email headers). Only improve the person's draft reply at the top - do not modify or include the original email chain.

Return ONLY the improved version of the person's draft reply.

\$\{content\}`,
    isDefault: true,
  },

  professional: {
    name: 'Make Professional',
    text: `Rewrite the person's draft reply in a \$\{tone\} professional and formal business tone. Only rewrite the draft reply at the top - do not include the original email chain.

Return ONLY the rewritten professional version.

\$\{content\}`,
    isDefault: true,
  },

  friendly: {
    name: 'Make Friendly',
    text: `Rewrite the person's draft reply in a \$\{tone\} warmer, friendlier tone while remaining professional. Only rewrite the draft reply at the top.

Return ONLY the rewritten version.

\$\{content\}`,
    isDefault: true,
  },

  concise: {
    name: 'Make Concise',
    text: `Make the person's draft reply more concise \$\{tone\} while preserving all key points. Only process the draft reply at the top.

Return ONLY the concise version.

\$\{content\}`,
    isDefault: true,
  },

  expand: {
    name: 'Expand Details',
    text: `Expand the person's draft reply \$\{tone\} with more detail and clarity. Only expand the draft reply at the top.

Return ONLY the expanded version.

\$\{content\}`,
    isDefault: true,
  },

  reply: {
    name: 'Draft Reply',
    text: `Based on the email chain, draft a \$\{tone\} professional reply. The content shows preliminary thoughts (if any) followed by the email chain.

Return ONLY the draft reply.

\$\{content\}`,
    isDefault: true,
  },

  summarize: {
    name: 'Summarize Email',
    text: `Summarize the key points of this email conversation in a \$\{tone\} brief, clear manner.

\$\{content\}`,
    isDefault: true,
  },
};

export const DEFAULT_TONES: Tone[] = [
  {
    id: 'neutral',
    name: 'Neutral',
    description: '',
    isDefault: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'in a highly professional and formal manner',
    isDefault: true,
  },
  {
    id: 'friendly',
    name: 'Friendly',
    description: 'while maintaining a warm and friendly tone',
    isDefault: true,
  },
  {
    id: 'concise',
    name: 'Concise',
    description: 'being brief and to-the-point',
    isDefault: true,
  },
  {
    id: 'detailed',
    name: 'Detailed',
    description: 'with comprehensive detail and thoroughness',
    isDefault: true,
  },
  {
    id: 'apologetic',
    name: 'Apologetic',
    description: 'with an apologetic and understanding tone',
    isDefault: true,
  },
  {
    id: 'assertive',
    name: 'Assertive',
    description: 'with confidence and assertiveness',
    isDefault: true,
  },
  {
    id: 'empathetic',
    name: 'Empathetic',
    description: 'showing empathy and understanding',
    isDefault: true,
  },
  {
    id: 'urgent',
    name: 'Urgent',
    description: 'conveying urgency and importance',
    isDefault: true,
  },
  {
    id: 'casual',
    name: 'Casual',
    description: 'in a casual, conversational manner',
    isDefault: true,
  },
];

export const DEFAULT_HOT_COMBOS: QuickAction[] = [
  {
    name: 'Quick Polish',
    icon: '✨',
    model: 'openai/gpt-4o',
    prompt: 'improve',
    tone: 'neutral',
    position: 1,
  },
  {
    name: 'Professional Email',
    icon: '👔',
    model: 'anthropic/claude-3.5-sonnet',
    prompt: 'professional',
    tone: 'professional',
    position: 2,
  },
  {
    name: 'Draft Reply',
    icon: '💬',
    model: 'anthropic/claude-3.5-sonnet',
    prompt: 'reply',
    tone: 'friendly',
    position: 3,
  },
];

export const DEFAULT_CONFIG: AppConfig = {
  apiKey: '',
  models: DEFAULT_MODELS,
  prompts: DEFAULT_PROMPTS,
  tones: DEFAULT_TONES,
  quickActions: DEFAULT_HOT_COMBOS,
  lastUsed: {
    model: 'anthropic/claude-3.5-sonnet',
    prompt: 'improve',
    tone: 'neutral',
  },
  preferences: {
    theme: 'light',
    fontSize: DEFAULT_FONT_SIZE,
    saveWindowPosition: true,
    checkUpdates: true,
    clearHistoryOnExit: false,
    includeClosingAndSignature: false,
  },
  windowBounds: {
    width: MAIN_WINDOW_DEFAULT_WIDTH,
    height: MAIN_WINDOW_DEFAULT_HEIGHT,
  },
  statistics: {
    totalCalls: 0,
    totalCost: 0,
    monthlyCost: 0,
    lastResetDate: new Date().toISOString().split('T')[0],
  },
};
