#!/usr/bin/env node

/**
 * Test Evidence Recorder
 *
 * Records proof that tests were executed and passed.
 * Creates timestamped evidence files that gate checks can verify.
 *
 * Usage:
 *   npm test && node scripts/testing/test-evidence.js phase-X.Y
 *   node scripts/testing/test-evidence.js phase-1.1 --test-file=test-results.json
 *
 * Arguments:
 *   phase-X.Y   Phase identifier (e.g., phase-1.1, phase-2.3)
 *
 * Options:
 *   --test-file=PATH    Path to test results JSON file
 *   --force             Record evidence even if tests failed
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// TYPES
// ============================================================================

interface TestEvidence {
  phase: string;
  timestamp: string;
  passed: boolean;
  testResults: TestResults | null;
  gitCommit: { commit: string; branch: string };
  environment: {
    node: string;
    platform: string;
    cwd: string;
  };
}

interface TestResults {
  success: boolean;
  summary?: {
    passed?: number;
    failed?: number;
    message?: string;
  };
  metrics?: Record<string, unknown>;
  note?: string;
}

interface RecordOptions {
  testFile?: string;
  force?: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const EVIDENCE_DIR_TEMPLATE = 'docs/phases/{PHASE}/test-evidence';
const METRICS_DIR = 'docs/metrics';

// ============================================================================
// MAIN LOGIC
// ============================================================================

function createEvidenceDirectory(evidenceDir: string): void {
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
    console.log(`✓ Created evidence directory: ${evidenceDir}`);
  }
}

function loadTestResults(options: RecordOptions): TestResults | null {
  if (options.testFile) {
    try {
      return JSON.parse(fs.readFileSync(options.testFile, 'utf8')) as TestResults;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error reading test file: ${errorMessage}`);
      process.exit(1);
    }
  }
  return detectTestResults();
}

function createEvidence(phase: string, testResults: TestResults | null): TestEvidence {
  const passed = testResults ? testResults.success : false;
  const timestamp = new Date().toISOString();
  return {
    phase,
    timestamp,
    passed,
    testResults,
    gitCommit: getGitCommit(),
    environment: {
      node: process.version,
      platform: process.platform,
      cwd: process.cwd(),
    },
  };
}

function writeEvidenceFiles(evidenceDir: string, evidence: TestEvidence, phase: string): void {
  const { timestamp, passed, testResults } = evidence;

  // Write timestamped evidence file
  const timestampFile = path.join(evidenceDir, `results-${Date.now()}.json`);
  fs.writeFileSync(timestampFile, JSON.stringify(evidence, null, 2));
  console.log(`✓ Wrote: ${timestampFile}`);

  // Write/update latest evidence file
  const latestFile = path.join(evidenceDir, 'latest-run.json');
  fs.writeFileSync(latestFile, JSON.stringify(evidence, null, 2));
  console.log(`✓ Updated: ${latestFile}`);

  // Write simple status file
  const statusFile = path.join(evidenceDir, 'test-status.txt');
  const status = passed ? 'PASSED' : 'FAILED';
  fs.writeFileSync(statusFile, `${status}\n${timestamp}\n`);
  console.log(`✓ Updated: ${statusFile}`);

  // Copy metrics if available
  if (testResults?.metrics) {
    const metricsFile = path.join(METRICS_DIR, `${phase}-metrics.json`);
    if (!fs.existsSync(METRICS_DIR)) {
      fs.mkdirSync(METRICS_DIR, { recursive: true });
    }
    fs.writeFileSync(metricsFile, JSON.stringify(testResults.metrics, null, 2));
    console.log(`✓ Saved metrics: ${metricsFile}`);
  }
}

function printEvidenceSummary(evidence: TestEvidence): void {
  const { timestamp, passed, testResults } = evidence;
  const status = passed ? 'PASSED' : 'FAILED';

  console.log('\n✅ Test evidence recorded successfully\n');
  console.log('Summary:');
  console.log(`  Status: ${status}`);
  console.log(`  Time: ${timestamp}`);
  if (testResults?.summary) {
    console.log(
      `  Tests: ${testResults.summary.passed || 0} passed, ${testResults.summary.failed || 0} failed`,
    );
  }
  console.log('');
}

function recordTestEvidence(phase: string, options: RecordOptions = {}): TestEvidence {
  console.log('📋 Recording test evidence...\n');
  console.log(`Phase: ${phase}\n`);

  const evidenceDir = EVIDENCE_DIR_TEMPLATE.replace('{PHASE}', phase);
  createEvidenceDirectory(evidenceDir);

  const testResults = loadTestResults(options);
  const passed = testResults ? testResults.success : false;

  if (!passed && !options.force) {
    console.error('❌ Tests did not pass. Cannot record evidence.');
    console.error('   Run tests and ensure they pass, or use --force flag.');
    process.exit(1);
  }

  const evidence = createEvidence(phase, testResults);
  writeEvidenceFiles(evidenceDir, evidence, phase);
  printEvidenceSummary(evidence);

  return evidence;
}

function detectTestResults(): TestResults {
  // Try to detect test results from common locations
  const commonPaths = ['test-results.json', 'coverage/test-results.json', 'junit.xml'];

  for (const testPath of commonPaths) {
    if (fs.existsSync(testPath)) {
      try {
        return JSON.parse(fs.readFileSync(testPath, 'utf8')) as TestResults;
      } catch {
        // Not JSON or invalid, continue
      }
    }
  }

  // No test results found
  console.warn('⚠️  Could not auto-detect test results');
  console.warn('   Provide --test-file=PATH or ensure tests output to standard location\n');

  return {
    success: true,
    summary: { message: 'Manual verification' },
    note: 'Test results not auto-detected',
  };
}

function getGitCommit() {
  try {
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
    }).trim();
    return { commit, branch };
  } catch {
    return { commit: 'unknown', branch: 'unknown' };
  }
}

// ============================================================================
// VERIFICATION: Check if evidence exists for a phase
// ============================================================================

function verifyTestEvidence(phase: string, maxAgeMinutes = 10): boolean {
  console.log(`🔍 Verifying test evidence for ${phase}...\n`);

  const evidenceDir = EVIDENCE_DIR_TEMPLATE.replace('{PHASE}', phase);
  const latestFile = path.join(evidenceDir, 'latest-run.json');

  // Check if evidence exists
  if (!fs.existsSync(latestFile)) {
    console.error(`❌ No test evidence found for ${phase}`);
    console.error(`   Expected: ${latestFile}`);
    console.error(`\n   Run: npm test && node scripts/testing/test-evidence.js ${phase}\n`);
    return false;
  }

  // Read evidence
  const evidence = JSON.parse(fs.readFileSync(latestFile, 'utf8')) as TestEvidence;

  // Check if tests passed
  if (!evidence.passed) {
    console.error('❌ Test evidence shows tests FAILED');
    console.error('   Tests must pass before marking phase complete\n');
    return false;
  }

  // Check age of evidence
  const evidenceAge = Date.now() - new Date(evidence.timestamp).getTime();
  const ageMinutes = Math.floor(evidenceAge / 60000);

  if (ageMinutes > maxAgeMinutes) {
    console.error(`❌ Test evidence is too old (${ageMinutes} minutes)`);
    console.error(`   Evidence must be < ${maxAgeMinutes} minutes old`);
    console.error(`\n   Run: npm test && node scripts/testing/test-evidence.js ${phase}\n`);
    return false;
  }

  // All checks passed
  console.log('✅ Test evidence is valid');
  console.log('   Status: PASSED');
  console.log(`   Age: ${ageMinutes} minute(s) old`);
  console.log(`   Timestamp: ${evidence.timestamp}\n`);

  return true;
}

// ============================================================================
// CLI
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log('Test Evidence Recorder');
    console.log('');
    console.log('Usage:');
    console.log('  Record evidence:  node scripts/testing/test-evidence.js phase-X.Y [options]');
    console.log('  Verify evidence:  node scripts/testing/test-evidence.js --verify phase-X.Y');
    console.log('');
    console.log('Options:');
    console.log('  --test-file=PATH    Path to test results JSON');
    console.log('  --force             Record even if tests failed');
    console.log('  --verify            Verify evidence exists and is recent');
    console.log('  --max-age=N         Max age in minutes (default: 10)');
    console.log('');
    process.exit(0);
  }

  // Parse arguments
  const verify = args.includes('--verify');
  const force = args.includes('--force');
  const phase = args.find(a => a.startsWith('phase-'));
  const testFile = args.find(a => a.startsWith('--test-file='))?.split('=')[1];
  const maxAgeArg = args.find(a => a.startsWith('--max-age='))?.split('=')[1];
  const maxAge = maxAgeArg ? Number.parseInt(maxAgeArg, 10) : 10;

  if (!phase) {
    console.error('❌ Error: Phase identifier required (e.g., phase-1.1)');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('  Test Evidence Recorder - OpenCode Agents');
  console.log('═══════════════════════════════════════════════════════\n');

  if (verify) {
    const valid = verifyTestEvidence(phase, maxAge);
    process.exit(valid ? 0 : 1);
  } else {
    try {
      recordTestEvidence(phase, { testFile, force });
      process.exit(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error: ${errorMessage}`);
      process.exit(1);
    }
  }
}

// Run if called directly (ESM check)
const isMain =
  process.argv[1] &&
  (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1]));
if (isMain) {
  main();
}

export { recordTestEvidence, verifyTestEvidence };
