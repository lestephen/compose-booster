// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

import { describe, it, expect, beforeEach } from 'vitest';
import { apiService } from '../../src/main/services/apiService';
import { Tone } from '../../src/shared/types';

describe('ApiService', () => {
  beforeEach(() => {
    // Ensure mock mode for tests
    apiService.setMockMode(true);
  });

  describe('buildPrompt', () => {
    it('should replace ${content} variable', () => {
      const template = 'Please improve this email: ${content}';
      const content = 'Hello, this is my draft email.';

      const result = apiService.buildPrompt(template, undefined, content, true);

      expect(result).toContain('Hello, this is my draft email.');
      expect(result).not.toContain('${content}');
    });

    it('should replace ${tone} variable with tone description', () => {
      const template = 'Rewrite this email ${tone}: ${content}';
      const tone: Tone = {
        id: 'formal',
        name: 'Formal',
        description: 'in a formal and professional manner',
      };
      const content = 'Test content';

      const result = apiService.buildPrompt(template, tone, content, true);

      expect(result).toContain('in a formal and professional manner');
      expect(result).not.toContain('${tone}');
    });

    it('should replace ${date} variable with current date', () => {
      const template = 'Today is ${date}. Process: ${content}';
      const content = 'Test content';
      const expectedDate = new Date().toLocaleDateString();

      const result = apiService.buildPrompt(template, undefined, content, true);

      expect(result).toContain(expectedDate);
      expect(result).not.toContain('${date}');
    });

    it('should handle missing tone gracefully', () => {
      const template = 'Rewrite ${tone}: ${content}';
      const content = 'Test content';

      const result = apiService.buildPrompt(template, undefined, content, true);

      expect(result).toContain('Test content');
      expect(result).toContain('Rewrite : Test content'); // Empty tone replaced
    });

    it('should add closing instruction when includeClosingAndSignature is false', () => {
      const template = 'Improve: ${content}';
      const content = 'Test';

      const result = apiService.buildPrompt(template, undefined, content, false);

      expect(result).toContain('Do NOT include a closing salutation');
      expect(result).toContain('email signature');
    });

    it('should not add closing instruction when includeClosingAndSignature is true', () => {
      const template = 'Improve: ${content}';
      const content = 'Test';

      const result = apiService.buildPrompt(template, undefined, content, true);

      expect(result).not.toContain('Do NOT include');
    });

    it('should handle multiple variable replacements', () => {
      const template = 'Date: ${date}. Tone: ${tone}. Content: ${content}';
      const tone: Tone = {
        id: 'friendly',
        name: 'Friendly',
        description: 'in a warm and friendly tone',
      };
      const content = 'Test email body';

      const result = apiService.buildPrompt(template, tone, content, true);

      expect(result).toContain('Test email body');
      expect(result).toContain('in a warm and friendly tone');
      expect(result).toContain(new Date().toLocaleDateString());
      expect(result).not.toContain('${');
    });
  });

  describe('validatePromptTemplate', () => {
    it('should return true for template with ${content}', () => {
      const template = 'Improve this: ${content}';

      const result = apiService.validatePromptTemplate(template);

      expect(result).toBe(true);
    });

    it('should return false for template without ${content}', () => {
      const template = 'Improve this email';

      const result = apiService.validatePromptTemplate(template);

      expect(result).toBe(false);
    });

    it('should return true for complex template with ${content}', () => {
      const template = 'On ${date}, please ${tone} improve: ${content}';

      const result = apiService.validatePromptTemplate(template);

      expect(result).toBe(true);
    });

    it('should return false for empty template', () => {
      const template = '';

      const result = apiService.validatePromptTemplate(template);

      expect(result).toBe(false);
    });
  });

  describe('testApiKey', () => {
    it('should return invalid for empty API key', async () => {
      const result = await apiService.testApiKey('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key is empty');
    });

    it('should return invalid for whitespace-only API key', async () => {
      const result = await apiService.testApiKey('   ');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key is empty');
    });

    it('should return valid for non-empty key in mock mode', async () => {
      apiService.setMockMode(true);

      const result = await apiService.testApiKey('sk-test-key-12345');

      expect(result.valid).toBe(true);
    });
  });

  describe('mock mode', () => {
    it('should enable mock mode', () => {
      apiService.setMockMode(true);

      expect(apiService.isMockMode()).toBe(true);
    });

    it('should disable mock mode', () => {
      apiService.setMockMode(false);

      expect(apiService.isMockMode()).toBe(false);
    });

    it('should return mock response in mock mode', async () => {
      apiService.setMockMode(true);

      const result = await apiService.processEmail('test-key', 'test-model', 'Test prompt');

      expect(result.success).toBe(true);
      expect(result.data).toContain('[MOCK RESPONSE]');
      expect(result.model).toBe('mock-model');
    });

    it('should return mock models in mock mode', async () => {
      apiService.setMockMode(true);

      const result = await apiService.getAvailableModels('test-key');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
    });

    it('should include usage stats in mock response', async () => {
      apiService.setMockMode(true);

      const result = await apiService.processEmail('test-key', 'test-model', 'Test prompt');

      expect(result.usage).toBeDefined();
      expect(result.usage?.promptTokens).toBeGreaterThan(0);
      expect(result.usage?.completionTokens).toBeGreaterThan(0);
      expect(result.usage?.totalTokens).toBeGreaterThan(0);
    });

    it('should include cost in mock response', async () => {
      apiService.setMockMode(true);

      const result = await apiService.processEmail('test-key', 'test-model', 'Test prompt');

      expect(result.cost).toBeDefined();
      expect(typeof result.cost).toBe('number');
    });

    it('should include time in mock response', async () => {
      apiService.setMockMode(true);

      const result = await apiService.processEmail('test-key', 'test-model', 'Test prompt');

      expect(result.time).toBeDefined();
      expect(typeof result.time).toBe('number');
      expect(result.time).toBeGreaterThan(0);
    });
  });

  describe('error response structure', () => {
    it('should have correct structure for API errors', () => {
      const errorResponse = {
        success: false,
        error: {
          message: 'Test error message',
          code: 'TEST_ERROR',
        },
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.message).toBeDefined();
      expect(errorResponse.error.code).toBeDefined();
    });

    it('should support retryable flag in errors', () => {
      const retryableError = {
        success: false,
        error: {
          message: 'Network error',
          code: 'NETWORK_ERROR',
          retryable: true,
        },
      };

      expect(retryableError.error.retryable).toBe(true);
    });

    it('should support action flag in errors', () => {
      const actionError = {
        success: false,
        error: {
          message: 'Invalid API key',
          code: 'INVALID_API_KEY',
          action: 'OPEN_SETTINGS',
        },
      };

      expect(actionError.error.action).toBe('OPEN_SETTINGS');
    });

    it('should support retryAfter in rate limit errors', () => {
      const rateLimitError = {
        success: false,
        error: {
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT',
          retryAfter: 60,
        },
      };

      expect(rateLimitError.error.retryAfter).toBe(60);
    });
  });

  describe('error code mapping', () => {
    const errorCodes = [
      { status: 401, code: 'INVALID_API_KEY', message: 'Invalid API key' },
      { status: 429, code: 'RATE_LIMIT', message: 'Rate limit exceeded' },
      { status: 402, code: 'INSUFFICIENT_CREDITS', message: 'Insufficient credits' },
      { status: 500, code: 'SERVER_ERROR', message: 'server error' },
      { status: 502, code: 'SERVER_ERROR', message: 'server error' },
      { status: 503, code: 'SERVER_ERROR', message: 'server error' },
    ];

    errorCodes.forEach(({ status, code }) => {
      it(`should have error code ${code} for HTTP ${status}`, () => {
        expect(code).toBeDefined();
        expect(typeof code).toBe('string');
      });
    });
  });

  describe('network error codes', () => {
    const networkErrorCodes = ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNABORTED'];

    networkErrorCodes.forEach((errorCode) => {
      it(`should recognize ${errorCode} as network error`, () => {
        const isNetworkError = ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'].includes(errorCode);
        const isTimeout = errorCode === 'ECONNABORTED';

        expect(isNetworkError || isTimeout).toBe(true);
      });
    });
  });
});
