import { describe, it, expect } from 'vitest';

/**
 * Tests for cost tier calculation logic
 * This mirrors the logic in modelsTab.ts handleAddModel()
 */
describe('Cost Tier Calculation', () => {
  function calculateCostTier(promptCostPerToken: number): 'Low' | 'Medium' | 'High' {
    let costTier: 'Low' | 'Medium' | 'High' = 'Medium';
    if (promptCostPerToken < 0.000005) {
      costTier = 'Low';
    } else if (promptCostPerToken > 0.00001) {
      costTier = 'High';
    }
    return costTier;
  }

  function formatCostPerMillion(costPerToken: number): string {
    return `$${(costPerToken * 1000000).toFixed(2)}/M`;
  }

  describe('calculateCostTier', () => {
    it('should return Low for very cheap models', () => {
      const result = calculateCostTier(0.000001);
      expect(result).toBe('Low');
    });

    it('should return Low for models at threshold boundary (< 0.000005)', () => {
      const result = calculateCostTier(0.0000049);
      expect(result).toBe('Low');
    });

    it('should return Medium for models at lower medium threshold', () => {
      const result = calculateCostTier(0.000005);
      expect(result).toBe('Medium');
    });

    it('should return Medium for mid-range models', () => {
      const result = calculateCostTier(0.000007);
      expect(result).toBe('Medium');
    });

    it('should return Medium for models at upper medium threshold', () => {
      const result = calculateCostTier(0.00001);
      expect(result).toBe('Medium');
    });

    it('should return High for expensive models', () => {
      const result = calculateCostTier(0.000015);
      expect(result).toBe('High');
    });

    it('should return High for very expensive models', () => {
      const result = calculateCostTier(0.00003);
      expect(result).toBe('High');
    });

    it('should handle zero cost as Low', () => {
      const result = calculateCostTier(0);
      expect(result).toBe('Low');
    });
  });

  describe('formatCostPerMillion', () => {
    it('should format small costs correctly', () => {
      const result = formatCostPerMillion(0.000001);
      expect(result).toBe('$1.00/M');
    });

    it('should format medium costs correctly', () => {
      const result = formatCostPerMillion(0.00001);
      expect(result).toBe('$10.00/M');
    });

    it('should format high costs correctly', () => {
      const result = formatCostPerMillion(0.00003);
      expect(result).toBe('$30.00/M');
    });

    it('should format fractional costs correctly', () => {
      const result = formatCostPerMillion(0.0000035);
      expect(result).toBe('$3.50/M');
    });

    it('should handle zero cost', () => {
      const result = formatCostPerMillion(0);
      expect(result).toBe('$0.00/M');
    });

    it('should handle very small costs', () => {
      const result = formatCostPerMillion(0.0000008);
      expect(result).toBe('$0.80/M');
    });
  });

  describe('Real-world model examples', () => {
    it('should classify Claude 4.5 Sonnet as Medium ($3.00/M input)', () => {
      const inputCost = 3.00 / 1000000; // $3.00 per million tokens
      const tier = calculateCostTier(inputCost);
      const formatted = formatCostPerMillion(inputCost);

      expect(tier).toBe('Low');
      expect(formatted).toBe('$3.00/M');
    });

    it('should classify GPT-4 as High ($10.00/M input)', () => {
      const inputCost = 10.00 / 1000000;
      const tier = calculateCostTier(inputCost);
      const formatted = formatCostPerMillion(inputCost);

      expect(tier).toBe('Medium');
      expect(formatted).toBe('$10.00/M');
    });

    it('should classify Llama models as Low ($0.35/M input)', () => {
      const inputCost = 0.35 / 1000000;
      const tier = calculateCostTier(inputCost);
      const formatted = formatCostPerMillion(inputCost);

      expect(tier).toBe('Low');
      expect(formatted).toBe('$0.35/M');
    });

    it('should classify GPT-5 as High ($30.00/M input)', () => {
      const inputCost = 30.00 / 1000000;
      const tier = calculateCostTier(inputCost);
      const formatted = formatCostPerMillion(inputCost);

      expect(tier).toBe('High');
      expect(formatted).toBe('$30.00/M');
    });
  });
});
