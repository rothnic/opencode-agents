import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use globals like describe, test, expect without imports
    globals: true,

    // Node environment for our scripts
    environment: 'node',

    // Test file patterns (include both .ts and .js for migration)
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts',
      'tests/**/*.test.js',
      'tests/**/*.spec.js',
    ],
    exclude: ['node_modules', 'dist', 'build', 'docs'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['scripts/**/*.ts', '.opencode/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.config.ts', '**/node_modules/**', '**/dist/**', '**/build/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // Don't watch in CI
    watch: false,

    // Don't bail on first error - run all tests to see full picture
    // bail: false,

    // Timeout for slow tests (increased for tsx execution)
    testTimeout: 30000,

    // Retry flaky tests
    retry: 0,

    // Parallel execution (default is true, but explicit for clarity)
    // Set to false or a number to limit concurrency if needed
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },

    // Reporter
    reporters: ['verbose'],
  },
});
