# Testing Guide for Developers

This document provides information about the testing infrastructure and how to run tests for Compose Booster.

## Table of Contents

- [Testing Framework](#testing-framework)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Mocking Electron APIs](#mocking-electron-apis)
- [Coverage Reports](#coverage-reports)
- [Future: E2E Testing](#future-e2e-testing)

## Testing Framework

Compose Booster uses [Vitest](https://vitest.dev/) as the testing framework with the following configuration:

- **Test Environment**: jsdom (for DOM testing)
- **Global Test Utilities**: Available globally (describe, it, expect, etc.)
- **Coverage Provider**: v8
- **Setup File**: `tests/setup.ts` (global mocks and configuration)

## Running Tests

### Watch Mode (Recommended for Development)

Run tests in watch mode, which automatically re-runs tests when files change:

```bash
npm test
```

### Run Once

Execute all tests once and exit:

```bash
npm run test:run
```

### Interactive UI

Open the Vitest UI for an interactive testing experience:

```bash
npm run test:ui
```

This opens a web interface at `http://localhost:51204/__vitest__/` where you can:
- View test results in a graphical interface
- Filter tests by file or test name
- See detailed error messages and stack traces
- View code coverage

### Coverage Report

Generate a code coverage report:

```bash
npm run test:coverage
```

Coverage reports are generated in multiple formats:
- **Text**: Printed to console
- **HTML**: Opens in browser at `coverage/index.html`
- **JSON**: Machine-readable format at `coverage/coverage-final.json`

## Test Structure

Tests are organized in the `tests/` directory:

```
tests/
├── setup.ts                           # Global test setup and mocks
├── services/
│   └── apiService.test.ts            # API service logic tests
├── utils/
│   └── costCalculation.test.ts       # Cost calculation tests
└── types/
    └── validation.test.ts            # Type structure validation tests
```

### Current Test Coverage

As of the latest implementation, we have **53 passing unit tests** covering:

1. **API Service** (18 tests)
   - Prompt building with variable substitution (`${content}`, `${tone}`, `${date}`)
   - Template validation (requiring `${content}`)
   - API key validation
   - Mock mode functionality

2. **Cost Calculation** (18 tests)
   - Cost tier classification (Low/Medium/High)
   - Edge cases for threshold boundaries
   - Cost-per-million formatting

3. **Type Validation** (17 tests)
   - Model structure validation
   - Prompt structure validation (Record vs Array)
   - Tone structure validation
   - HotCombo structure validation
   - Config structure integrity

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { apiService } from '../../src/main/services/apiService';

describe('FeatureName', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test input';

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Testing Async Functions

```typescript
it('should handle async operations', async () => {
  apiService.setMockMode(true);

  const result = await apiService.testApiKey('sk-test-key');

  expect(result.valid).toBe(true);
});
```

### Testing Error Cases

```typescript
it('should handle errors gracefully', () => {
  expect(() => {
    dangerousFunction();
  }).toThrow('Expected error message');
});
```

## Mocking Electron APIs

Since Electron APIs are not available in the test environment, we provide mocks in `tests/setup.ts`:

### Available Mocks

```typescript
// Mock window.electronAPI for renderer tests
global.window = {
  electronAPI: {
    getConfig: vi.fn(),
    setConfig: vi.fn(),
    testApiKey: vi.fn(),
    processEmail: vi.fn(),
    getAvailableModels: vi.fn(),
    onConfigUpdated: vi.fn(),
  },
} as any;
```

### Using Mocks in Tests

```typescript
import { vi } from 'vitest';

it('should call Electron API', async () => {
  // Setup mock return value
  const mockConfig = { apiKey: 'test-key' };
  window.electronAPI.getConfig = vi.fn().mockResolvedValue({
    success: true,
    data: mockConfig,
  });

  // Test code that calls the API
  const result = await window.electronAPI.getConfig();

  // Verify
  expect(result.data).toEqual(mockConfig);
  expect(window.electronAPI.getConfig).toHaveBeenCalled();
});
```

## Coverage Reports

### Interpreting Coverage

Coverage reports show:

- **Statements**: Percentage of code statements executed
- **Branches**: Percentage of conditional branches taken
- **Functions**: Percentage of functions called
- **Lines**: Percentage of code lines executed

### Coverage Thresholds

Currently, no minimum coverage thresholds are enforced. Focus on:

1. **Critical Business Logic**: API service, config management, prompt building
2. **Edge Cases**: Error handling, boundary conditions
3. **Data Transformations**: Type conversions, validation

### Viewing HTML Coverage Report

After running `npm run test:coverage`, open `coverage/index.html` in a browser to see:

- File-by-file coverage breakdown
- Line-by-line coverage highlighting (green = covered, red = uncovered)
- Branch coverage details

## Testing Best Practices

### 1. Use Descriptive Test Names

```typescript
// ✅ Good
it('should replace ${content} variable with email content', () => {});

// ❌ Bad
it('works', () => {});
```

### 2. Test One Thing Per Test

```typescript
// ✅ Good
it('should replace ${content} variable', () => {});
it('should replace ${tone} variable', () => {});

// ❌ Bad
it('should replace all variables', () => {
  // Tests ${content}, ${tone}, and ${date} all at once
});
```

### 3. Use Arrange-Act-Assert Pattern

```typescript
it('should calculate cost tier correctly', () => {
  // Arrange
  const inputCost = 0.000003;

  // Act
  const tier = calculateCostTier(inputCost);

  // Assert
  expect(tier).toBe('Low');
});
```

### 4. Test Edge Cases

```typescript
it('should handle empty API key', async () => {
  const result = await apiService.testApiKey('');
  expect(result.valid).toBe(false);
  expect(result.error).toBe('API key is empty');
});

it('should handle whitespace-only API key', async () => {
  const result = await apiService.testApiKey('   ');
  expect(result.valid).toBe(false);
});
```

### 5. Use Mock Mode for API Tests

```typescript
beforeEach(() => {
  apiService.setMockMode(true); // Avoid hitting real API
});
```

## Future: E2E Testing

**Status**: TODO - Planned for post-launch

We plan to implement end-to-end testing using [Playwright for Electron](https://playwright.dev/docs/api/class-electron).

### Planned E2E Test Coverage

1. **Main Window Workflow**
   - Paste email → Select model/prompt/tone → Process → Verify output
   - Hot combo buttons (Ctrl+1/2/3)
   - Keyboard shortcuts (Ctrl+Enter, Ctrl+K, etc.)
   - Clipboard operations

2. **Settings Window**
   - Open/close settings
   - Modify models/prompts/tones
   - Verify changes persist
   - Verify main window updates after settings change

3. **Error Scenarios**
   - Invalid API key handling
   - Network errors
   - Empty input validation
   - Rate limiting

4. **Cross-Platform Testing**
   - Windows-specific behaviors
   - macOS-specific behaviors (Cmd vs Ctrl)
   - Window management on multi-monitor setups

### Installation (Future)

```bash
npm install --save-dev @playwright/test playwright
```

### E2E Test Structure (Future)

```
tests/
├── e2e/
│   ├── main-window.spec.ts
│   ├── settings-window.spec.ts
│   ├── hot-combos.spec.ts
│   ├── keyboard-shortcuts.spec.ts
│   └── error-handling.spec.ts
└── fixtures/
    ├── test-emails.ts
    └── mock-responses.ts
```

## Troubleshooting

### Tests Fail to Import Modules

Ensure `vitest.config.ts` has the correct path aliases:

```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Electron API Mocks Not Working

Check that `tests/setup.ts` is specified in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
  },
});
```

### Coverage Report Missing Files

Add include patterns to coverage configuration:

```typescript
coverage: {
  include: ['src/**/*.ts'],
  exclude: ['src/**/*.test.ts', 'src/**/types.ts'],
}
```

## Contributing

When adding new features:

1. **Write tests first** (TDD approach recommended)
2. **Aim for >80% coverage** of new code
3. **Test edge cases** and error conditions
4. **Update this document** if adding new test patterns or utilities

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vitest API Reference](https://vitest.dev/api/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Playwright for Electron](https://playwright.dev/docs/api/class-electron) (future)
