// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Anthropic Provider Adapter
// Implements the provider adapter interface for Anthropic's Claude API

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

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export class AnthropicProvider implements ProviderAdapter {
  readonly id = 'anthropic';

  readonly info: ProviderInfo = {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Direct access to Claude models from Anthropic.',
    requiresApiKey: true,
    requiresBaseUrl: false,
    helpUrl: 'https://console.anthropic.com/settings/keys',
  };

  // Static list of Claude models (Anthropic doesn't have a public models endpoint)
  private static readonly MODELS: ProviderModel[] = [
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', contextLength: 200000, pricing: { prompt: '0.000015', completion: '0.000075' } },
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextLength: 200000, pricing: { prompt: '0.000003', completion: '0.000015' } },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextLength: 200000, pricing: { prompt: '0.000003', completion: '0.000015' } },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextLength: 200000, pricing: { prompt: '0.0000008', completion: '0.000004' } },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', contextLength: 200000, pricing: { prompt: '0.000015', completion: '0.000075' } },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', contextLength: 200000, pricing: { prompt: '0.000003', completion: '0.000015' } },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', contextLength: 200000, pricing: { prompt: '0.00000025', completion: '0.00000125' } },
  ];

  async testConnection(config: ProviderConfig): Promise<ConnectionTestResult> {
    const apiKey = config.apiKey;

    if (!apiKey || apiKey.trim() === '') {
      return { success: false, error: 'API key is empty' };
    }

    try {
      // Make a minimal request to test the key
      await axios.post(
        ANTHROPIC_API_URL,
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': ANTHROPIC_VERSION,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return { success: true };
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 401) {
        return { success: false, error: 'Invalid API key' };
      }

      if (axiosError.response?.status === 400) {
        // Bad request but key is valid
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
        ANTHROPIC_API_URL,
        {
          model: request.model,
          max_tokens: 4096,
          temperature: request.temperature,
          messages: [{ role: 'user', content: request.prompt }],
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': ANTHROPIC_VERSION,
            'Content-Type': 'application/json',
          },
          timeout: API_DEFAULT_TIMEOUT,
        }
      );

      const time = Date.now() - startTime;
      const content = response.data.content?.[0]?.text;

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
              promptTokens: usage.input_tokens || 0,
              completionTokens: usage.output_tokens || 0,
              totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
            }
          : undefined,
      };
    } catch (error) {
      return this.handleApiError(error as AxiosError);
    }
  }

  async getAvailableModels(_config: ProviderConfig): Promise<ModelsResult> {
    // Anthropic doesn't have a public models endpoint, return static list
    return { success: true, data: AnthropicProvider.MODELS };
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
              message: 'Invalid API key. Please update your Anthropic API key in Settings.',
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
              message: errorData?.error?.message || 'Invalid request to Anthropic API.',
              code: 'BAD_REQUEST',
            },
          };

        case 500:
        case 502:
        case 503:
          return {
            success: false,
            error: {
              message: 'Anthropic server error. Please try again later.',
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

export const anthropicProvider = new AnthropicProvider();
