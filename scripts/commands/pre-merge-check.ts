/**
 * Command: Pre-Merge Validation Check
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
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { defineCommand, defineOptions } from '@robingenz/zli';
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

interface ValidationMessage {
  message: string;
  fix?: string | null;
}

interface ValidationResultData {
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  info: ValidationMessage[];
}

const WORK_VERIFICATION_FILE = 'WORK-VERIFICATION.md';
const CONFIG_FILE = 'opencode.json';

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION CLASS
// ═══════════════════════════════════════════════════════════════════════════

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

  print(): void {
    if (this.data.errors.length > 0) {
      console.log('\n❌ ERRORS:\n');
      for (const error of this.data.errors) {
        console.log(`  ${error.message}`);
        if (error.fix) {
          console.log(`  → Fix: ${error.fix}`);
        }
      }
    }

    if (this.data.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:\n');
      for (const warning of this.data.warnings) {
        console.log(`  ${warning.message}`);
      }
    }

    if (this.data.info.length > 0) {
      console.log('\nℹ️  INFO:\n');
      for (const info of this.data.info) {
        console.log(`  ${info.message}`);
      }
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`Errors: ${this.data.errors.length}`);
    console.log(`Warnings: ${this.data.warnings.length}`);
    console.log();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getDefaultConfig(): Record<string, unknown> {
  return {
    requireWorkVerification: true,
    requireTests: true,
    minCoverageIncrease: 0,
    allowedWithoutTests: ['docs/', 'chore/'],
  };
}

function loadConfig(): Record<string, unknown> {
  if (!fs.existsSync(CONFIG_FILE)) {
    return getDefaultConfig();
  }

  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
    const data = JSON.parse(content) as Record<string, unknown>;
    const git = data['git'] as Record<string, unknown> | undefined;
    return (git?.['preMerge'] as Record<string, unknown>) ?? getDefaultConfig();
  } catch {
    return getDefaultConfig();
  }
}

function getCurrentBranch(): string | null {
  try {
    const output = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
    }).trim();
    return output;
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

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function validateWorkVerification(
  config: Record<string, unknown>,
  branchType: string,
  results: ValidationResult,
): void {
  // Check if work verification is required
  const requireWorkVerification = config['requireWorkVerification'] as boolean | undefined;
  if (requireWorkVerification === false) {
    results.addInfo('Work verification not required');
    return;
  }

  // Check if branch type is exempt
  const allowed = config['allowedWithoutTests'] as string[] | undefined;
  if (allowed?.includes(branchType)) {
    results.addInfo(`Branch type '${branchType}' exempt from work verification`);
    return;
  }

  if (!fs.existsSync(WORK_VERIFICATION_FILE)) {
    results.addError(
      'WORK-VERIFICATION.md not found',
      'Run: node scripts/init-work-verification.js',
    );
    return;
  }

  results.addInfo('✓ WORK-VERIFICATION.md found');
  checkWorkVerificationContent(config, branchType, results);
}

function checkWorkVerificationContent(
  config: Record<string, unknown>,
  branchType: string,
  results: ValidationResult,
): void {
  const content = fs.readFileSync(WORK_VERIFICATION_FILE, 'utf8');

  // Check for objectives
  const objectivesMatch = content.match(/## Objectives[\s\S]*?(?=##|$)/);
  if (!objectivesMatch) {
    results.addError('No objectives section in WORK-VERIFICATION.md');
    return;
  }

  const objectives = (objectivesMatch[0].match(/- \[.\] .+/g) ?? []).length;
  if (objectives === 0) {
    results.addError(
      'No objectives listed in WORK-VERIFICATION.md',
      'Add objectives that describe what this work accomplishes',
    );
    return;
  }

  results.addInfo(`✓ ${objectives} objectives defined`);
  checkTestReferences(config, branchType, results, content);
}

function validateTestFilesExist(uniqueTestFiles: string[], results: ValidationResult): void {
  const missingTests: string[] = [];
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
}

function validateTestDocumentation(content: string, results: ValidationResult): void {
  // Check test organization section
  if (!content.includes('## Test Organization')) {
    results.addWarning('No test organization section');
    results.addWarning('Add ## Test Organization to document test structure');
  } else {
    results.addInfo('✓ Test organization documented');
  }

  // Check completion checklist
  if (content.includes('## Completion Checklist')) {
    const unchecked = (content.match(/- \[ \]/g) ?? []).length;
    if (unchecked > 0) {
      results.addWarning(`${unchecked} checklist items not completed`);
    } else {
      results.addInfo('✓ Completion checklist complete');
    }
  }
}

function checkTestReferences(
  config: Record<string, unknown>,
  branchType: string,
  results: ValidationResult,
  content: string,
): void {
  const testTableMatch = content.match(/\| Objective.*\|[\s\S]*?(?=##|$)/);
  const requireTests = config['requireTests'] as boolean | undefined;
  const allowed = config['allowedWithoutTests'] as string[] | undefined;

  if (!testTableMatch) {
    if (requireTests && !allowed?.includes(branchType)) {
      results.addError(
        'No test coverage table in WORK-VERIFICATION.md',
        'Add ## Verification Strategy section with test coverage table',
      );
    } else {
      results.addWarning('No test coverage documented');
    }
    return;
  }

  const testFileRefs = testTableMatch[0].match(/tests\/[^\s|]+\.test\.js/g) ?? [];
  const uniqueTestFiles = [...new Set(testFileRefs)];

  if (uniqueTestFiles.length === 0) {
    if (requireTests && !allowed?.includes(branchType)) {
      results.addError(
        'No test files referenced in verification table',
        'Add test file paths to the verification table',
      );
    }
    return;
  }

  results.addInfo(`✓ ${uniqueTestFiles.length} test files referenced`);
  validateTestFilesExist(uniqueTestFiles, results);
  validateTestDocumentation(content, results);
}

function validateTests(
  config: Record<string, unknown>,
  branchType: string,
  results: ValidationResult,
): void {
  // Check if tests are required
  const requireTests = config['requireTests'] as boolean | undefined;
  if (requireTests === false) {
    results.addInfo('Tests not required');
    return;
  }

  // Check if branch type is exempt
  const allowed = config['allowedWithoutTests'] as string[] | undefined;
  if (allowed?.includes(branchType)) {
    results.addInfo(`Branch type '${branchType}' exempt from tests`);
    return;
  }

  results.addInfo('Running tests...');

  // Run tests
  try {
    execSync('npm run test', {
      stdio: 'inherit',
      encoding: 'utf8',
    });
    results.addInfo('✓ All tests passing');
  } catch (error) {
    if (error instanceof Error) {
      results.addError('Tests failed');
    } else {
      results.addError('Tests failed');
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

export const preMergeCheckCommand = defineCommand({
  description: 'Pre-merge validation checks',
  options: defineOptions(
    z.object({
      verify: z.boolean().default(true).describe('Require work verification'),
      tests: z.boolean().default(true).describe('Require passing tests'),
    }),
    { v: 'verify', t: 'tests' },
  ),
  action: async () => {
    console.log('\n🔍 Pre-Merge Validation\n');
    console.log('═'.repeat(60));

    const config = loadConfig();
    const branchName = getCurrentBranch();

    if (!branchName) {
      console.error('❌ Could not determine current branch');
      process.exit(1);
    }

    const branchType = getBranchType(branchName);
    const results = new ValidationResult();

    console.log(`Branch: ${branchName}`);
    console.log(`Type: ${branchType}`);
    console.log(`${'═'.repeat(60)}\n`);

    // Run validations
    validateWorkVerification(config, branchType, results);
    validateTests(config, branchType, results);

    // Print results
    results.print();

    // Exit with appropriate code
    if (!results.isValid()) {
      process.exit(1);
    }
  },
});
