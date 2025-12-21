// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Provider Adapter Interface
// Defines the contract for all AI provider implementations

import { ApiResponse, ProviderConfig, ProviderInfo } from '../../../shared/types';

/**
 * Request parameters for processing text
 */
export interface ProviderRequest {
  model: string;
  prompt: string;
  temperature?: number;
}

/**
 * Model information returned from provider
 */
export interface ProviderModel {
  id: string;
  name: string;
  contextLength?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

/**
 * Result of testing provider connection
 */
export interface ConnectionTestResult {
  success: boolean;
  error?: string;
}

/**
 * Result of fetching available models
 */
export interface ModelsResult {
  success: boolean;
  data?: ProviderModel[];
  error?: string;
}

/**
 * Provider Adapter Interface
 * All provider implementations must implement this interface
 */
export interface ProviderAdapter {
  /**
   * Provider identifier
   */
  readonly id: string;

  /**
   * Static information about the provider
   */
  readonly info: ProviderInfo;

  /**
   * Test the connection/credentials for this provider
   */
  testConnection(config: ProviderConfig): Promise<ConnectionTestResult>;

  /**
   * Process a text completion request
   */
  processRequest(config: ProviderConfig, request: ProviderRequest): Promise<ApiResponse>;

  /**
   * Get available models from this provider
   */
  getAvailableModels(config: ProviderConfig): Promise<ModelsResult>;
}
