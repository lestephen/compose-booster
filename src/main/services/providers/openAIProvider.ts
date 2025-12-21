// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// OpenAI Provider Adapter
// Implements the provider adapter interface for OpenAI's Chat Completions API

import axios, { AxiosError } from 'axios';
import { ApiResponse, ProviderConfig, ProviderInfo } from '../../../shared/types';
import {
  ProviderAdapter,
  ProviderRequest,
  ConnectionTestResult,
  ModelsResult,
  ProviderModel,
} from './providerAdapter';
import { API_DEFAULT_TIMEOUT } from '../../../shared/constants';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODELS_URL = 'https://api.openai.com/v1/models';

export class OpenAIProvider implements ProviderAdapter {
  readonly id = 'openai';

  readonly info: ProviderInfo = {
    id: 'openai',
    name: 'OpenAI',
    description: 'Direct access to GPT models from OpenAI.',
    requiresApiKey: true,
    requiresBaseUrl: false,
    helpUrl: 'https://platform.openai.com/api-keys',
  };

  async testConnection(config: ProviderConfig): Promise<ConnectionTestResult> {
    const apiKey = config.apiKey;

    if (!apiKey || apiKey.trim() === '') {
      return { success: false, error: 'API key is empty' };
    }

    try {
      // Test by listing models - doesn't consume tokens
      await axios.get(OPENAI_MODELS_URL, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 10000,
      });

      return { success: true };
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 401) {
        return { success: false, error: 'Invalid API key' };
      }

      return { success: false, error: this.getNetworkErrorMessage(axiosError) };
    }
  }

  async processRequest(config: ProviderConfig, request: ProviderRequest): Promise<ApiResponse> {
    const apiKey = config.apiKey;
    const startTime = Date.now();

    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: request.model,
          messages: [{ role: 'user', content: request.prompt }],
          temperature: request.temperature,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
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
      const response = await axios.get(OPENAI_MODELS_URL, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 10000,
      });

      if (response.data && response.data.data) {
        // Filter to only chat models
        const chatModels = response.data.data
          .filter((m: any) => m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3'))
          .map((m: any) => ({
            id: m.id,
            name: this.formatModelName(m.id),
            contextLength: this.getContextLength(m.id),
            pricing: this.getPricing(m.id),
          }));

        return { success: true, data: chatModels };
      }

      return { success: false, error: 'Invalid response from OpenAI API' };
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 401) {
        return { success: false, error: 'Invalid API key' };
      }

      return { success: false, error: this.getNetworkErrorMessage(axiosError) };
    }
  }

  private formatModelName(id: string): string {
    // Format model ID into a readable name
    const nameMap: Record<string, string> = {
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'o1-preview': 'O1 Preview',
      'o1-mini': 'O1 Mini',
    };
    return nameMap[id] || id;
  }

  private getContextLength(id: string): number {
    // Approximate context lengths
    if (id.includes('gpt-4o') || id.includes('gpt-4-turbo')) return 128000;
    if (id.includes('o1')) return 128000;
    if (id.includes('gpt-4')) return 8192;
    if (id.includes('gpt-3.5-turbo')) return 16385;
    return 4096;
  }

  private getPricing(id: string): { prompt: string; completion: string } | undefined {
    // Approximate pricing per token
    const pricingMap: Record<string, { prompt: string; completion: string }> = {
      'gpt-4o': { prompt: '0.0000025', completion: '0.00001' },
      'gpt-4o-mini': { prompt: '0.00000015', completion: '0.0000006' },
      'gpt-4-turbo': { prompt: '0.00001', completion: '0.00003' },
      'gpt-4': { prompt: '0.00003', completion: '0.00006' },
      'gpt-3.5-turbo': { prompt: '0.0000005', completion: '0.0000015' },
    };
    return pricingMap[id];
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
      const errorData = error.response.data as any;

      switch (status) {
        case 401:
          return {
            success: false,
            error: {
              message: 'Invalid API key. Please update your OpenAI API key in Settings.',
              code: 'INVALID_API_KEY',
              action: 'OPEN_SETTINGS',
            },
          };

        case 429:
          return {
            success: false,
            error: {
              message: 'Rate limit exceeded. Please wait before trying again.',
              code: 'RATE_LIMIT',
              retryable: true,
            },
          };

        case 400:
          return {
            success: false,
            error: {
              message: errorData?.error?.message || 'Invalid request to OpenAI API.',
              code: 'BAD_REQUEST',
            },
          };

        case 500:
        case 502:
        case 503:
          return {
            success: false,
            error: {
              message: 'OpenAI server error. Please try again later.',
              code: 'SERVER_ERROR',
              retryable: true,
            },
          };

        default:
          return {
            success: false,
            error: {
              message: errorData?.error?.message || `API error: ${error.response.statusText}`,
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

export const openAIProvider = new OpenAIProvider();
