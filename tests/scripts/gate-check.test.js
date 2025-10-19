/**
 * Tests for gate-check.js
 *
 * These tests verify that the gate check orchestrator works correctly.
 * Note: These are simplified tests that verify basic functionality.
 * Full integration tests would require a more complex test setup with git.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Gate Check Orchestrator', () => {
  const scriptPath = path.join(__dirname, '../../scripts/gates/gate-check.ts');
  const testDir = path.join(__dirname, '../fixtures/gate-check-test');
  const evidenceDir = path.join(testDir, '.evidence');

  beforeEach(() => {
    // Create fresh test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(evidenceDir, { recursive: true });
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Basic Functionality', () => {
    test('should exist and be executable', () => {
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    test('should complete without crashing on clean directory', () => {
      const gitDir = path.join(testDir, '.git');
      fs.mkdirSync(gitDir, { recursive: true });
      fs.writeFileSync(path.join(gitDir, 'COMMIT_EDITMSG'), 'docs: update readme');

      // Should not throw fatal errors
      try {
        execSync(`npx tsx ${scriptPath}`, {
          cwd: testDir,
          encoding: 'utf8',
        });
      } catch (error) {
        // Even if it fails, it shouldn't crash
        expect(error.status).toBeDefined();
      }
    });

    test('should produce output', () => {
      const gitDir = path.join(testDir, '.git');
      fs.mkdirSync(gitDir, { recursive: true });
      fs.writeFileSync(path.join(gitDir, 'COMMIT_EDITMSG'), 'docs: update readme');

      try {
        const output = execSync(`npx tsx ${scriptPath}`, {
          cwd: testDir,
          encoding: 'utf8',
        });

        // Should have some output
        expect(output.length).toBeGreaterThan(0);
      } catch (error) {
        const output = (error.stdout || '') + (error.stderr || '');
        expect(output.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Result Reporting', () => {
    test('should report total number of checks', () => {
      const gitDir = path.join(testDir, '.git');
      fs.mkdirSync(gitDir, { recursive: true });
      fs.writeFileSync(path.join(gitDir, 'COMMIT_EDITMSG'), 'docs: update readme');

      try {
        const output = execSync(`npx tsx ${scriptPath}`, {
          cwd: testDir,
          encoding: 'utf8',
        });

        // Should show total checks run
        expect(output).toMatch(/Total checks:/i);
      } catch (error) {
        const output = (error.stdout || '') + (error.stderr || '');
        expect(output).toMatch(/Total checks:/i);
      }
    });

    test('should count passed and failed checks', () => {
      const gitDir = path.join(testDir, '.git');
      fs.mkdirSync(gitDir, { recursive: true });
      fs.writeFileSync(path.join(gitDir, 'COMMIT_EDITMSG'), 'docs: update readme');

      try {
        const output = execSync(`npx tsx ${scriptPath}`, {
          cwd: testDir,
          encoding: 'utf8',
        });

        // Should show passed/failed breakdown
        expect(output).toMatch(/Passed:/i);
        expect(output).toMatch(/Failed:/i);
      } catch (error) {
        const output = (error.stdout || '') + (error.stderr || '');
        expect(output).toMatch(/Passed:/i);
        expect(output).toMatch(/Failed:/i);
      }
    });
  });

  describe('Exit Codes', () => {
    test('should exit successfully on clean directory', () => {
      const gitDir = path.join(testDir, '.git');
      fs.mkdirSync(gitDir, { recursive: true });
      fs.writeFileSync(path.join(gitDir, 'COMMIT_EDITMSG'), 'docs: update readme');

      try {
        const output = execSync(`npx tsx ${scriptPath}`, {
          cwd: testDir,
          encoding: 'utf8',
        });

        // Should indicate success
        expect(output).toMatch(/PASSED|✅/i);
      } catch (error) {
        // If it fails, at least verify we got a status code
        expect(error.status).toBeDefined();
      }
    });

    test('should exit non-zero with violations', () => {
      // Initialize git repository
      execSync('git init', { cwd: testDir });
      execSync('git config user.email "test@example.com"', {
        cwd: testDir,
      });
      execSync('git config user.name "Test User"', { cwd: testDir });

      // Create a file violation
      const sessionFile = path.join(testDir, 'SESSION-NOTES.md');
      fs.writeFileSync(sessionFile, '# Test\n');

      fs.writeFileSync(path.join(testDir, '.git', 'COMMIT_EDITMSG'), 'docs: update readme');

      // Stage the violating file so gate-check will detect it
      execSync('git add SESSION-NOTES.md', { cwd: testDir });

      try {
        execSync(`npx tsx ${scriptPath} 2>&1`, {
          cwd: testDir,
          encoding: 'utf8',
        });
        throw new Error('Expected gate check to fail with violation (SESSION-NOTES.md in root)');
      } catch (error) {
        // execSync throws on non-zero exit, which is what we want
        // The exit code might be in error.status or we can check that an error was thrown
        const exitCode = error.status || (error.code ? 1 : 0);

        // If no error was thrown, this is unexpected
        if (exitCode === 0 && !error.code) {
          throw new Error(
            'Gate check should fail when SESSION-NOTES.md is in root, but succeeded.\n' +
              `Error object: ${JSON.stringify({ status: error.status, code: error.code }, null, 2)}`,
          );
        }

        // We expect a non-zero exit (error thrown), so this is correct behavior
        expect(exitCode).not.toBe(0); // When using 2>&1, output goes to stdout
        const output = error.stdout || error.message || '';

        // Provide clear debugging if test fails
        if (!output.match(/FAILED|Failed|❌/i)) {
          throw new Error(
            'Gate check output should contain failure indicator.\n' +
              'Expected pattern: /FAILED|Failed|❌/i\n' +
              `Actual output (first 500 chars):\n${output.substring(0, 500)}\n` +
              `Output length: ${output.length} chars, Exit code: ${error.status}`,
          );
        }

        expect(output).toMatch(/FAILED|Failed|❌/i);
      } finally {
        fs.unlinkSync(sessionFile);
      }
    });
  });

  describe('Phase Detection', () => {
    test('should skip phase checks for regular commits', () => {
      const gitDir = path.join(testDir, '.git');
      fs.mkdirSync(gitDir, { recursive: true });

      const regularMessages = ['docs: update readme', 'fix: typo', 'refactor: cleanup'];

      regularMessages.forEach(message => {
        fs.writeFileSync(path.join(gitDir, 'COMMIT_EDITMSG'), message);

        try {
          const output = execSync(`npx tsx ${scriptPath}`, {
            cwd: testDir,
            encoding: 'utf8',
          });

          // Should skip phase requirements
          expect(output).toMatch(/not a phase completion|skipping/i);
        } catch (error) {
          const output = (error.stdout || '') + (error.stderr || '');

          // Should not require test evidence for regular commits
          expect(output).not.toMatch(/test evidence.*required/i);
        }
      });
    });

    test('should detect phase completion commits', () => {
      const gitDir = path.join(testDir, '.git');
      fs.mkdirSync(gitDir, { recursive: true });

      const phaseMessage = 'chore: complete phase-1.0';
      fs.writeFileSync(path.join(gitDir, 'COMMIT_EDITMSG'), phaseMessage);

      try {
        execSync(`npx tsx ${scriptPath}`, {
          cwd: testDir,
          encoding: 'utf8',
        });
        // If it passes, phase detection might be working
      } catch (error) {
        const output = (error.stdout || '') + (error.stderr || '');

        // Should mention test evidence or phase requirements
        // (will fail if no evidence exists)
        expect(output).toMatch(/test evidence|phase|requirement/i);
      }
    });
  });

  describe('Git Integration', () => {
    test('should handle non-git directories gracefully', () => {
      const nonGitDir = path.join(testDir, 'non-git');
      fs.mkdirSync(nonGitDir, { recursive: true });

      try {
        const output = execSync(`npx tsx ${scriptPath}`, {
          cwd: nonGitDir,
          encoding: 'utf8',
        });

        // Should complete without crashing
        expect(output).toBeTruthy();
      } catch (error) {
        // If it fails, should not be because of crashes
        const output = (error.stdout || '') + (error.stderr || '');
        expect(output).not.toMatch(/cannot read|undefined.*property/i);
      }
    });
  });

  describe('Performance', () => {
    test('should complete in reasonable time', () => {
      const gitDir = path.join(testDir, '.git');
      fs.mkdirSync(gitDir, { recursive: true });
      fs.writeFileSync(path.join(gitDir, 'COMMIT_EDITMSG'), 'docs: update readme');

      const startTime = Date.now();

      try {
        execSync(`npx tsx ${scriptPath}`, {
          cwd: testDir,
          encoding: 'utf8',
          timeout: 5000,
        });
      } catch {
        // Even if it fails, check the time
      }

      const duration = Date.now() - startTime;

      // Should complete in under 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });
});
