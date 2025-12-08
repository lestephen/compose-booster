// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Context Window Estimator
// Provides rough token count estimates and context warnings

import { Model, Prompt, StyleProfile } from '../../../shared/types';

/**
 * Average characters per token (rough estimate)
 * Most LLMs average 3-4 chars per token for English text
 */
const CHARS_PER_TOKEN = 4;

/**
 * Warning threshold - warn when estimated tokens exceed this percentage of context
 */
const WARNING_THRESHOLD = 0.8; // 80%

/**
 * Critical threshold - strongly warn when exceeding this percentage
 */
const CRITICAL_THRESHOLD = 0.95; // 95%

/**
 * Estimate token count from text length
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Estimate the total input tokens for a request
 */
export function estimateTotalTokens(
  input: string,
  prompt: Prompt | undefined,
  style: StyleProfile | undefined
): number {
  let totalChars = 0;

  // User input
  totalChars += input.length;

  // Prompt template (with some padding for variable substitution)
  if (prompt) {
    totalChars += prompt.text.length;
  }

  // Style description and samples
  if (style) {
    if (style.description) {
      totalChars += style.description.length;
    }
    if (style.samples) {
      totalChars += style.samples.reduce((sum, sample) => sum + sample.length, 0);
    }
  }

  // Add some padding for system prompt structure and formatting (roughly 200 tokens)
  totalChars += 800;

  return estimateTokenCount(totalChars);
}

export interface ContextWarning {
  type: 'none' | 'warning' | 'critical';
  message: string;
  estimatedTokens: number;
  contextLimit: number;
  percentUsed: number;
  suggestions: string[];
}

/**
 * Check if the estimated input size might exceed the model's context window
 */
export function checkContextLimit(
  input: string,
  prompt: Prompt | undefined,
  style: StyleProfile | undefined,
  model: Model
): ContextWarning {
  const estimatedTokens = estimateTotalTokens(input, prompt, style);
  const contextLimit = model.contextLength || 128000; // Default to 128k if unknown
  const percentUsed = estimatedTokens / contextLimit;

  if (percentUsed >= CRITICAL_THRESHOLD) {
    const suggestions: string[] = [];

    // Check if style samples are contributing significantly
    if (style?.samples && style.samples.length > 0) {
      const samplesTokens = estimateTokenCount(
        style.samples.reduce((sum, s) => sum + s, '')
      );
      if (samplesTokens > estimatedTokens * 0.3) {
        suggestions.push('Remove or reduce style example emails');
      }
    }

    // Check if input is very long
    if (input.length > 10000) {
      suggestions.push('Shorten the email thread (remove older messages)');
    }

    suggestions.push('Use a model with a larger context window');
    suggestions.push('Proceed anyway (may cause API error)');

    return {
      type: 'critical',
      message: `Input is very close to model context limit (~${Math.round(percentUsed * 100)}% of ${formatTokenCount(contextLimit)} tokens). The request may fail.`,
      estimatedTokens,
      contextLimit,
      percentUsed,
      suggestions,
    };
  }

  if (percentUsed >= WARNING_THRESHOLD) {
    return {
      type: 'warning',
      message: `Input is using ~${Math.round(percentUsed * 100)}% of the model's ${formatTokenCount(contextLimit)} token context window.`,
      estimatedTokens,
      contextLimit,
      percentUsed,
      suggestions: [
        'Consider using fewer style examples',
        'Consider shortening the email thread',
      ],
    };
  }

  return {
    type: 'none',
    message: '',
    estimatedTokens,
    contextLimit,
    percentUsed,
    suggestions: [],
  };
}

/**
 * Format token count for display (e.g., "128K" for 128000)
 */
function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${Math.round(tokens / 1000)}K`;
  }
  return tokens.toString();
}
