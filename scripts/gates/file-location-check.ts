#!/usr/bin/env node

/**
 * File Location Validator
 *
 * Enforces project structure rules by checking that files are in their correct locations.
 * Prevents session-specific files from being committed to the root directory.
 *
 * Usage:
 *   node scripts/file-location-check.js [--fix]
 *
 * Options:
 *   --fix   Suggest commands to move misplaced files
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// CONFIGURATION: What's allowed where
// ============================================================================

const ALLOWED_ROOT_FILES = [
  'README.md',
  'STATUS.md',
  'AGENTS.md',
  'LICENSE',
  'LICENSE.md',
  '.gitignore',
  'opencode.json',
  'package.json',
  'package-lock.json',
  '.npmrc',
  '.nvmrc',
  'tsconfig.json',
  'vitest.config.ts',
  'biome.json',
];

const ALLOWED_ROOT_DIRS = [
  '.git',
  '.github',
  '.opencode',
  'docs',
  'tests',
  'evals',
  'scripts',
  'node_modules',
  'src',
  'lib',
  'dist',
  'build',
];

const FORBIDDEN_ROOT_PATTERNS = [
  /SESSION.*\.md$/i,
  /NOTES.*\.md$/i,
  /PROGRESS.*\.md$/i,
  /DRAFT.*\.md$/i,
  /WIP.*\.md$/i,
  /TODO.*\.md$/i,
  /TEMP.*\.md$/i,
  /\.tmp$/i,
  /\.temp$/i,
];

const CORRECT_LOCATIONS = {
  SESSION: 'docs/phases/phase-X.Y/',
  NOTES: 'docs/phases/phase-X.Y/',
  PROGRESS: 'docs/phases/phase-X.Y/',
  DRAFT: 'docs/phases/phase-X.Y/',
  WIP: 'docs/phases/phase-X.Y/',
  TODO: 'docs/phases/phase-X.Y/',
};

// ============================================================================
// MAIN LOGIC
// ============================================================================

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Legacy function, will refactor in migration
function checkFileLocations(fix = false): boolean {
  console.log('🔍 Checking file locations...\n');

  const violations: Array<{ file: string; type: string; reason: string; suggestion?: string }> = [];
  let rootFiles: string[];

  try {
    rootFiles = fs.readdirSync('.');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error reading root directory:', errorMessage);
    process.exit(1);
  }

  // Check each file in root
  for (const file of rootFiles) {
    const isDirectory = fs.statSync(file).isDirectory();

    if (isDirectory) {
      // Check if directory is allowed
      if (!ALLOWED_ROOT_DIRS.includes(file) && !file.startsWith('.')) {
        violations.push({
          file,
          type: 'directory',
          reason: 'Unexpected directory in root',
        });
      }
    } else {
      // Check if file matches forbidden patterns
      const isForbidden = FORBIDDEN_ROOT_PATTERNS.some(pattern => pattern.test(file));

      if (isForbidden) {
        const suggestion = getSuggestion(file);
        violations.push({
          file,
          type: 'forbidden',
          reason: 'Session/temporary file in root',
          suggestion,
        });
      } else if (!ALLOWED_ROOT_FILES.includes(file) && !file.startsWith('.')) {
        // Check if it's an unexpected file
        violations.push({
          file,
          type: 'unexpected',
          reason: 'File not in whitelist',
        });
      }
    }
  }

  // Report results
  if (violations.length === 0) {
    console.log('✅ All files are in correct locations\n');
    return true;
  } else {
    console.log(`❌ Found ${violations.length} file location violation(s):\n`);

    violations.forEach((v, i) => {
      console.log(`${i + 1}. ${v.file}`);
      console.log(`   Reason: ${v.reason}`);

      if (v.suggestion) {
        console.log(`   Correct location: ${v.suggestion}`);

        if (fix) {
          console.log(`   Fix: git mv ${v.file} ${v.suggestion}`);
        }
      }
      console.log('');
    });

    if (fix) {
      console.log('💡 Run the suggested "git mv" commands above to fix.\n');
    } else {
      console.log('💡 Run with --fix flag to see move commands.\n');
    }

    return false;
  }
}

function getSuggestion(filename: string): string {
  // Determine correct location based on filename pattern
  for (const [pattern, location] of Object.entries(CORRECT_LOCATIONS)) {
    if (filename.toUpperCase().includes(pattern)) {
      return location + filename;
    }
  }

  return `docs/${filename}`;
}

// ============================================================================
// CHECK STAGED FILES (for pre-commit hook)
// ============================================================================

function checkStagedFiles(): boolean {
  console.log('🔍 Checking staged files...\n');

  let stagedFiles: string[];
  try {
    const output = execSync('git diff --cached --name-only', {
      encoding: 'utf8',
    });
    stagedFiles = output
      .trim()
      .split('\n')
      .filter(f => f);
  } catch {
    console.log('⚠️  Not a git repository or no staged files\n');
    return true;
  }
  if (stagedFiles.length === 0) {
    console.log('ℹ️  No staged files to check\n');
    return true;
  }

  const violations = [];

  for (const file of stagedFiles) {
    // Check if file is in root (doesn't contain a slash)
    if (!file.includes('/')) {
      // Check if it matches forbidden patterns
      const filename = path.basename(file);
      const isForbidden = FORBIDDEN_ROOT_PATTERNS.some(pattern => pattern.test(filename));

      if (isForbidden) {
        const suggestion = getSuggestion(filename);
        violations.push({
          file,
          suggestion,
        });
      } else if (!ALLOWED_ROOT_FILES.includes(filename) && !filename.startsWith('.')) {
        violations.push({
          file,
          suggestion: 'Check if this should be in a subdirectory',
        });
      }
    }
  }

  if (violations.length === 0) {
    console.log('✅ All staged files are in correct locations\n');
    return true;
  } else {
    console.log(`❌ Found ${violations.length} staged file(s) in wrong location:\n`);

    violations.forEach((v, i) => {
      console.log(`${i + 1}. ${v.file}`);
      console.log(`   Should be: ${v.suggestion}\n`);
    });

    return false;
  }
}

// ============================================================================
// CLI
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const staged = args.includes('--staged');

  console.log('═══════════════════════════════════════════════════════');
  console.log('  File Location Validator - OpenCode Agents');
  console.log('═══════════════════════════════════════════════════════\n');

  let success: boolean;

  if (staged) {
    success = checkStagedFiles();
  } else {
    success = checkFileLocations(fix);
  }

  if (success) {
    process.exit(0);
  } else {
    console.log('❌ File location check failed');
    console.log('   Fix violations before committing\n');
    process.exit(1);
  }
}

// Run if called directly (ESM check)
const isMain =
  process.argv[1] &&
  (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1]));
if (isMain) {
  main();
}

export { checkFileLocations, checkStagedFiles };
