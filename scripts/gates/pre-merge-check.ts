#!/usr/bin/env node

/**
 * Pre-Merge Validation Check
 *
 * Ensures feature branches include proper test coverage and verification
 * before merging to main.
 *
 * Checks:
 * 1. WORK-VERIFICATION.md exists and is complete
 * 2. Test files referenced actually exist
 * 3. Tests are passing
 * 4. Work objectives map to tests
 * 5. Test organization is documented
 *
 * Usage:
 *   node scripts/pre-merge-check.js
 *
 * Exit Codes:
 *   0 - Ready to merge
 *   1 - Validation failed, cannot merge
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import type {
  PreMergeConfig,
  ValidationMessage,
  ValidationResultData,
} from '../schemas/gates/pre-merge.schema.js';
import { PreMergeConfigSchema } from '../schemas/gates/pre-merge.schema.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const WORK_VERIFICATION_FILE = 'WORK-VERIFICATION.md';
const CONFIG_FILE = 'opencode.json';

// ============================================================================
// LOAD CONFIGURATION
// ============================================================================

function loadConfig(): PreMergeConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    return getDefaultConfig();
  }

  try {
    const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) as Record<string, unknown>;
    const git = data['git'] as Record<string, unknown> | undefined;
    const preMerge = git?.['preMerge'] as Record<string, unknown> | undefined;
    return preMerge ? PreMergeConfigSchema.parse(preMerge) : getDefaultConfig();
  } catch {
    return getDefaultConfig();
  }
}

function getDefaultConfig(): PreMergeConfig {
  return PreMergeConfigSchema.parse({
    requireWorkVerification: true,
    requireTests: true,
    minCoverageIncrease: 0,
    allowedWithoutTests: ['docs/', 'chore/'],
  });
}

// ============================================================================
// BRANCH DETECTION
// ============================================================================

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
    }).trim();
  } catch {
    return null;
  }
}

function getBranchType(branchName: string): string {
  const prefixes = ['feature/', 'fix/', 'refactor/', 'docs/', 'test/', 'chore/'];

  for (const prefix of prefixes) {
    if (branchName.startsWith(prefix)) {
      return prefix;
    }
  }

  return 'unknown/';
}

// ============================================================================
// VALIDATION
// ============================================================================

class ValidationResult {
  private data: ValidationResultData;

  constructor() {
    this.data = {
      errors: [],
      warnings: [],
      info: [],
    };
  }

  addError(message: string, fix: string | null = null): void {
    this.data.errors.push({ message, fix });
  }

  addWarning(message: string): void {
    this.data.warnings.push({ message });
  }

  addInfo(message: string): void {
    this.data.info.push({ message });
  }

  hasErrors(): boolean {
    return this.data.errors.length > 0;
  }

  isValid(): boolean {
    return !this.hasErrors();
  }

  getErrors(): ValidationMessage[] {
    return this.data.errors;
  }

  getWarnings(): ValidationMessage[] {
    return this.data.warnings;
  }

  getInfo(): ValidationMessage[] {
    return this.data.info;
  }

  getData(): ValidationResultData {
    return this.data;
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Legacy function, will refactor in migration
function validateWorkVerification(
  config: PreMergeConfig,
  branchType: string,
  results: ValidationResult,
): void {
  // Check if work verification is required
  if (!config.requireWorkVerification) {
    results.addInfo('Work verification not required');
    return;
  }

  // Check if branch type is exempt
  if (config.allowedWithoutTests.includes(branchType)) {
    results.addInfo(`Branch type '${branchType}' exempt from work verification`);
    return;
  }

  // Check if WORK-VERIFICATION.md exists
  if (!fs.existsSync(WORK_VERIFICATION_FILE)) {
    results.addError(
      'WORK-VERIFICATION.md not found',
      'Run: node scripts/init-work-verification.js',
    );
    return;
  }

  results.addInfo('✓ WORK-VERIFICATION.md found');

  // Parse work verification
  const content = fs.readFileSync(WORK_VERIFICATION_FILE, 'utf8');

  // Check for objectives
  const objectivesMatch = content.match(/## Objectives[\s\S]*?(?=##|$)/);
  if (!objectivesMatch) {
    results.addError('No objectives section in WORK-VERIFICATION.md');
    return;
  }

  const objectives = (objectivesMatch[0].match(/- \[.\] .+/g) || []).length;
  if (objectives === 0) {
    results.addError(
      'No objectives listed in WORK-VERIFICATION.md',
      'Add objectives that describe what this work accomplishes',
    );
    return;
  }

  results.addInfo(`✓ ${objectives} objectives defined`);

  // Check for test references
  const testTableMatch = content.match(/\| Objective.*\|[\s\S]*?(?=##|$)/);
  if (!testTableMatch) {
    if (config.requireTests && !config.allowedWithoutTests.includes(branchType)) {
      results.addError(
        'No test coverage table in WORK-VERIFICATION.md',
        'Add ## Verification Strategy section with test coverage table',
      );
    } else {
      results.addWarning('No test coverage documented');
    }
    return;
  }

  const testFileRefs = testTableMatch[0].match(/tests\/[^\s|]+\.test\.js/g) || [];
  const uniqueTestFiles = [...new Set(testFileRefs)];

  if (uniqueTestFiles.length === 0) {
    if (config.requireTests && !config.allowedWithoutTests.includes(branchType)) {
      results.addError(
        'No test files referenced in verification table',
        'Add test file paths to the verification table',
      );
    }
    return;
  }

  results.addInfo(`✓ ${uniqueTestFiles.length} test files referenced`);

  // Verify test files exist
  const missingTests = [];
  for (const testFile of uniqueTestFiles) {
    if (!fs.existsSync(testFile)) {
      missingTests.push(testFile);
    }
  }

  if (missingTests.length > 0) {
    results.addError(
      `Referenced test files do not exist:\n  - ${missingTests.join('\n  - ')}`,
      'Create the test files or fix the references',
    );
  } else {
    results.addInfo('✓ All referenced test files exist');
  }

  // Check test organization section
  if (!content.includes('## Test Organization')) {
    results.addWarning('No test organization section');
    results.addWarning('Add ## Test Organization to document test structure');
  } else {
    results.addInfo('✓ Test organization documented');
  }

  // Check completion checklist
  if (content.includes('## Completion Checklist')) {
    const unchecked = (content.match(/- \[ \]/g) || []).length;
    if (unchecked > 0) {
      results.addWarning(`${unchecked} checklist items not completed`);
    } else {
      results.addInfo('✓ Completion checklist complete');
    }
  }
}

function validateTests(
  config: PreMergeConfig,
  branchType: string,
  results: ValidationResult,
): void {
  // Check if tests are required
  if (!config.requireTests) {
    results.addInfo('Tests not required');
    return;
  }

  // Check if branch type is exempt
  if (config.allowedWithoutTests.includes(branchType)) {
    results.addInfo(`Branch type '${branchType}' exempt from test requirements`);
    return;
  }

  // Run tests
  try {
    results.addInfo('Running tests...');

    const output = execSync('npm test 2>&1', {
      encoding: 'utf8',
      stdio: 'pipe',
    });

    // Parse test results
    const passMatch = output.match(/Tests:\s+(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);

    if (failMatch?.[1]) {
      const failCount = Number.parseInt(failMatch[1], 10);
      if (failCount > 0) {
        results.addError(`${failCount} tests failing`, 'Fix failing tests before merging');
      }
    } else if (passMatch) {
      results.addInfo(`✓ All ${passMatch[1]} tests passing`);
    }
  } catch (error) {
    const errorOutput =
      error && typeof error === 'object' && 'stdout' in error && 'stderr' in error
        ? (error.stdout as string) || (error.stderr as string) || ''
        : '';

    if (errorOutput.includes('failed')) {
      results.addError('Tests are failing', 'Fix failing tests before merging');
    } else {
      results.addError('Could not run tests', "Ensure 'npm test' works correctly");
    }
  }
}

// ============================================================================
// REPORTING
// ============================================================================

function printResults(branchName: string, results: ValidationResult): void {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Pre-Merge Validation');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`Branch: ${branchName}`);
  console.log('');

  const data = results.getData();
  if (data.info.length > 0) {
    for (const info of data.info) {
      console.log(`  ${info.message}`);
    }
    console.log('');
  }

  if (data.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    for (const warning of data.warnings) {
      console.log(`⚠️  ${warning.message}`);
    }
    console.log('');
  }

  if (data.errors.length > 0) {
    console.log('🚨 ERRORS:\n');
    for (const error of data.errors) {
      console.log(`❌ ${error.message}`);
      if (error.fix) {
        console.log(`   Fix: ${error.fix}`);
      }
      console.log('');
    }
  }

  console.log('═══════════════════════════════════════════════════════');

  if (results.isValid()) {
    console.log('✅ READY TO MERGE');
    console.log('All validation checks passed!');
  } else {
    console.log('❌ CANNOT MERGE');
    console.log(`Fix ${data.errors.length} error(s) before merging`);
  }

  console.log('═══════════════════════════════════════════════════════');
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const config = loadConfig();
  const branchName = getCurrentBranch();

  if (!branchName) {
    console.error('❌ Could not determine current git branch');
    process.exit(1);
  }

  // Skip checks for main branch
  if (branchName === 'main') {
    console.log('✓ On main branch - skipping pre-merge checks');
    process.exit(0);
  }

  const branchType = getBranchType(branchName);
  const results = new ValidationResult();

  // Run validations
  validateWorkVerification(config, branchType, results);
  validateTests(config, branchType, results);

  // Print results
  printResults(branchName, results);

  // Exit with appropriate code
  process.exit(results.isValid() ? 0 : 1);
}

// Run if called directly (ESM check)
const isMain =
  process.argv[1] &&
  (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1]));
if (isMain) {
  main();
}

export { validateWorkVerification, validateTests, ValidationResult };
