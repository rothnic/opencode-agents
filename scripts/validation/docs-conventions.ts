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
import {
  parseConventionsFromFile,
  type Conventions as SchemaConventions,
  type Rule as SchemaRule,
} from '../schemas/conventions-schema.js';

// ============================================================================
// TYPES
// ============================================================================

type Conventions = SchemaConventions;

interface ValidationIssue {
  file: string;
  rule: string;
  message: string;
  severity?: string;
  fix?: string | null;
}

// (ValidationResult class below provides the runtime structure)

// Lightweight rule type (conventions JSON is dynamic; keep minimal known fields)
type Rule = SchemaRule;

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONVENTIONS_FILE = '.opencode/conventions.json';
const DOCS_DIR = 'docs';

// ============================================================================
// LOAD CONVENTIONS
// ============================================================================

function loadConventions(): Conventions {
  try {
    return parseConventionsFromFile(CONVENTIONS_FILE);
  } catch (err) {
    console.error(`❌ Failed to load conventions: ${String(err)}`);
    process.exit(1);
  }
}

// ============================================================================
// FILE DISCOVERY
// ============================================================================

function getAllDocFiles(): string[] {
  const files: string[] = [];

  function scan(dir: string): void {
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

function getRuleString(rule: Rule, key: string): string | undefined {
  const val = (rule as Record<string, unknown>)[key];
  return typeof val === 'string' ? val : undefined;
}

class ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  fixes: string[];

  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
  }

  addError(file: string, rule: string, message: string, fix: string | null = null): void {
    this.errors.push({ file, rule, message, fix });
  }

  addWarning(file: string, rule: string, message: string, fix: string | null = null): void {
    this.warnings.push({ file, rule, message, fix });
  }

  hasIssues(): boolean {
    return this.errors.length > 0;
  }
}

// Conventions JSON is dynamic; assert minimal shape for fileOrganization
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: File validation logic requires multiple checks for rules, exclusions, patterns, and error levels
function validateFile(file: string, conventions: Conventions, results: ValidationResult): void {
  // `conventions.documentation` comes from a dynamic JSON file. Access
  // `fileOrganization` via indexer to satisfy the index-signature typing.
  const fo = (conventions.documentation as Record<string, unknown> | undefined)
    ? ((conventions.documentation as Record<string, unknown>)['fileOrganization'] as unknown as
        | { rules?: Rule[] }
        | undefined)
    : undefined;
  const rules = fo?.rules || [];

  for (const rule of rules) {
    // Check if file matches rule pattern
    const rulePattern = getRuleString(rule, 'pattern');
    if (!rulePattern) continue;
    const pattern = new RegExp(rulePattern);
    if (!pattern.test(file)) {
      continue;
    }

    // Check if file is excluded
    if (rule.exclude) {
      const excluded = rule.exclude.some((ex: string) => new RegExp(ex).test(file));
      if (excluded) {
        continue;
      }
    }

    // Apply rule validation
    const isValid = applyRule(file, rule);

    if (!isValid) {
      const fix = generateFix(file, rule);
      const fixStr = fix ? JSON.stringify(fix) : null;
      const ruleId = typeof rule.id === 'string' ? rule.id : 'unknown';
      const ruleMsg = typeof rule.message === 'string' ? rule.message : '';

      if (rule.level === 'error') {
        results.addError(file, ruleId, ruleMsg, fixStr);
      } else if (rule.level === 'warning') {
        results.addWarning(file, ruleId, ruleMsg, fixStr);
      }
    }
  }
}

// Rule structure is dynamic from JSON, use lightweight Rule type
function applyRule(file: string, rule: Rule): boolean {
  switch (rule.id) {
    case 'docs-root-limited': {
      // Check if file is in docs root
      const relativePath = path.relative('docs', file);
      if (relativePath.includes('/')) {
        return true; // Not in root
      }

      const basename = path.basename(file);
      const allowedVal = (rule as Record<string, unknown>)['allowed'];
      if (Array.isArray(allowedVal)) {
        return (allowedVal as string[]).includes(basename);
      }
      return true;
    }

    case 'consistent-naming':
    case 'no-mixed-case': {
      const basename = path.basename(file);
      const validatorStr = getRuleString(rule, 'validator');
      if (!validatorStr) return true;
      const validator = new RegExp(validatorStr);
      return validator.test(basename);
    }

    case 'blog-numbering': {
      const basename = path.basename(file);
      const validatorStr = getRuleString(rule, 'validator');
      if (!validatorStr) return true;
      const validator = new RegExp(validatorStr);
      return validator.test(basename);
    }

    case 'phase-structure': {
      const dirname = path.basename(path.dirname(file));
      const validatorStr = getRuleString(rule, 'validator');
      if (!validatorStr) return true;
      const validator = new RegExp(validatorStr);
      return validator.test(dirname);
    }

    case 'template-suffix': {
      const basename = path.basename(file);
      const validatorStr = getRuleString(rule, 'validator');
      if (!validatorStr) return true;
      const validator = new RegExp(validatorStr);
      return validator.test(basename);
    }

    default:
      return true;
  }
}

function generateFix(
  file: string,
  rule: Rule,
): { type: string; from: string; to: string; reason?: string } | null {
  if (!rule?.autofix || !rule.autofix.enabled) {
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

function suggestDirectory(
  content: string,
  basename: string,
): { dir: string; name: string; reason: string } {
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
        .replace(/[A-Z-]/g, (m: string) => (m === '-' ? '-' : `-${m.toLowerCase()}`)),
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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Reporting function is intentionally multi-branch
function printResults(results: ValidationResult, showWarnings = false): void {
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
        // fixes were stringified when recorded; try to parse
        try {
          const parsed = JSON.parse(error.fix);
          if (parsed && typeof parsed === 'object') {
            console.log(`   Fix: ${parsed.type} -> ${parsed.to}`);
            if (parsed.reason) console.log(`   Reason: ${parsed.reason}`);
          } else {
            console.log(`   Fix: ${String(error.fix)}`);
          }
        } catch {
          console.log(`   Fix: ${String(error.fix)}`);
        }
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
        try {
          const parsed = JSON.parse(warning.fix);
          if (parsed && typeof parsed === 'object') {
            console.log(`   Fix: ${parsed.type} -> ${parsed.to}`);
          } else {
            console.log(`   Fix: ${String(warning.fix)}`);
          }
        } catch {
          console.log(`   Fix: ${String(warning.fix)}`);
        }
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
