#!/usr/bin/env node

/**
 * Documentation Conventions Validator
 *
 * Validates documentation files against project conventions defined in
 * .opencode/conventions.json. Checks file naming, location, and organization.
 *
 * Usage:
 *   node scripts/docs-conventions.js [--fix] [--warnings]
 *
 * Options:
 *   --fix        Automatically fix issues when possible
 *   --warnings   Show warnings in addition to errors
 *   --staged     Only check staged files (for pre-commit)
 *
 * Exit Codes:
 *   0 - All conventions followed
 *   1 - Convention violations found
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONVENTIONS_FILE = '.opencode/conventions.json';
const DOCS_DIR = 'docs';

// ============================================================================
// LOAD CONVENTIONS
// ============================================================================

function loadConventions() {
  if (!fs.existsSync(CONVENTIONS_FILE)) {
    console.error(`❌ Conventions file not found: ${CONVENTIONS_FILE}`);
    process.exit(1);
  }

  try {
    return JSON.parse(fs.readFileSync(CONVENTIONS_FILE, 'utf8'));
  } catch (error) {
    console.error(`❌ Invalid conventions file: ${error.message}`);
    process.exit(1);
  }
}

// ============================================================================
// FILE DISCOVERY
// ============================================================================

function getAllDocFiles() {
  const files = [];

  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  if (fs.existsSync(DOCS_DIR)) {
    scan(DOCS_DIR);
  }

  return files;
}

function getStagedDocFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8',
    });

    return output.split('\n').filter(f => f.startsWith(DOCS_DIR) && f.endsWith('.md'));
  } catch {
    return [];
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

class ValidationResult {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
  }

  addError(file, rule, message, fix = null) {
    this.errors.push({ file, rule, message, fix });
  }

  addWarning(file, rule, message, fix = null) {
    this.warnings.push({ file, rule, message, fix });
  }

  hasIssues() {
    return this.errors.length > 0;
  }
}

function validateFile(file, conventions, results) {
  const rules = conventions.documentation.fileOrganization.rules;

  for (const rule of rules) {
    // Check if file matches rule pattern
    const pattern = new RegExp(rule.pattern);
    if (!pattern.test(file)) {
      continue;
    }

    // Check if file is excluded
    if (rule.exclude) {
      const excluded = rule.exclude.some(ex => new RegExp(ex).test(file));
      if (excluded) {
        continue;
      }
    }

    // Apply rule validation
    const isValid = applyRule(file, rule);

    if (!isValid) {
      const fix = generateFix(file, rule);

      if (rule.level === 'error') {
        results.addError(file, rule.id, rule.message, fix);
      } else if (rule.level === 'warning') {
        results.addWarning(file, rule.id, rule.message, fix);
      }
    }
  }
}

function applyRule(file, rule) {
  switch (rule.id) {
    case 'docs-root-limited': {
      // Check if file is in docs root
      const relativePath = path.relative('docs', file);
      if (relativePath.includes('/')) {
        return true; // Not in root
      }

      const basename = path.basename(file);
      return rule.allowed.includes(basename);
    }

    case 'consistent-naming':
    case 'no-mixed-case': {
      const basename = path.basename(file);
      const validator = new RegExp(rule.validator);
      return validator.test(basename);
    }

    case 'blog-numbering': {
      const basename = path.basename(file);
      const validator = new RegExp(rule.validator);
      return validator.test(basename);
    }

    case 'phase-structure': {
      const dirname = path.basename(path.dirname(file));
      const validator = new RegExp(rule.validator);
      return validator.test(dirname);
    }

    case 'template-suffix': {
      const basename = path.basename(file);
      const validator = new RegExp(rule.validator);
      return validator.test(basename);
    }

    default:
      return true;
  }
}

function generateFix(file, rule) {
  if (!rule.autofix || !rule.autofix.enabled) {
    return null;
  }

  const basename = path.basename(file);
  const dirname = path.dirname(file);

  switch (rule.autofix.strategy) {
    case 'suggest-directory': {
      // Analyze file content to suggest directory
      const content = fs.readFileSync(file, 'utf8');
      const suggestion = suggestDirectory(content, basename);
      return {
        type: 'move',
        from: file,
        to: path.join('docs', suggestion.dir, suggestion.name),
        reason: suggestion.reason,
      };
    }

    case 'lowercase-dasherize': {
      const newName = basename
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')
        .replace(/--+/g, '-');

      return {
        type: 'rename',
        from: file,
        to: path.join(dirname, newName),
        reason: 'Convert to lowercase-with-dashes',
      };
    }

    case 'add-suffix': {
      const name = basename.replace('.md', '');
      const newName = `${name}-template.md`;
      return {
        type: 'rename',
        from: file,
        to: path.join(dirname, newName),
        reason: 'Add -template suffix',
      };
    }

    default:
      return null;
  }
}

function suggestDirectory(content, basename) {
  const lower = content.toLowerCase();

  // Check for architecture keywords
  if (
    lower.includes('architecture') ||
    lower.includes('design') ||
    lower.includes('system') ||
    basename.includes('gates')
  ) {
    return {
      dir: 'architecture',
      name: basename
        .toLowerCase()
        .replace(/[A-Z-]/g, m => (m === '-' ? '-' : `-${m.toLowerCase()}`)),
      reason: 'Contains architecture/design content',
    };
  }

  // Check for planning keywords
  if (lower.includes('plan') || lower.includes('roadmap') || lower.includes('milestone')) {
    return {
      dir: 'planning',
      name: basename.toLowerCase(),
      reason: 'Contains planning content',
    };
  }

  // Check for guide keywords
  if (
    lower.includes('how to') ||
    lower.includes('guide') ||
    lower.includes('tutorial') ||
    basename.includes('config')
  ) {
    return {
      dir: 'guides',
      name: basename.toLowerCase(),
      reason: 'Contains instructional content',
    };
  }

  // Default to guides
  return {
    dir: 'guides',
    name: basename.toLowerCase(),
    reason: 'General documentation',
  };
}

// ============================================================================
// REPORTING
// ============================================================================

function printResults(results, showWarnings = false) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Documentation Conventions Validator');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  if (results.errors.length === 0 && results.warnings.length === 0) {
    console.log('✅ All documentation follows conventions!');
    return;
  }

  if (results.errors.length > 0) {
    console.log('🚨 ERRORS:\n');

    for (const error of results.errors) {
      console.log(`❌ ${error.file}`);
      console.log(`   Rule: ${error.rule}`);
      console.log(`   ${error.message}`);

      if (error.fix) {
        console.log(`   Fix: ${error.fix.type} -> ${error.fix.to}`);
        console.log(`   Reason: ${error.fix.reason}`);
      }

      console.log('');
    }
  }

  if (showWarnings && results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');

    for (const warning of results.warnings) {
      console.log(`⚠️  ${warning.file}`);
      console.log(`   Rule: ${warning.rule}`);
      console.log(`   ${warning.message}`);

      if (warning.fix) {
        console.log(`   Fix: ${warning.fix.type} -> ${warning.fix.to}`);
      }

      console.log('');
    }
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log(`Errors: ${results.errors.length}`);
  if (showWarnings) {
    console.log(`Warnings: ${results.warnings.length}`);
  }
  console.log('═══════════════════════════════════════════════════════');
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  // const autoFix = args.includes("--fix"); // TODO: Implement autofix in future
  const showWarnings = args.includes('--warnings');
  const stagedOnly = args.includes('--staged');

  const conventions = loadConventions();
  const results = new ValidationResult();

  // Get files to check
  const files = stagedOnly ? getStagedDocFiles() : getAllDocFiles();

  if (files.length === 0) {
    console.log('No documentation files to check.');
    return;
  }

  // Validate each file
  for (const file of files) {
    validateFile(file, conventions, results);
  }

  // Print results
  printResults(results, showWarnings);

  // Exit with error if issues found
  if (results.hasIssues()) {
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

export { loadConventions, validateFile, ValidationResult };
