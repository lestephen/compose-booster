// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// OpenAI-Compatible Provider Adapter
// For custom endpoints that implement the OpenAI API spec (e.g., Azure APIM, org proxies)

import axios, { AxiosError } from 'axios';
import { ApiResponse, ProviderConfig, ProviderInfo } from '../../../shared/types';
import {
  ProviderAdapter,
  ProviderRequest,
  ConnectionTestResult,
  ModelsResult,
} from './providerAdapter';
import { API_DEFAULT_TIMEOUT } from '../../../shared/constants';

export class OpenAICompatibleProvider implements ProviderAdapter {
  readonly id = 'openai-compatible';

  readonly info: ProviderInfo = {
    id: 'openai-compatible',
    name: 'OpenAI-Compatible',
    description: 'Custom endpoint compatible with OpenAI API format (Azure APIM, organization proxies, etc.).',
    requiresApiKey: true,
    requiresBaseUrl: true,
    helpUrl: 'https://platform.openai.com/docs/api-reference',
  };

  async testConnection(config: ProviderConfig): Promise<ConnectionTestResult> {
    const { apiKey, baseUrl } = config;

    if (!baseUrl || baseUrl.trim() === '') {
      return { success: false, error: 'Base URL is required' };
    }

    if (!apiKey || apiKey.trim() === '') {
      return { success: false, error: 'API key is required' };
    }

    try {
      // Try to list models or make a simple request
      await axios.get(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 10000,
      });

      return { success: true };
    } catch (error) {
      const axiosError = error as AxiosError;

      // If models endpoint doesn't exist, try a minimal chat request
      if (axiosError.response?.status === 404) {
        // Models endpoint not found, but connection works
        return { success: true };
      }

      if (axiosError.response?.status === 401) {
        return { success: false, error: 'Invalid API key' };
      }

      return { success: false, error: this.getNetworkErrorMessage(axiosError) };
    }
  }

  async processRequest(config: ProviderConfig, request: ProviderRequest): Promise<ApiResponse> {
    const { apiKey, baseUrl } = config;
    const startTime = Date.now();

    if (!baseUrl) {
      return {
        success: false,
        error: {
          message: 'Base URL is not configured',
          code: 'NO_BASE_URL',
        },
      };
    }

    try {
      const response = await axios.post(
        `${baseUrl}/chat/completions`,
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
    const { apiKey, baseUrl } = config;

    if (!baseUrl) {
      return { success: false, error: 'Base URL is not configured' };
    }

    try {
      const response = await axios.get(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 10000,
      });

      if (response.data && response.data.data) {
        const models = response.data.data.map((m: any) => ({
          id: m.id,
          name: m.id,
          contextLength: m.context_window,
        }));
        return { success: true, data: models };
      }

      // If no models returned, return empty list (user can manually add models)
      return { success: true, data: [] };
    } catch (error) {
      const axiosError = error as AxiosError;

      // If models endpoint doesn't exist, return empty list
      if (axiosError.response?.status === 404) {
        return { success: true, data: [] };
      }

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
          message: 'Network error. Check your endpoint URL and connection.',
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
              message: 'Invalid API key. Please check your credentials.',
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

        case 404:
          return {
            success: false,
            error: {
              message: 'Endpoint not found. Check your base URL configuration.',
              code: 'NOT_FOUND',
            },
          };

        case 500:
        case 502:
        case 503:
          return {
            success: false,
            error: {
              message: 'Server error. Please try again later.',
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
          message: 'Request timeout. The server took too long to respond.',
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
      return 'Host not found. Check the endpoint URL.';
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

export const openAICompatibleProvider = new OpenAICompatibleProvider();
