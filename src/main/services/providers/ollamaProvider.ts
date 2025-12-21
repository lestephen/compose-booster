// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Ollama Provider Adapter
// Implements the provider adapter interface for local Ollama models

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

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

export class OllamaProvider implements ProviderAdapter {
  readonly id = 'ollama';

  readonly info: ProviderInfo = {
    id: 'ollama',
    name: 'Ollama',
    description: 'Run open-source AI models locally on your machine. No API key required.',
    requiresApiKey: false,
    requiresBaseUrl: true,
    defaultBaseUrl: DEFAULT_OLLAMA_URL,
    helpUrl: 'https://ollama.ai/',
  };

  private getBaseUrl(config: ProviderConfig): string {
    return config.baseUrl || DEFAULT_OLLAMA_URL;
  }

  async testConnection(config: ProviderConfig): Promise<ConnectionTestResult> {
    const baseUrl = this.getBaseUrl(config);

    try {
      // Check if Ollama is running by listing models
      await axios.get(`${baseUrl}/api/tags`, { timeout: 5000 });
      return { success: true };
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'Cannot connect to Ollama. Make sure Ollama is running.',
        };
      }

      return { success: false, error: this.getNetworkErrorMessage(axiosError) };
    }
  }

  async processRequest(config: ProviderConfig, request: ProviderRequest): Promise<ApiResponse> {
    const baseUrl = this.getBaseUrl(config);
    const startTime = Date.now();

    try {
      const response = await axios.post(
        `${baseUrl}/api/generate`,
        {
          model: request.model,
          prompt: request.prompt,
          stream: false,
          options: {
            temperature: request.temperature,
          },
        },
        {
          timeout: API_DEFAULT_TIMEOUT,
        }
      );

      const time = Date.now() - startTime;
      const content = response.data.response;

      if (!content) {
        return {
          success: false,
          error: {
            message: 'Invalid response from Ollama: No content returned',
            code: 'INVALID_RESPONSE',
          },
        };
      }

      return {
        success: true,
        data: content,
        model: request.model,
        time,
        usage: response.data.prompt_eval_count && response.data.eval_count
          ? {
              promptTokens: response.data.prompt_eval_count,
              completionTokens: response.data.eval_count,
              totalTokens: response.data.prompt_eval_count + response.data.eval_count,
            }
          : undefined,
      };
    } catch (error) {
      return this.handleApiError(error as AxiosError);
    }
  }

  async getAvailableModels(config: ProviderConfig): Promise<ModelsResult> {
    const baseUrl = this.getBaseUrl(config);

    try {
      const response = await axios.get(`${baseUrl}/api/tags`, { timeout: 5000 });

      if (response.data && response.data.models) {
        const models: ProviderModel[] = response.data.models.map((m: any) => ({
          id: m.name,
          name: this.formatModelName(m.name),
          contextLength: m.details?.parameter_size ? this.estimateContext(m.details.parameter_size) : undefined,
        }));
        return { success: true, data: models };
      }

      return { success: true, data: [] };
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'Cannot connect to Ollama. Make sure Ollama is running.',
        };
      }

      return { success: false, error: this.getNetworkErrorMessage(axiosError) };
    }
  }

  private formatModelName(id: string): string {
    // Format model name from ollama format (e.g., "llama3.2:latest" -> "Llama 3.2")
    const baseName = id.split(':')[0];
    return baseName
      .replace(/([a-z])(\d)/g, '$1 $2')
      .replace(/^./, (str) => str.toUpperCase());
  }

  private estimateContext(paramSize: string): number {
    // Rough context estimates based on parameter size
    const size = paramSize.toLowerCase();
    if (size.includes('70b') || size.includes('65b')) return 8192;
    if (size.includes('13b') || size.includes('14b')) return 4096;
    if (size.includes('7b') || size.includes('8b')) return 4096;
    if (size.includes('3b')) return 2048;
    return 2048;
  }

  private handleApiError(error: AxiosError): ApiResponse {
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: {
          message: 'Cannot connect to Ollama. Make sure Ollama is running.',
          code: 'CONNECTION_REFUSED',
          retryable: true,
        },
      };
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return {
        success: false,
        error: {
          message: 'Network error. Check your Ollama configuration.',
          code: 'NETWORK_ERROR',
          retryable: true,
        },
      };
    }

    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data as any;

      if (status === 404) {
        return {
          success: false,
          error: {
            message: 'Model not found. Make sure the model is downloaded in Ollama.',
            code: 'MODEL_NOT_FOUND',
          },
        };
      }

      return {
        success: false,
        error: {
          message: errorData?.error || `Ollama error: ${error.response.statusText}`,
          code: `HTTP_${status}`,
        },
      };
    }

    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: {
          message: 'Request timeout. The model may be loading or processing.',
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
    if (error.code === 'ECONNREFUSED') {
      return 'Connection refused. Make sure Ollama is running.';
    }
    if (error.code === 'ENOTFOUND') {
      return 'Host not found. Check the Ollama URL.';
    }
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return 'Connection timed out. Try again.';
    }
    const errorDetail = error.code ? ` (${error.code})` : '';
    return `Connection error${errorDetail}.`;
  }
}

export const ollamaProvider = new OllamaProvider();
