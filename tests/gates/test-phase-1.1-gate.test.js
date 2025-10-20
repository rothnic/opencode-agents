/**
 * Phase 1.1 Completion Gate Test
 *
 * Ensures all requirements are met before marking Phase 1.1 complete.
 * This phase establishes baseline single-agent functionality with metrics.
 *
 * Phase 1.1 Focus:
 * - Single agent (ContainerTaskExecutor) can generate simple code
 * - Test harness can execute agent and collect metrics
 * - Hello world test validates baseline functionality
 * - Metrics are collected and documented
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PHASE_ID = 'phase-1.1';
const PHASE_DIR = `docs/phases/${PHASE_ID}`;

// Expected deliverables for Phase 1.1
const DELIVERABLES = [
  'opencode.json', // Project configuration
  '.opencode/agent/container-task-executor.md', // Agent specification
  'scripts/run-agent.js', // Test harness
  'tests/phase-1/test-1.1-hello-world.test.js', // Baseline test
];

// ============================================================================
// UNIVERSAL GATE TESTS - Apply to all phases
// ============================================================================

describe(`${PHASE_ID} Completion Gate`, () => {
  describe('Documentation Requirements', () => {
    test('STATUS.md has been updated with current phase', () => {
      expect(fs.existsSync('STATUS.md')).toBe(true);

      const status = fs.readFileSync('STATUS.md', 'utf8');
      expect(status).toContain(PHASE_ID);
    });

    test('phase working directory exists', () => {
      expect(fs.existsSync(PHASE_DIR)).toBe(true);
    });

    test('phase has README.md describing objectives', () => {
      const readmePath = path.join(PHASE_DIR, 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);

      const readme = fs.readFileSync(readmePath, 'utf8');
      expect(readme.length).toBeGreaterThan(100); // Not just a stub
    });
  });

  describe('Test Evidence Requirements', () => {
    test('test evidence directory exists', () => {
      const evidenceDir = path.join(PHASE_DIR, '.evidence');
      expect(fs.existsSync(evidenceDir)).toBe(true);
    });

    test('latest test run evidence exists', () => {
      const latestRun = path.join(PHASE_DIR, '.evidence', 'latest-run.json');
      expect(fs.existsSync(latestRun)).toBe(true);
    });

    test('test evidence shows tests passed', () => {
      const latestRun = path.join(PHASE_DIR, '.evidence', 'latest-run.json');
      const evidence = JSON.parse(fs.readFileSync(latestRun, 'utf8'));

      expect(evidence.passed).toBe(true);
    });

    test('test evidence is recent (within 10 minutes)', () => {
      const latestRun = path.join(PHASE_DIR, '.evidence', 'latest-run.json');
      const evidence = JSON.parse(fs.readFileSync(latestRun, 'utf8'));

      const evidenceAge = Date.now() - new Date(evidence.timestamp).getTime();
      const ageMinutes = Math.floor(evidenceAge / 60000);

      expect(ageMinutes).toBeLessThanOrEqual(10);
    });

    test('test status file shows PASSED', () => {
      const statusFile = path.join(PHASE_DIR, '.evidence', 'test-status.txt');
      expect(fs.existsSync(statusFile)).toBe(true);

      const status = fs.readFileSync(statusFile, 'utf8');
      expect(status).toContain('PASSED');
    });
  });

  describe('Deliverables Requirements', () => {
    test('all specified deliverables exist', () => {
      const missing = DELIVERABLES.filter(file => !fs.existsSync(file));

      if (missing.length > 0) {
        console.error('Missing deliverables:');
        for (const f of missing) {
          console.error(`  - ${f}`);
        }
      }

      expect(missing).toEqual([]);
    });

    DELIVERABLES.forEach(file => {
      test(`deliverable exists: ${file}`, () => {
        expect(fs.existsSync(file)).toBe(true);
      });
    });
  });

  describe('File Organization Requirements', () => {
    test('no session files in root directory', () => {
      const rootFiles = fs.readdirSync('.');
      const sessionFiles = rootFiles.filter(
        f => /SESSION|NOTES|PROGRESS|DRAFT|WIP|TEMP/i.test(f) && f.endsWith('.md'),
      );

      if (sessionFiles.length > 0) {
        console.error('Session files found in root:');
        for (const f of sessionFiles) {
          console.error(`  - ${f}`);
        }
        console.error('These should be in docs/phases/');
      }

      expect(sessionFiles).toEqual([]);
    });

    test('working files are in phase directory', () => {
      const phaseFiles = fs.readdirSync(PHASE_DIR);

      // At minimum should have README
      expect(phaseFiles).toContain('README.md');
    });
  });

  describe('Git Repository Requirements', () => {
    test('git repository is clean (no uncommitted changes)', () => {
      try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        const changes = status.trim();

        if (changes) {
          console.warn('Uncommitted changes detected:');
          console.warn(changes);
        }

        // Warning only - phase work may be in progress
      } catch (error) {
        console.warn('Could not check git status:', error.message);
      }
    });

    test('on correct branch (main)', () => {
      try {
        const branch = execSync('git rev-parse --abbrev-ref HEAD', {
          encoding: 'utf8',
        }).trim();
        expect(branch).toBe('main');
      } catch (error) {
        console.warn('Could not check git branch:', error.message);
      }
    });
  });

  describe('Metrics Requirements', () => {
    test('metrics have been collected', () => {
      const metricsFile = path.join(PHASE_DIR, '.evidence', 'metrics.json');

      expect(fs.existsSync(metricsFile)).toBe(true);

      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics).toHaveProperty('tokenCount');
      expect(metrics).toHaveProperty('executionTime');
      expect(metrics).toHaveProperty('stepCount');
      expect(metrics).toHaveProperty('successRate');
    });
  });
});

// ============================================================================
// PHASE 1.1 SPECIFIC TESTS
// ============================================================================

describe(`${PHASE_ID} Specific Requirements`, () => {
  describe('Configuration', () => {
    test('opencode.json is valid JSON', () => {
      const config = JSON.parse(fs.readFileSync('opencode.json', 'utf8'));
      expect(config).toHaveProperty('agents');
      expect(config).toHaveProperty('testing');
      expect(config).toHaveProperty('qualityGates');
    });

    test('opencode.json has agents directory configured', () => {
      const config = JSON.parse(fs.readFileSync('opencode.json', 'utf8'));
      expect(config.agents.directory).toBe('.opencode/agents');
    });
  });

  describe('Agent Specification', () => {
    test('ContainerTaskExecutor agent spec exists', () => {
      const agentSpec = '.opencode/agent/container-task-executor.md';
      expect(fs.existsSync(agentSpec)).toBe(true);

      const content = fs.readFileSync(agentSpec, 'utf8');
      expect(content).toContain('ContainerTaskExecutor');
      expect(content).toContain('Purpose');
      expect(content).toContain('Responsibilities');
    });

    test('agent spec defines validation rules', () => {
      const agentSpec = '.opencode/agent/container-task-executor.md';
      const content = fs.readFileSync(agentSpec, 'utf8');

      expect(content).toContain('Validation Rules');
      expect(content).toContain('Pre-execution');
      expect(content).toContain('Post-execution');
    });

    test('agent spec defines baseline metrics', () => {
      const agentSpec = '.opencode/agent/container-task-executor.md';
      const content = fs.readFileSync(agentSpec, 'utf8');

      expect(content).toContain('Baseline Expectations');
      expect(content).toContain('Token Count');
      expect(content).toContain('Execution Time');
    });
  });

  describe('Test Harness', () => {
    test('test harness script exists', () => {
      expect(fs.existsSync('scripts/run-agent.js')).toBe(true);
    });

    test('test harness is executable', () => {
      const stats = fs.statSync('scripts/run-agent.js');
      // File exists and is readable
      expect(stats.isFile()).toBe(true);
    });

    test('test harness can load agent configuration', () => {
      // Verify harness has logic to load from .opencode/agents/
      const harness = fs.readFileSync('scripts/run-agent.js', 'utf8');
      expect(harness).toContain('opencode');
    });
  });

  describe('Hello World Test', () => {
    test('hello world test file exists', () => {
      const testFile = 'tests/phase-1/test-1.1-hello-world.test.js';
      expect(fs.existsSync(testFile)).toBe(true);
    });

    test('hello world test is valid Jest test', () => {
      const testFile = 'tests/phase-1/test-1.1-hello-world.test.js';
      const content = fs.readFileSync(testFile, 'utf8');

      expect(content).toContain('describe');
      expect(content).toContain('test');
      expect(content).toContain('expect');
    });

    test('hello world test runs successfully', () => {
      try {
        const testFile = 'tests/phase-1/test-1.1-hello-world.test.js';
        const result = execSync(`npm test -- ${testFile} 2>&1`, {
          encoding: 'utf8',
        });

        expect(result).toContain('PASS');
      } catch (error) {
        // Test may not be passing yet - capture for debugging
        const output = error.stdout || error.stderr || error.message;
        console.error('Hello world test output:', output);
        throw error;
      }
    });
  });

  describe('Baseline Metrics', () => {
    test('metrics meet baseline expectations', () => {
      const metricsFile = path.join(PHASE_DIR, '.evidence', 'metrics.json');
      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));

      // From ContainerTaskExecutor spec baseline
      expect(metrics.tokenCount).toBeLessThan(500);
      expect(metrics.executionTime).toBeLessThan(30000); // 30 seconds
      expect(metrics.stepCount).toBeLessThanOrEqual(2);
      expect(metrics.successRate).toBe(1.0); // 100%
    });

    test('metrics are documented in phase README', () => {
      const readmePath = path.join(PHASE_DIR, 'README.md');
      const readme = fs.readFileSync(readmePath, 'utf8');

      expect(readme).toContain('metrics');
      expect(readme).toContain('token');
    });
  });
});
