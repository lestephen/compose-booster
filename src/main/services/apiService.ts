// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// API Service
// Handles OpenRouter API integration with mock mode support

import axios, { AxiosError } from 'axios';
import { ApiResponse, Tone } from '../../shared/types';
import {
  OPENROUTER_API_URL,
  OPENROUTER_REFERER,
  APP_NAME,
  API_DEFAULT_TIMEOUT,
  MOCK_API_ENV_VAR,
} from '../../shared/constants';

class ApiService {
  private useMock: boolean;

  constructor() {
    // Enable mock mode for MOCK_API=true or SCREENSHOT_MODE=1
    this.useMock = process.env[MOCK_API_ENV_VAR] === 'true' || process.env.SCREENSHOT_MODE === '1';
  }

  /**
   * Process email through OpenRouter API
   */
  async processEmail(
    apiKey: string,
    model: string,
    finalPrompt: string
  ): Promise<ApiResponse> {
    if (this.useMock) {
      return this.mockResponse(finalPrompt);
    }

    return this.callOpenRouter(apiKey, model, finalPrompt);
  }

  /**
   * Make actual API call to OpenRouter
   */
  private async callOpenRouter(
    apiKey: string,
    model: string,
    prompt: string
  ): Promise<ApiResponse> {
    const startTime = Date.now();

    try {
      const response = await axios.post(
        OPENROUTER_API_URL,
        {
          model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
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

      return {
        success: true,
        data: content,
        model,
        time,
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
  private async mockResponse(prompt: string): Promise<ApiResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockContent = `[MOCK RESPONSE]

This is a simulated AI response for development purposes.

Your original prompt was ${prompt.length} characters long.

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
      // Use the /auth/key endpoint to validate the key without consuming credits
      // This is more reliable than making a model call
      const response = await axios.get(
        'https://openrouter.ai/api/v1/auth/key',
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': OPENROUTER_REFERER,
            'X-Title': APP_NAME,
          },
          timeout: 10000,
        }
      );

      // If we get a response, the key is valid
      return { valid: true };
    } catch (error) {
      const axiosError = error as AxiosError;

      // Log detailed error for debugging
      console.error('[ApiService] testApiKey error:', {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
      });

      if (axiosError.response?.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      }

      if (axiosError.response?.status === 402) {
        // Key is valid but no credits - still counts as valid key
        return { valid: true };
      }

      // Provide more specific error messages
      if (axiosError.code === 'ENOTFOUND') {
        return { valid: false, error: 'DNS lookup failed. Check your internet connection.' };
      }
      if (axiosError.code === 'ECONNREFUSED') {
        return { valid: false, error: 'Connection refused. The server may be down.' };
      }
      if (axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ECONNABORTED') {
        return { valid: false, error: 'Connection timed out. Try again later.' };
      }
      if (axiosError.code === 'CERT_HAS_EXPIRED' || axiosError.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        return { valid: false, error: 'SSL certificate error. Check your system date/time.' };
      }

      // Include error code in message for debugging
      const errorDetail = axiosError.code ? ` (${axiosError.code})` : '';
      return { valid: false, error: `Could not verify API key${errorDetail}. Check your connection.` };
    }
  }

  /**
   * Fetch available models from OpenRouter API
   */
  async getAvailableModels(apiKey: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    if (this.useMock) {
      // Return mock models for development
      return {
        success: true,
        data: [
          { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', pricing: { prompt: '0.000015', completion: '0.000075' } },
          { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', pricing: { prompt: '0.00001', completion: '0.00003' } },
          { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', pricing: { prompt: '0.0000008', completion: '0.0000008' } },
        ],
      };
    }

    try {
      const response = await axios.get(
        'https://openrouter.ai/api/v1/models',
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': OPENROUTER_REFERER,
            'X-Title': APP_NAME,
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.data) {
        return { success: true, data: response.data.data };
      }

      return { success: false, error: 'Invalid response from OpenRouter API' };
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 401) {
        return { success: false, error: 'Invalid API key' };
      }

      return { success: false, error: 'Failed to fetch models. Check your connection.' };
    }
  }

  /**
   * Build final prompt from template with variable substitution
   */
  buildPrompt(
    template: string,
    tone: Tone | undefined,
    content: string,
    includeClosingAndSignature: boolean
  ): string {
    const date = new Date().toLocaleDateString();
    const toneDescription = tone?.description || '';

    let prompt = template
      .replace(/\$\{content\}/g, content)
      .replace(/\$\{tone\}/g, toneDescription)
      .replace(/\$\{date\}/g, date);

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
