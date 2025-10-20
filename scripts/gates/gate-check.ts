#!/usr/bin/env node

/**
 * Gate Check - Pre-Commit Validation
 *
 * Comprehensive validation before allowing commits.
 * Enforces test execution, file location rules, and phase completion requirements.
 *
 * Usage:
 *   node scripts/gate-check.js [--skip-tests] [--skip-files]
 *
 * Options:
 *   --skip-tests    Skip test evidence validation (use for non-phase commits)
 *   --skip-files    Skip file location validation
 *   --phase=X.Y     Specify phase for completion validation
 */

import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { execSync } from 'node:child_process';
import { verifyTestEvidence } from '../testing/test-evidence.js';
import { checkStagedFiles } from './file-location-check.js';

// ============================================================================
// TYPES
// ============================================================================

interface GateResult {
  type: string;
  passed: boolean;
  message: string;
  details: string | string[] | null;
}

interface GateError {
  type: string;
  message: string;
  details: string | string[] | null;
}

interface GateCheckOptions {
  skipFiles?: boolean;
  skipTests?: boolean;
  skipBlog?: boolean;
  phase?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const PHASE_COMMIT_PATTERN = /feat: phase-(\d+\.\d+)/;
const GATE_TYPES = {
  FILE_LOCATION: 'file-location',
  TEST_EVIDENCE: 'test-evidence',
  PHASE_REQUIREMENTS: 'phase-requirements',
  GIT_STATUS: 'git-status',
};

// ============================================================================
// GATE CHECKS
// ============================================================================

class GateCheck {
  private results: GateResult[];
  private errors: GateError[];

  constructor() {
    this.results = [];
    this.errors = [];
  }

  addResult(
    type: string,
    passed: boolean,
    message: string,
    details: string | string[] | null = null,
  ): void {
    this.results.push({ type, passed, message, details });
    if (!passed) {
      this.errors.push({ type, message, details });
    }
  }

  run(options: GateCheckOptions = {}): boolean {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Gate Check - OpenCode Agents');
    console.log('═══════════════════════════════════════════════════════\n');

    const commitMsg = this.getCommitMessage();
    const isPhaseCommit = commitMsg && PHASE_COMMIT_PATTERN.test(commitMsg);
    const match = commitMsg?.match(PHASE_COMMIT_PATTERN);
    const phase = isPhaseCommit && match ? match[1] : null;

    if (commitMsg) {
      console.log(`📝 Commit message: "${commitMsg}"`);
      if (isPhaseCommit) {
        console.log(`🎯 Detected phase completion: phase-${phase}`);
      }
      console.log('');
    }

    // Run all gate checks
    console.log('Running gate checks...\n');

    // 1. File Location Check
    if (!options.skipFiles) {
      this.checkFileLocations();
    } else {
      console.log('⏭️  Skipped: File location check\n');
    }

    // 2. Git Status Check
    this.checkGitStatus();

    // 3. Blog Health Check
    if (!options.skipBlog) {
      this.checkBlogHealth();
    } else {
      console.log('⏭️  Skipped: Blog health check\n');
    }

    // 4. Phase-specific checks
    if (isPhaseCommit && !options.skipTests) {
      this.checkTestEvidence(`phase-${phase}`);
      this.checkPhaseRequirements(`phase-${phase}`);
    } else if (options.phase) {
      this.checkTestEvidence(options.phase);
      this.checkPhaseRequirements(options.phase);
    } else if (!options.skipTests) {
      console.log('ℹ️  Not a phase completion commit - skipping test requirements\n');
    }

    // Print results
    this.printResults();

    return this.errors.length === 0;
  }

  checkFileLocations() {
    console.log('1️⃣  Checking file locations...');
    try {
      const passed = checkStagedFiles();
      this.addResult(
        GATE_TYPES.FILE_LOCATION,
        passed,
        passed ? 'All files in correct locations' : 'File location violations found',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.addResult(GATE_TYPES.FILE_LOCATION, false, 'Error checking file locations', message);
    }
  }

  checkGitStatus() {
    console.log('2️⃣  Checking git status...');

    try {
      // Check for uncommitted changes outside of staged files
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      const lines = status
        .trim()
        .split('\n')
        .filter(l => l);
      const unstaged = lines.filter(l => !l.startsWith('A  ') && !l.startsWith('M  '));

      if (unstaged.length > 0) {
        console.log('⚠️  Warning: You have unstaged changes\n');
        // This is a warning, not a failure
      }

      this.addResult(GATE_TYPES.GIT_STATUS, true, 'Git status checked');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.addResult(GATE_TYPES.GIT_STATUS, false, 'Error checking git status', message);
    }
  }

  checkBlogHealth() {
    console.log('3️⃣  Checking blog health...');

    try {
      // Run the blog maintenance agent validate command
      const agentPath = path.join(__dirname, 'agents/blog-maintenance-agent.js');

      if (!fs.existsSync(agentPath)) {
        console.log('⚠️  Blog maintenance agent not found, skipping\n');
        return;
      }

      execSync(`node ${agentPath} validate`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      this.addResult('blog-health', true, 'Blog posts are healthy (no stubs for completed phases)');
      console.log('✅ Blog health check passed\n');
    } catch (error) {
      // The validate command exits non-zero if there are errors
      const message = error instanceof Error ? error.message : String(error);
      this.addResult(
        'blog-health',
        false,
        'Blog health issues detected (stubs for completed phases or missing metadata)',
        message,
      );
      console.log('❌ Blog health check failed\n');
    }
  }

  checkTestEvidence(phase: string): void {
    console.log(`4️⃣  Checking test evidence for ${phase}...`);

    try {
      const passed = verifyTestEvidence(phase, 10);
      this.addResult(
        GATE_TYPES.TEST_EVIDENCE,
        passed,
        passed
          ? `Test evidence valid for ${phase}`
          : `Test evidence missing or invalid for ${phase}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.addResult(
        GATE_TYPES.TEST_EVIDENCE,
        false,
        `Error verifying test evidence for ${phase}`,
        message,
      );
    }
  }

  checkPhaseRequirements(phase: string): void {
    console.log(`5️⃣  Checking phase requirements for ${phase}...`);

    const phaseDir = `docs/phases/${phase}`;
    const readmePath = path.join(phaseDir, 'README.md');

    // Check if phase directory exists
    if (!fs.existsSync(phaseDir)) {
      this.addResult(
        GATE_TYPES.PHASE_REQUIREMENTS,
        false,
        `Phase directory not found: ${phaseDir}`,
      );
      return;
    }

    // Check if README exists
    if (!fs.existsSync(readmePath)) {
      console.log(`⚠️  Warning: No README.md in ${phaseDir}\n`);
      this.addResult(
        GATE_TYPES.PHASE_REQUIREMENTS,
        true,
        'Phase directory exists (no README to validate)',
      );
      return;
    }

    // Extract deliverables from README
    const readme = fs.readFileSync(readmePath, 'utf8');
    const deliverables = this.extractDeliverables(readme);

    if (deliverables.length === 0) {
      console.log('ℹ️  No deliverables listed in phase README\n');
      this.addResult(GATE_TYPES.PHASE_REQUIREMENTS, true, 'No specific deliverables to check');
      return;
    }

    // Check each deliverable
    const missing: string[] = [];
    deliverables.forEach(file => {
      if (!fs.existsSync(file)) {
        missing.push(file);
      }
    });

    if (missing.length > 0) {
      console.log('❌ Missing deliverables:');
      for (const f of missing) {
        console.log(`   - ${f}`);
      }
      console.log('');
      this.addResult(
        GATE_TYPES.PHASE_REQUIREMENTS,
        false,
        `Missing ${missing.length} deliverable(s)`,
        missing,
      );
    } else {
      console.log(`✅ All deliverables present (${deliverables.length} files)\n`);
      this.addResult(
        GATE_TYPES.PHASE_REQUIREMENTS,
        true,
        `All ${deliverables.length} deliverables present`,
      );
    }
  }

  extractDeliverables(readme: string): string[] {
    // Extract file paths from README
    // Look for patterns like: - `/path/to/file` or - `path/to/file`
    const deliverables: string[] = [];
    const lines = readme.split('\n');

    for (const line of lines) {
      // Match patterns like: - `/opencode.json` or - `/.opencode/agent/`
      const match = line.match(/[-*]\s+`([/.][^`]+)`/);
      if (match?.[1]) {
        let file = match[1];
        // Remove leading slash for file system check
        if (file.startsWith('/')) {
          file = file.substring(1);
        }
        // Skip directories (they may not exist yet)
        if (!file.endsWith('/')) {
          deliverables.push(file);
        }
      }
    }

    return deliverables;
  }

  getCommitMessage(): string | null {
    try {
      // Try to get commit message from git commit-msg hook
      if (process.env['GIT_COMMIT_MSG_FILE']) {
        return fs.readFileSync(process.env['GIT_COMMIT_MSG_FILE'], 'utf8').trim();
      }

      // Try to get from command line args
      const msgIndex = process.argv.indexOf('--message');
      if (msgIndex !== -1 && process.argv[msgIndex + 1]) {
        return process.argv[msgIndex + 1] || null;
      }

      // Try to get last commit message
      return execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    } catch {
      return null;
    }
  }

  printResults() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Gate Check Results');
    console.log('═══════════════════════════════════════════════════════\n');

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    console.log(`Total checks: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}\n`);

    if (failed > 0) {
      console.log('Failed checks:');
      this.errors.forEach((err, i) => {
        console.log(`\n${i + 1}. ${err.type}`);
        console.log(`   ${err.message}`);
        if (err.details) {
          if (Array.isArray(err.details)) {
            for (const d of err.details) {
              console.log(`   - ${d}`);
            }
          } else {
            console.log(`   ${err.details}`);
          }
        }
      });
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('❌ GATE CHECK FAILED - Fix issues before committing');
      console.log('═══════════════════════════════════════════════════════\n');
    } else {
      console.log('═══════════════════════════════════════════════════════');
      console.log('✅ ALL GATES PASSED - Ready to commit');
      console.log('═══════════════════════════════════════════════════════\n');
    }
  }
}

// ============================================================================
// CLI
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log('Gate Check - Pre-Commit Validation');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/gate-check.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --skip-tests       Skip test evidence validation');
    console.log('  --skip-files       Skip file location validation');
    console.log('  --phase=X.Y        Specify phase for validation');
    console.log('  --message="..."    Provide commit message for analysis');
    console.log('  --help             Show this help');
    console.log('');
    process.exit(0);
  }

  const options = {
    skipTests: args.includes('--skip-tests'),
    skipFiles: args.includes('--skip-files'),
    phase: args.find(a => a.startsWith('--phase='))?.split('=')[1],
  };

  const gateCheck = new GateCheck();
  const passed = gateCheck.run(options);

  process.exit(passed ? 0 : 1);
}

// Run if called directly (ESM check)
const isMain =
  process.argv[1] &&
  (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1]));
if (isMain) {
  main();
}

export { GateCheck };
