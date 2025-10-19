/**
 * Phase 1.1: Hello World Test
 *
 * Baseline test to verify single-agent functionality.
 * This test validates that:
 * 1. Agent can generate a simple function
 * 2. Test harness can execute and collect metrics
 * 3. Generated code is valid and works
 * 4. Metrics meet baseline expectations
 *
 * Success Criteria (from CodeImplementer spec):
 * - Token count: < 500 tokens
 * - Execution time: < 30 seconds
 * - Step count: 1-2 steps
 * - Success rate: 100%
 */

import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { executeAgent } from '../../scripts/run-agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Phase 1.1: Single Agent Baseline', () => {
  const OUTPUT_FILE = path.join(__dirname, '../../src/hello.js');

  // Clean up before and after tests
  beforeEach(() => {
    if (fs.existsSync(OUTPUT_FILE)) {
      fs.unlinkSync(OUTPUT_FILE);
    }
  });

  afterEach(() => {
    if (fs.existsSync(OUTPUT_FILE)) {
      fs.unlinkSync(OUTPUT_FILE);
    }
  });

  describe('Hello World Function Generation', () => {
    test('agent generates valid hello function', async () => {
      const result = await executeAgent(
        'code-implementer',
        "Create a function called hello(name) that returns 'Hello, {name}!'",
        { output: OUTPUT_FILE },
      );

      // Verify execution succeeded
      expect(result.success).toBe(true);

      // Verify file was created
      expect(fs.existsSync(OUTPUT_FILE)).toBe(true);

      // Verify file has content
      const content = fs.readFileSync(OUTPUT_FILE, 'utf8');
      expect(content.length).toBeGreaterThan(0);

      // Verify code is valid JavaScript
      await expect(async () => {
        const vm = await import('node:vm');
        new vm.Script(content);
      }).resolves.not.toThrow();
    });

    test('generated function works correctly', async () => {
      const result = await executeAgent(
        'code-implementer',
        "Create a function called hello(name) that returns 'Hello, {name}!'",
        { output: OUTPUT_FILE },
      );

      expect(result.success).toBe(true);

      // Import and test the generated function
      // Use dynamic import for ES modules
      const module = await import(`file://${OUTPUT_FILE}?update=${Date.now()}`);
      const { hello } = module;

      // Test function behavior
      expect(hello('World')).toBe('Hello, World!');
      expect(hello('Alice')).toBe('Hello, Alice!');
      expect(hello('Bob')).toBe('Hello, Bob!');
    });
    test('generated code has proper documentation', async () => {
      const result = await executeAgent(
        'code-implementer',
        "Create a function called hello(name) that returns 'Hello, {name}!'",
        { output: OUTPUT_FILE },
      );

      expect(result.success).toBe(true);

      const content = fs.readFileSync(OUTPUT_FILE, 'utf8');

      // Should have JSDoc comments
      expect(content).toContain('/**');
      expect(content).toContain('@param');
      expect(content).toContain('@returns');
    });

    test('generated code exports properly', async () => {
      const result = await executeAgent(
        'code-implementer',
        "Create a function called hello(name) that returns 'Hello, {name}!'",
        { output: OUTPUT_FILE },
      );

      expect(result.success).toBe(true);

      const content = fs.readFileSync(OUTPUT_FILE, 'utf8');

      // Should have module.exports
      expect(content).toContain('module.exports');
      expect(content).toContain('hello');
    });
  });

  describe('Metrics Collection', () => {
    test('metrics are collected during execution', async () => {
      const result = await executeAgent(
        'code-implementer',
        "Create a function called hello(name) that returns 'Hello, {name}!'",
        { output: OUTPUT_FILE },
      );

      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();

      // Verify all required metrics are present
      expect(result.metrics).toHaveProperty('tokenCount');
      expect(result.metrics).toHaveProperty('executionTime');
      expect(result.metrics).toHaveProperty('stepCount');
      expect(result.metrics).toHaveProperty('successRate');
      expect(result.metrics).toHaveProperty('timestamp');
    });

    test('token count meets baseline expectation', async () => {
      const result = await executeAgent(
        'code-implementer',
        "Create a function called hello(name) that returns 'Hello, {name}!'",
        { output: OUTPUT_FILE },
      );

      expect(result.success).toBe(true);

      // Baseline: < 500 tokens
      expect(result.metrics.tokenCount).toBeLessThan(500);
    });

    test('execution time meets baseline expectation', async () => {
      const result = await executeAgent(
        'code-implementer',
        "Create a function called hello(name) that returns 'Hello, {name}!'",
        { output: OUTPUT_FILE },
      );

      expect(result.success).toBe(true);

      // Baseline: < 30 seconds (30000 ms)
      expect(result.metrics.executionTime).toBeLessThan(30000);
    });

    test('step count meets baseline expectation', async () => {
      const result = await executeAgent(
        'code-implementer',
        "Create a function called hello(name) that returns 'Hello, {name}!'",
        { output: OUTPUT_FILE },
      );

      expect(result.success).toBe(true);

      // Baseline: 1-2 steps
      expect(result.metrics.stepCount).toBeGreaterThanOrEqual(1);
      expect(result.metrics.stepCount).toBeLessThanOrEqual(2);
    });

    test('success rate is 100%', async () => {
      const result = await executeAgent(
        'code-implementer',
        "Create a function called hello(name) that returns 'Hello, {name}!'",
        { output: OUTPUT_FILE },
      );

      expect(result.success).toBe(true);

      // Baseline: 100% success rate
      expect(result.metrics.successRate).toBe(1.0);
    });
  });

  describe('Error Handling', () => {
    test('fails gracefully for invalid agent', async () => {
      const result = await executeAgent('nonexistent-agent', 'Create a function', {
        output: OUTPUT_FILE,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('collects metrics even on failure', async () => {
      const result = await executeAgent('nonexistent-agent', 'Create a function', {
        output: OUTPUT_FILE,
      });

      expect(result.success).toBe(false);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.successRate).toBe(0.0);
    });
  });
});
