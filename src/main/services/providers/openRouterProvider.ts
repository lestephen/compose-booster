// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// OpenRouter Provider Adapter
// Implements the provider adapter interface for OpenRouter API

import axios, { AxiosError } from 'axios';
import { ApiResponse, ProviderConfig, ProviderInfo } from '../../../shared/types';
import {
  ProviderAdapter,
  ProviderRequest,
  ConnectionTestResult,
  ModelsResult,
  ProviderModel,
} from './providerAdapter';
import {
  OPENROUTER_API_URL,
  OPENROUTER_REFERER,
  APP_NAME,
  API_DEFAULT_TIMEOUT,
} from '../../../shared/constants';

export class OpenRouterProvider implements ProviderAdapter {
  readonly id = 'openrouter';

  readonly info: ProviderInfo = {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access 200+ AI models from Anthropic, OpenAI, Google, Meta, and more through a single API.',
    requiresApiKey: true,
    requiresBaseUrl: false,
    helpUrl: 'https://openrouter.ai/keys',
  };

  async testConnection(config: ProviderConfig): Promise<ConnectionTestResult> {
    const apiKey = config.apiKey;

    if (!apiKey || apiKey.trim() === '') {
      return { success: false, error: 'API key is empty' };
    }

    try {
      await axios.get('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': OPENROUTER_REFERER,
          'X-Title': APP_NAME,
        },
        timeout: 10000,
      });

      return { success: true };
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 401) {
        return { success: false, error: 'Invalid API key' };
      }

      if (axiosError.response?.status === 402) {
        // Key is valid but no credits - still counts as valid
        return { success: true };
      }

      return { success: false, error: this.getNetworkErrorMessage(axiosError) };
    }
  }

  async processRequest(config: ProviderConfig, request: ProviderRequest): Promise<ApiResponse> {
    const apiKey = config.apiKey;
    const startTime = Date.now();

    try {
      const response = await axios.post(
        OPENROUTER_API_URL,
        {
          model: request.model,
          messages: [{ role: 'user', content: request.prompt }],
          temperature: request.temperature,
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

      const usage = response.data.usage;
      return {
        success: true,
        data: content,
        model: request.model,
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

  async getAvailableModels(config: ProviderConfig): Promise<ModelsResult> {
    const apiKey = config.apiKey;

    try {
      const response = await axios.get('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': OPENROUTER_REFERER,
          'X-Title': APP_NAME,
        },
        timeout: 10000,
      });

      if (response.data && response.data.data) {
        const models: ProviderModel[] = response.data.data.map((m: any) => ({
          id: m.id,
          name: m.name || m.id,
          contextLength: m.context_length,
          pricing: m.pricing
            ? {
                prompt: m.pricing.prompt || '0',
                completion: m.pricing.completion || '0',
              }
            : undefined,
        }));
        return { success: true, data: models };
      }

      return { success: false, error: 'Invalid response from OpenRouter API' };
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 401) {
        return { success: false, error: 'Invalid API key' };
      }

      return { success: false, error: this.getNetworkErrorMessage(axiosError) };
    }
  }

  private handleApiError(error: AxiosError): ApiResponse {
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

        case 429: {
          const retryAfter = Number(error.response.headers['retry-after']) || 60;
          return {
            success: false,
            error: {
              message: `Rate limit exceeded. Please wait ${retryAfter} seconds.`,
              code: 'RATE_LIMIT',
              retryAfter,
            },
          };
        }

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

    return {
      success: false,
      error: {
        message: error.message || 'An unexpected error occurred.',
        code: 'UNKNOWN_ERROR',
      },
    };
  }

  private getNetworkErrorMessage(error: AxiosError): string {
    if (error.code === 'ENOTFOUND') {
      return 'DNS lookup failed. Check your internet connection.';
    }
    if (error.code === 'ECONNREFUSED') {
      return 'Connection refused. The server may be down.';
    }
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return 'Connection timed out. Try again later.';
    }
    const errorDetail = error.code ? ` (${error.code})` : '';
    return `Network error${errorDetail}. Check your connection.`;
  }
}

export const openRouterProvider = new OpenRouterProvider();
