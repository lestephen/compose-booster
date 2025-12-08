// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// API Service
// Handles OpenRouter API integration with mock mode support

import axios, { AxiosError } from 'axios';
import { ApiResponse, Tone, StyleProfile } from '../../shared/types';
import {
  OPENROUTER_API_URL,
  OPENROUTER_REFERER,
  APP_NAME,
  API_DEFAULT_TIMEOUT,
  MOCK_API_ENV_VAR,
} from '../../shared/constants';

// Cache TTL for model list (5 minutes)
const MODEL_CACHE_TTL_MS = 5 * 60 * 1000;

interface ModelCache {
  data: any[];
  timestamp: number;
}

class ApiService {
  private useMock: boolean;
  private modelCache: ModelCache | null = null;

  constructor() {
    this.useMock = process.env[MOCK_API_ENV_VAR] === 'true';
  }

  /**
   * Process email through OpenRouter API
   * @param temperature - Optional temperature for response variety (0.0-2.0, default undefined uses model default)
   */
  async processEmail(
    apiKey: string,
    model: string,
    finalPrompt: string,
    temperature?: number
  ): Promise<ApiResponse> {
    if (this.useMock) {
      return this.mockResponse(finalPrompt, temperature);
    }

    return this.callOpenRouter(apiKey, model, finalPrompt, temperature);
  }

  /**
   * Make actual API call to OpenRouter
   */
  private async callOpenRouter(
    apiKey: string,
    model: string,
    prompt: string,
    temperature?: number
  ): Promise<ApiResponse> {
    const startTime = Date.now();

    try {
      const requestBody: Record<string, unknown> = {
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      };

      // Add temperature if specified
      if (temperature !== undefined) {
        requestBody.temperature = temperature;
      }

      const response = await axios.post(
        OPENROUTER_API_URL,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': OPENROUTER_REFERER,
            'X-Title': APP_NAME,
            'Content-Type': 'application/json',
          },
          timeout: API_DEFAULT_TIMEOUT,
        }
      );

      const time = Date.now() - startTime;
      const content = response.data.choices?.[0]?.message?.content;

      if (!content) {
        return {
          success: false,
          error: {
            message: 'Invalid response from API: No content returned',
            code: 'INVALID_RESPONSE',
          },
        };
      }

      // Extract usage information if available
      const usage = response.data.usage;

      // Extract cost - OpenRouter returns this in usage.total_cost or as a separate field
      // Cost is in USD
      const cost = usage?.total_cost ?? response.data.cost ?? undefined;

      return {
        success: true,
        data: content,
        model,
        time,
        cost,
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens || 0,
              completionTokens: usage.completion_tokens || 0,
              totalTokens: usage.total_tokens || 0,
            }
          : undefined,
      };
    } catch (error) {
      return this.handleApiError(error as AxiosError);
    }
  }

  /**
   * Handle API errors with appropriate user messages
   */
  private handleApiError(error: AxiosError): ApiResponse {
    // Network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return {
        success: false,
        error: {
          message: 'Network error. Please check your internet connection.',
          code: 'NETWORK_ERROR',
          retryable: true,
        },
      };
    }

    // API response errors
    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 401:
          return {
            success: false,
            error: {
              message: 'Invalid API key. Please update your API key in Settings.',
              code: 'INVALID_API_KEY',
              action: 'OPEN_SETTINGS',
            },
          };

        case 429:
          const retryAfter = Number(error.response.headers['retry-after']) || 60;
          return {
            success: false,
            error: {
              message: `Rate limit exceeded. Please wait ${retryAfter} seconds.`,
              code: 'RATE_LIMIT',
              retryAfter,
            },
          };

        case 402:
          return {
            success: false,
            error: {
              message: 'Insufficient credits in your OpenRouter account.',
              code: 'INSUFFICIENT_CREDITS',
            },
          };

        case 500:
        case 502:
        case 503:
          return {
            success: false,
            error: {
              message: 'OpenRouter server error. Please try again later.',
              code: 'SERVER_ERROR',
              retryable: true,
            },
          };

        default:
          return {
            success: false,
            error: {
              message: `API error: ${error.response.statusText || 'Unknown error'}`,
              code: `HTTP_${status}`,
            },
          };
      }
    }

    // Request timeout
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: {
          message: 'Request timeout. The API took too long to respond.',
          code: 'TIMEOUT',
          retryable: true,
        },
      };
    }

    // Unknown error
    return {
      success: false,
      error: {
        message: error.message || 'An unexpected error occurred.',
        code: 'UNKNOWN_ERROR',
      },
    };
  }

  /**
   * Mock API response for development
   */
  private async mockResponse(prompt: string, temperature?: number): Promise<ApiResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const tempInfo = temperature !== undefined ? `Temperature: ${temperature}` : 'Temperature: default';
    const mockContent = `[MOCK RESPONSE]

This is a simulated AI response for development purposes.

Your original prompt was ${prompt.length} characters long.
${tempInfo}

In production, this would be replaced with the actual OpenRouter API response.

Mock features:
✓ Simulated 1.5s delay
✓ Basic response structure
✓ No API credits consumed

Best regards,
Mock AI Assistant`;

    return {
      success: true,
      data: mockContent,
      model: 'mock-model',
      cost: 0.001,
      time: 1500,
      usage: {
        promptTokens: Math.floor(prompt.length / 4),
        completionTokens: Math.floor(mockContent.length / 4),
        totalTokens: Math.floor((prompt.length + mockContent.length) / 4),
      },
    };
  }

  /**
   * Test API key validity
   */
  async testApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    if (!apiKey || apiKey.trim() === '') {
      return { valid: false, error: 'API key is empty' };
    }

    if (this.useMock) {
      // In mock mode, accept any non-empty key
      return { valid: true };
    }

    try {
      // Make a minimal API call to test the key
      const response = await axios.post(
        OPENROUTER_API_URL,
        {
          model: 'openai/gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': OPENROUTER_REFERER,
            'X-Title': APP_NAME,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return { valid: true };
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      }

      if (axiosError.response?.status === 402) {
        // Key is valid but no credits - still counts as valid key
        return { valid: true };
      }

      // Other errors might be network issues
      return { valid: false, error: 'Could not verify API key. Check your connection.' };
    }
  }

  /**
   * Fetch available models from OpenRouter API
   * Note: The /models endpoint is public but we include auth for consistency
   * @param forceRefresh - If true, bypass cache and fetch fresh data
   */
  async getAvailableModels(apiKey: string, forceRefresh: boolean = false): Promise<{ success: boolean; data?: any[]; error?: string }> {
    if (this.useMock) {
      // Return mock models for development with context_length and modality
      return {
        success: true,
        data: [
          { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', context_length: 200000, architecture: { modality: 'text->text' }, pricing: { prompt: '0.000015', completion: '0.000075' } },
          { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', context_length: 128000, architecture: { modality: 'text+image->text' }, pricing: { prompt: '0.00001', completion: '0.00003' } },
          { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', context_length: 131072, architecture: { modality: 'text->text' }, pricing: { prompt: '0.0000008', completion: '0.0000008' } },
        ],
      };
    }

    // Check cache first (unless force refresh requested)
    if (!forceRefresh && this.modelCache) {
      const cacheAge = Date.now() - this.modelCache.timestamp;
      if (cacheAge < MODEL_CACHE_TTL_MS) {
        console.log(`[ApiService] Returning cached models (${this.modelCache.data.length} models, cache age: ${Math.round(cacheAge / 1000)}s)`);
        return { success: true, data: this.modelCache.data };
      } else {
        console.log('[ApiService] Model cache expired, fetching fresh data...');
      }
    }

    try {
      console.log('[ApiService] Fetching models from OpenRouter...');

      const response = await axios.get(
        'https://openrouter.ai/api/v1/models',
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': OPENROUTER_REFERER,
            'X-Title': APP_NAME,
          },
          timeout: 15000, // Increased timeout for large model list
        }
      );

      if (response.data && response.data.data) {
        // Filter to only include models that output text
        // Modality format: "input->output" e.g., "text->text", "text+image->text", "text->image"
        const textOutputModels = response.data.data.filter((model: any) => {
          const modality = model.architecture?.modality;
          if (!modality) return true; // Include if no modality info (safer default)
          // Include models that output text (modality ends with "->text")
          return modality.endsWith('->text');
        });

        console.log(`[ApiService] Successfully fetched ${response.data.data.length} models, ${textOutputModels.length} are text-output models`);

        // Update cache with filtered models
        this.modelCache = {
          data: textOutputModels,
          timestamp: Date.now(),
        };

        return { success: true, data: textOutputModels };
      }

      console.error('[ApiService] Invalid response structure:', JSON.stringify(response.data).substring(0, 200));
      return { success: false, error: 'Invalid response from OpenRouter API' };
    } catch (error) {
      const axiosError = error as AxiosError;

      console.error('[ApiService] Model fetch error:', {
        code: axiosError.code,
        status: axiosError.response?.status,
        message: axiosError.message,
      });

      if (axiosError.response?.status === 401) {
        return { success: false, error: 'Invalid API key' };
      }

      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        return { success: false, error: 'Request timed out. OpenRouter may be slow to respond.' };
      }

      return { success: false, error: `Failed to fetch models: ${axiosError.message}` };
    }
  }

  /**
   * Clear the model cache (useful when API key changes)
   */
  clearModelCache(): void {
    this.modelCache = null;
    console.log('[ApiService] Model cache cleared');
  }

  /**
   * Build final prompt from template with variable substitution
   */
  buildPrompt(
    template: string,
    tone: Tone | undefined,
    style: StyleProfile | undefined,
    content: string,
    includeClosingAndSignature: boolean
  ): string {
    const date = new Date().toLocaleDateString();
    const toneDescription = tone?.description || '';

    let prompt = template
      .replace(/\$\{content\}/g, content)
      .replace(/\$\{tone\}/g, toneDescription)
      .replace(/\$\{date\}/g, date);

    // Add style instructions if a style is selected (and it has content)
    if (style && (style.description || (style.samples && style.samples.length > 0))) {
      prompt += '\n\n--- WRITING STYLE GUIDANCE ---';

      if (style.description) {
        prompt += `\nStyle description: ${style.description}`;
      }

      // Add sample emails for few-shot learning
      if (style.samples && style.samples.length > 0) {
        prompt += '\n\nHere are examples of emails written in my preferred style. Please match this writing style:';
        style.samples.forEach((sample, index) => {
          prompt += `\n\n[Example ${index + 1}]\n${sample}`;
        });
      }

      prompt += '\n\n--- END STYLE GUIDANCE ---';
    }

    // Add instruction about closing and signature
    if (!includeClosingAndSignature) {
      prompt += '\n\nIMPORTANT: Do NOT include a closing salutation (e.g., "Best regards", "Sincerely") or email signature. Only provide the email body content.';
    }

    return prompt;
  }

  /**
   * Validate prompt template
   */
  validatePromptTemplate(template: string): boolean {
    // Template must include ${content} variable
    return template.includes('${content}');
  }

  /**
   * Enable/disable mock mode
   */
  setMockMode(enabled: boolean): void {
    this.useMock = enabled;
  }

  /**
   * Check if mock mode is enabled
   */
  isMockMode(): boolean {
    return this.useMock;
  }
}

// Export singleton instance
export const apiService = new ApiService();
