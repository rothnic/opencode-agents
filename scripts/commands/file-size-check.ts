/**
 * Gate: File Size Check
 *
 * Prevents large files from being committed to the repository.
 * Large files are harder for agents to edit and humans to maintain.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { defineCommand, defineOptions } from '@robingenz/zli';
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const SIZE_LIMITS: { [k: string]: number } = {
  '.json': 500,
  '.md': 800,
  '.js': 600,
  '.ts': 600,
  '.yaml': 400,
  '.yml': 400,
  default: 1000,
};

const EXCEPTIONS = [
  'package-lock.json',
  'test-evidence/**',
  'node_modules/**',
  '**/*.min.js',
  'dist/**',
  'build/**',
];

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

interface FileSizeViolation {
  file: string;
  lines: number;
  limit: number;
  excess: number;
  suggestions: string[];
}

class GateCheckResults {
  violations: FileSizeViolation[] = [];
  checked: number = 0;

  addViolation(file: string, lines: number, limit: number): void {
    this.violations.push({
      file,
      lines,
      limit,
      excess: lines - limit,
      suggestions: getSplitSuggestions(file),
    });
  }

  hasViolations(): boolean {
    return this.violations.length > 0;
  }

  print(): void {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  File Size Check');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    if (!this.hasViolations()) {
      console.log(`✅ All ${this.checked} files within size limits`);
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      return;
    }

    console.log(`🚨 ${this.violations.length} file(s) exceed size limits:\n`);

    for (const v of this.violations) {
      console.log(`❌ ${v.file}`);
      console.log(`   Lines: ${v.lines} (limit: ${v.limit}, excess: ${v.excess})`);
      console.log('   Suggestions:');
      for (const suggestion of v.suggestions) {
        console.log(`   - ${suggestion}`);
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('❌ FAILED');
    console.log(`${this.violations.length} file(s) exceed size limits`);
    console.log('');
    console.log('Why this matters:');
    console.log('- Large files are harder for AI agents to edit correctly');
    console.log('- Large files are harder for humans to read and maintain');
    console.log('- Large files cause slow performance in editors');
    console.log('');
    console.log('Action required:');
    console.log('Split large files before committing');
    console.log('═══════════════════════════════════════════════════════');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function getAllFiles(stagedOnly: boolean): string[] {
  if (stagedOnly) {
    try {
      const output = execSync('git diff --staged --name-only --diff-filter=ACM', {
        encoding: 'utf8',
      });
      return output.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  try {
    const output = execSync('git ls-files', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return scanDirectory('.');
  }
}

function scanDirectory(dir: string): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);

    if (item.startsWith('.') || item === 'node_modules') {
      continue;
    }

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...scanDirectory(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function isException(file: string): boolean {
  return EXCEPTIONS.some(pattern => {
    const regex = pattern.replace(/\./g, '\\.').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
    return new RegExp(`^${regex}$`).test(file);
  });
}

function countLines(file: string): number {
  try {
    const content = fs.readFileSync(file, 'utf8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

function getSizeLimit(file: string): number {
  const ext = path.extname(file);
  const maybe = SIZE_LIMITS[ext];
  if (typeof maybe === 'number') {
    return maybe;
  }

  const def = SIZE_LIMITS['default'];
  return typeof def === 'number' ? def : 1000;
}

function getSplitSuggestions(file: string): string[] {
  const ext = path.extname(file);

  if (ext === '.json') {
    return [
      'Convert to YAML (typically 20-30% smaller)',
      'Split into multiple JSON files by category',
      'Extract large arrays/objects to separate files',
    ];
  }

  if (ext === '.md') {
    return [
      'Split into multiple documents by topic',
      'Move detailed sections to separate files with links',
      'Extract long code examples to separate files',
      'Create a table of contents with links to sub-documents',
    ];
  }

  if (ext === '.js' || ext === '.ts') {
    return [
      'Split into multiple modules',
      'Extract functions into separate files',
      'Move constants/config to separate file',
      'Create separate files for each class',
    ];
  }

  if (ext === '.yaml' || ext === '.yml') {
    return [
      'Split by category (e.g., conventions-docs.yaml, conventions-code.yaml)',
      'Extract large sections to separate files',
      'Use YAML anchors and references to reduce duplication',
    ];
  }

  return ['Consider splitting this file into smaller, focused files'];
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

export const fileSizeCheckCommand = defineCommand({
  description: 'Check that files do not exceed size limits',
  options: defineOptions(
    z.object({
      staged: z.boolean().default(false).describe('Check only staged files'),
    }),
    { s: 'staged' },
  ),
  action: async options => {
    const files = getAllFiles(options.staged);
    const results = new GateCheckResults();

    for (const file of files) {
      if (isException(file)) {
        continue;
      }

      if (!fs.existsSync(file)) {
        continue;
      }

      const stat = fs.statSync(file);
      if (stat.isDirectory()) {
        continue;
      }

      results.checked++;

      const lines = countLines(file);
      const limit = getSizeLimit(file);

      if (lines > limit) {
        results.addViolation(file, lines, limit);
      }
    }

    results.print();

    process.exit(results.hasViolations() ? 1 : 0);
  },
});
