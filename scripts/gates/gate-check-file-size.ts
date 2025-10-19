#!/usr/bin/env node

/**
 * File Size Checker
 *
 * Prevents large files from being committed to the repository.
 * Large files are harder for agents to edit and humans to maintain.
 *
 * Limits:
 * - JSON: 500 lines (use YAML instead)
 * - Markdown: 800 lines (split into multiple docs)
 * - JavaScript: 600 lines (split into modules)
 * - YAML: 400 lines (split by category)
 * - Default: 1000 lines
 *
 * Usage:
 *   node scripts/gate-check-file-size.js [--staged]
 *
 * Exit Codes:
 *   0 - All files within limits
 *   1 - One or more files exceed limits
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SIZE_LIMITS = {
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

// ============================================================================
// FILE DISCOVERY
// ============================================================================

function getAllFiles(stagedOnly = false) {
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

  // Get all tracked files
  try {
    const output = execSync('git ls-files', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    // Fall back to recursive directory scan
    return scanDirectory('.');
  }
}

function scanDirectory(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);

    // Skip node_modules, .git, etc.
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

function isException(file) {
  return EXCEPTIONS.some(pattern => {
    // Simple glob matching
    const regex = pattern.replace(/\./g, '\\.').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
    return new RegExp(`^${regex}$`).test(file);
  });
}

// ============================================================================
// SIZE CHECKING
// ============================================================================

function countLines(file) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

function getSizeLimit(file) {
  const ext = path.extname(file);
  return SIZE_LIMITS[ext] || SIZE_LIMITS.default;
}

function getSplitSuggestions(file) {
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

// ============================================================================
// REPORTING
// ============================================================================

class Results {
  constructor() {
    this.violations = [];
    this.checked = 0;
  }

  addViolation(file, lines, limit) {
    this.violations.push({
      file,
      lines,
      limit,
      excess: lines - limit,
      suggestions: getSplitSuggestions(file),
    });
  }

  hasViolations() {
    return this.violations.length > 0;
  }

  print() {
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

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const stagedOnly = args.includes('--staged');

  const files = getAllFiles(stagedOnly);
  const results = new Results();

  for (const file of files) {
    // Skip exceptions
    if (isException(file)) {
      continue;
    }

    // Skip if file doesn't exist (could be deleted)
    if (!fs.existsSync(file)) {
      continue;
    }

    // Skip directories
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
}

// Run if called directly (ESM check)
const isMain =
  process.argv[1] &&
  (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1]));
if (isMain) {
  main();
}

export { countLines, getSizeLimit, getSplitSuggestions };
