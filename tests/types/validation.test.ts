import { describe, it, expect } from 'vitest';
import type { Model, Prompt, Tone, QuickAction, AppConfig } from '../../src/shared/types';

/**
 * Tests for type validation and data structure integrity
 */
describe('Type Validation', () => {
  describe('Model validation', () => {
    it('should validate a complete model object', () => {
      const model: Model = {
        id: 'test-model',
        name: 'Test Model',
        cost: 'Medium',
        enabled: true,
      };

      expect(model.id).toBeDefined();
      expect(model.name).toBeDefined();
      expect(['Low', 'Medium', 'High']).toContain(model.cost);
      expect(typeof model.enabled).toBe('boolean');
    });

    it('should validate model with cost details', () => {
      const model: Model = {
        id: 'test-model',
        name: 'Test Model',
        cost: 'High',
        costDetails: {
          input: '$10.00/M',
          output: '$30.00/M',
        },
        enabled: true,
      };

      expect(model.costDetails).toBeDefined();
      expect(model.costDetails?.input).toMatch(/\$[\d.]+\/M/);
      expect(model.costDetails?.output).toMatch(/\$[\d.]+\/M/);
    });

    it('should validate default model flag', () => {
      const model: Model = {
        id: 'default-model',
        name: 'Default Model',
        cost: 'Low',
        enabled: true,
        isDefault: true,
      };

      expect(model.isDefault).toBe(true);
    });
  });

  describe('Prompt validation', () => {
    it('should validate a basic prompt', () => {
      const prompt: Prompt = {
        name: 'Test Prompt',
        text: 'Improve this email: ${content}',
      };

      expect(prompt.name).toBeDefined();
      expect(prompt.text).toContain('${content}');
    });

    it('should validate prompt must contain ${content} variable', () => {
      const validPrompt: Prompt = {
        name: 'Valid',
        text: 'Process: ${content}',
      };

      const invalidPrompt = {
        name: 'Invalid',
        text: 'Process this email', // Missing ${content}
      };

      expect(validPrompt.text).toContain('${content}');
      expect(invalidPrompt.text).not.toContain('${content}');
    });

    it('should validate prompt with multiple variables', () => {
      const prompt: Prompt = {
        name: 'Complex Prompt',
        text: 'On ${date}, please ${tone} improve: ${content}',
      };

      expect(prompt.text).toContain('${content}');
      expect(prompt.text).toContain('${tone}');
      expect(prompt.text).toContain('${date}');
    });
  });

  describe('Tone validation', () => {
    it('should validate a basic tone', () => {
      const tone: Tone = {
        id: 'formal',
        name: 'Formal',
        description: 'in a formal and professional manner',
      };

      expect(tone.id).toBeDefined();
      expect(tone.name).toBeDefined();
      expect(tone.description).toBeDefined();
    });

    it('should validate tone with isDefault flag', () => {
      const tone: Tone = {
        id: 'neutral',
        name: 'Neutral',
        description: 'in a balanced tone',
        isDefault: true,
      };

      expect(tone.isDefault).toBe(true);
    });
  });

  describe('QuickAction validation', () => {
    it('should validate a complete hot combo', () => {
      const hotCombo: QuickAction = {
        name: 'Quick Polish',
        icon: '⚡',
        model: 'anthropic/claude-sonnet-4.5',
        prompt: 'polish',
        tone: 'neutral',
        position: 0,
      };

      expect(hotCombo.name).toBeDefined();
      expect(hotCombo.icon).toBeDefined();
      expect(hotCombo.model).toBeDefined();
      expect(hotCombo.prompt).toBeDefined();
      expect(hotCombo.tone).toBeDefined();
      expect(hotCombo.position).toBeGreaterThanOrEqual(0);
      expect(hotCombo.position).toBeLessThan(3);
    });

    it('should validate hot combo positions are 0-2', () => {
      const positions = [0, 1, 2];

      positions.forEach(pos => {
        const hotCombo: QuickAction = {
          name: `Combo ${pos}`,
          icon: '🎯',
          model: 'test-model',
          prompt: 'test',
          tone: 'neutral',
          position: pos,
        };

        expect(hotCombo.position).toBeGreaterThanOrEqual(0);
        expect(hotCombo.position).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('Config structure validation', () => {
    it('should validate prompts is a Record, not an array', () => {
      const config: Partial<AppConfig> = {
        prompts: {
          improve: {
            name: 'Improve',
            text: 'Improve: ${content}',
          },
          polish: {
            name: 'Polish',
            text: 'Polish: ${content}',
          },
        },
      };

      expect(config.prompts).toBeDefined();
      expect(typeof config.prompts).toBe('object');
      expect(Array.isArray(config.prompts)).toBe(false);
      expect(Object.keys(config.prompts!).length).toBe(2);
    });

    it('should validate models is an array', () => {
      const config: Partial<AppConfig> = {
        models: [
          {
            id: 'model-1',
            name: 'Model 1',
            cost: 'Low',
            enabled: true,
          },
        ],
      };

      expect(config.models).toBeDefined();
      expect(Array.isArray(config.models)).toBe(true);
      expect(config.models!.length).toBeGreaterThan(0);
    });

    it('should validate tones is an array', () => {
      const config: Partial<AppConfig> = {
        tones: [
          {
            id: 'formal',
            name: 'Formal',
            description: 'formal tone',
          },
        ],
      };

      expect(config.tones).toBeDefined();
      expect(Array.isArray(config.tones)).toBe(true);
    });

    it('should validate quickActions is an array of 3 items', () => {
      const config: Partial<AppConfig> = {
        quickActions: [
          { name: 'C1', icon: '⚡', model: 'm1', prompt: 'p1', tone: 't1', position: 0 },
          { name: 'C2', icon: '🎯', model: 'm2', prompt: 'p2', tone: 't2', position: 1 },
          { name: 'C3', icon: '✨', model: 'm3', prompt: 'p3', tone: 't3', position: 2 },
        ],
      };

      expect(config.quickActions).toBeDefined();
      expect(Array.isArray(config.quickActions)).toBe(true);
      expect(config.quickActions!.length).toBe(3);
    });
  });

  describe('Data transformation edge cases', () => {
    it('should handle converting prompts Record to array', () => {
      const promptsRecord: Record<string, Prompt> = {
        improve: { name: 'Improve', text: 'Improve: ${content}' },
        polish: { name: 'Polish', text: 'Polish: ${content}' },
      };

      const promptsArray = Object.entries(promptsRecord);

      expect(Array.isArray(promptsArray)).toBe(true);
      expect(promptsArray.length).toBe(2);
      expect(promptsArray[0][0]).toBe('improve'); // key
      expect(promptsArray[0][1].name).toBe('Improve'); // value
    });

    it('should handle converting prompts Record to values array', () => {
      const promptsRecord: Record<string, Prompt> = {
        improve: { name: 'Improve', text: 'Improve: ${content}' },
        polish: { name: 'Polish', text: 'Polish: ${content}' },
      };

      const promptsArray = Object.values(promptsRecord);

      expect(Array.isArray(promptsArray)).toBe(true);
      expect(promptsArray.length).toBe(2);
      expect(promptsArray[0].name).toBe('Improve');
    });

    it('should handle empty prompts Record', () => {
      const promptsRecord: Record<string, Prompt> = {};

      const promptsArray = Object.values(promptsRecord);

      expect(Array.isArray(promptsArray)).toBe(true);
      expect(promptsArray.length).toBe(0);
    });
  });
});
