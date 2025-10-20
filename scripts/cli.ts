#!/usr/bin/env node

/**
 * OpenCode Agents CLI
 *
 * Unified command-line interface for project management, validation,
 * and automated agent operations.
 *
 * Usage:
 *   opencode <command> [options] [args]
 *
 * Commands:
 *   gates              Run quality gates and pre-merge checks
 *   validate           Validate project structure and conventions
 *   blog               Manage blog posts and metadata
 *   help               Show help for a command
 */

import { defineCommand, defineConfig, defineOptions, processConfig } from '@robingenz/zli';
import { z } from 'zod';
import { blogCommand as BlogCommandModule } from './commands/blog.js';
import { fileSizeCheckCommand } from './commands/file-size-check.js';

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS & TYPES
// ═══════════════════════════════════════════════════════════════════════════

const GatesCommand = defineCommand({
  description: 'Run repository quality gates',
  options: defineOptions(
    z.object({
      staged: z.boolean().default(false).describe('Check only staged files'),
      check: z
        .enum(['fileSize', 'fileLocation', 'preMerge', 'all'])
        .default('all')
        .describe('Which gate to run'),
    }),
    { s: 'staged', c: 'check' },
  ),
  action: fileSizeCheckCommand.action,
});

const ValidateCommand = defineCommand({
  description: 'Validate project structure and conventions',
  options: defineOptions(
    z.object({
      type: z
        .enum(['conventions', 'versions', 'state', 'all'])
        .default('all')
        .describe('Type of validation to run'),
      fix: z.boolean().default(false).describe('Auto-fix issues'),
    }),
    { t: 'type', f: 'fix' },
  ),
  action: async options => {
    console.log(`Running validation: type=${options.type}, fix=${options.fix}`);
    // Will be replaced with actual validation implementations
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// CLI CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const config = defineConfig({
  meta: {
    name: 'opencode',
    version: '1.0.0',
    description: 'OpenCode Agents CLI - Unified project management tool',
  },
  commands: {
    gates: GatesCommand,
    validate: ValidateCommand,
    blog: BlogCommandModule,
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  try {
    const result = processConfig(config, process.argv.slice(2));
    await result.command.action(result.options, result.args);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.error('❌ An unexpected error occurred');
    }
    process.exit(1);
  }
}

main();
