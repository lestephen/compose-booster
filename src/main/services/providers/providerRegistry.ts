// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Provider Registry
// Factory/registry for managing AI provider adapters

import { ProviderId, ProviderConfig, ProviderInfo, ApiResponse } from '../../../shared/types';
import {
  ProviderAdapter,
  ProviderRequest,
  ConnectionTestResult,
  ModelsResult,
} from './providerAdapter';
import { openRouterProvider } from './openRouterProvider';
import { anthropicProvider } from './anthropicProvider';
import { openAIProvider } from './openAIProvider';
import { ollamaProvider } from './ollamaProvider';
import { openAICompatibleProvider } from './openAICompatibleProvider';

class ProviderRegistry {
  private providers: Map<ProviderId, ProviderAdapter> = new Map();

  constructor() {
    // Register all providers
    this.register(openRouterProvider);
    this.register(anthropicProvider);
    this.register(openAIProvider);
    this.register(ollamaProvider);
    this.register(openAICompatibleProvider);
  }

  /**
   * Register a provider adapter
   */
  private register(provider: ProviderAdapter): void {
    this.providers.set(provider.id as ProviderId, provider);
  }

  /**
   * Get a provider adapter by ID
   */
  getProvider(id: ProviderId): ProviderAdapter | undefined {
    return this.providers.get(id);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): ProviderAdapter[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get information about all providers
   */
  getAllProviderInfo(): ProviderInfo[] {
    return this.getAllProviders().map(p => p.info);
  }

  /**
   * Test connection for a specific provider
   */
  async testConnection(providerId: ProviderId, config: ProviderConfig): Promise<ConnectionTestResult> {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return { success: false, error: `Unknown provider: ${providerId}` };
    }
    return provider.testConnection(config);
  }

  /**
   * Process a request through the appropriate provider
   */
  async processRequest(
    providerId: ProviderId,
    config: ProviderConfig,
    request: ProviderRequest
  ): Promise<ApiResponse> {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return {
        success: false,
        error: {
          message: `Unknown provider: ${providerId}`,
          code: 'UNKNOWN_PROVIDER',
        },
      };
    }
    return provider.processRequest(config, request);
  }

  /**
   * Get available models for a specific provider
   */
  async getAvailableModels(providerId: ProviderId, config: ProviderConfig): Promise<ModelsResult> {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return { success: false, error: `Unknown provider: ${providerId}` };
    }
    return provider.getAvailableModels(config);
  }

  /**
   * Check if a provider ID is valid
   */
  isValidProvider(id: string): id is ProviderId {
    return this.providers.has(id as ProviderId);
  }
}

// Export singleton instance
export const providerRegistry = new ProviderRegistry();
