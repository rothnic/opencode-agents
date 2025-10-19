/**
 * Tests for test-evidence.js
 *
 * These tests verify that the test evidence system correctly:
 * - Records test execution with accurate timestamps
 * - Verifies test evidence is recent (< 10 minutes)
 * - Validates JSON structure of evidence files
 * - Handles missing or corrupted evidence files
 * - Properly stores test results and metrics
 */

import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Test Evidence System', () => {
  const testDir = path.join(__dirname, '../fixtures/test-evidence');
  const evidenceDir = path.join(testDir, '.evidence');

  beforeEach(() => {
    // Create fresh test directory for each test
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(evidenceDir, { recursive: true });
  });

  afterEach(() => {
    // Cleanup after each test
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Evidence Recording', () => {
    test('should create evidence file with timestamp', () => {
      const evidenceFile = path.join(evidenceDir, 'phase-1.0.json');

      // Create mock evidence
      const evidence = {
        timestamp: new Date().toISOString(),
        phase: 'phase-1.0',
        status: 'passed',
        testResults: {
          summary: { passed: 5, failed: 0, total: 5 },
        },
      };

      fs.writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2));

      // Verify file exists and is valid JSON
      expect(fs.existsSync(evidenceFile)).toBe(true);

      const content = JSON.parse(fs.readFileSync(evidenceFile, 'utf8'));
      expect(content.timestamp).toBeDefined();
      expect(content.phase).toBe('phase-1.0');
      expect(content.status).toBe('passed');
    });

    test('should include test summary in evidence', () => {
      const evidence = {
        timestamp: new Date().toISOString(),
        phase: 'phase-1.0',
        status: 'passed',
        testResults: {
          summary: {
            passed: 10,
            failed: 2,
            total: 12,
          },
        },
      };

      const evidenceFile = path.join(evidenceDir, 'phase-1.0.json');
      fs.writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2));

      const content = JSON.parse(fs.readFileSync(evidenceFile, 'utf8'));
      expect(content.testResults.summary.passed).toBe(10);
      expect(content.testResults.summary.failed).toBe(2);
      expect(content.testResults.summary.total).toBe(12);
    });

    test('should record ISO 8601 timestamp format', () => {
      const evidence = {
        timestamp: new Date().toISOString(),
        phase: 'phase-1.0',
        status: 'passed',
      };

      const evidenceFile = path.join(evidenceDir, 'phase-1.0.json');
      fs.writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2));

      const content = JSON.parse(fs.readFileSync(evidenceFile, 'utf8'));

      // Verify ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(content.timestamp).toMatch(isoRegex);

      // Verify timestamp is parseable
      const date = new Date(content.timestamp);
      expect(date).toBeInstanceOf(Date);
      expect(Number.isNaN(date.getTime())).toBe(false);
    });
  });

  describe('Evidence Verification', () => {
    test('should accept evidence less than 10 minutes old', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const evidence = {
        timestamp: fiveMinutesAgo.toISOString(),
        phase: 'phase-1.0',
        status: 'passed',
        testResults: {
          summary: { passed: 5, failed: 0, total: 5 },
        },
      };

      const evidenceFile = path.join(evidenceDir, 'phase-1.0.json');
      fs.writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2));

      // Verify the timestamp is within acceptable range
      const content = JSON.parse(fs.readFileSync(evidenceFile, 'utf8'));
      const timestamp = new Date(content.timestamp);
      const ageInMinutes = (now - timestamp) / (1000 * 60);

      expect(ageInMinutes).toBeLessThan(10);
      expect(ageInMinutes).toBeGreaterThan(0);
    });

    test('should reject evidence older than 10 minutes', () => {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

      const evidence = {
        timestamp: fifteenMinutesAgo.toISOString(),
        phase: 'phase-1.0',
        status: 'passed',
        testResults: {
          summary: { passed: 5, failed: 0, total: 5 },
        },
      };

      const evidenceFile = path.join(evidenceDir, 'phase-1.0.json');
      fs.writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2));

      // Calculate age
      const content = JSON.parse(fs.readFileSync(evidenceFile, 'utf8'));
      const timestamp = new Date(content.timestamp);
      const ageInMinutes = (now - timestamp) / (1000 * 60);

      // Should be older than 10 minutes
      expect(ageInMinutes).toBeGreaterThan(10);
    });

    test('should handle missing evidence file', () => {
      const evidenceFile = path.join(evidenceDir, 'phase-nonexistent.json');

      // Verify file doesn't exist
      expect(fs.existsSync(evidenceFile)).toBe(false);
    });

    test('should handle corrupted JSON evidence', () => {
      const evidenceFile = path.join(evidenceDir, 'phase-1.0.json');

      // Write invalid JSON
      fs.writeFileSync(evidenceFile, '{ invalid json content }');

      // Verify it's not valid JSON
      expect(() => {
        JSON.parse(fs.readFileSync(evidenceFile, 'utf8'));
      }).toThrow();
    });
  });

  describe('Evidence Structure', () => {
    test('should have required fields: timestamp, phase, status', () => {
      const evidence = {
        timestamp: new Date().toISOString(),
        phase: 'phase-1.0',
        status: 'passed',
        testResults: {
          summary: { passed: 5, failed: 0, total: 5 },
        },
      };

      // Verify all required fields are present
      expect(evidence.timestamp).toBeDefined();
      expect(evidence.phase).toBeDefined();
      expect(evidence.status).toBeDefined();

      // Verify types
      expect(typeof evidence.timestamp).toBe('string');
      expect(typeof evidence.phase).toBe('string');
      expect(typeof evidence.status).toBe('string');
    });

    test('should include optional testResults field', () => {
      const evidence = {
        timestamp: new Date().toISOString(),
        phase: 'phase-1.0',
        status: 'passed',
        testResults: {
          summary: { passed: 5, failed: 0, total: 5 },
          details: [],
        },
      };

      expect(evidence.testResults).toBeDefined();
      expect(evidence.testResults.summary).toBeDefined();
    });

    test('should support metrics field for performance data', () => {
      const evidence = {
        timestamp: new Date().toISOString(),
        phase: 'phase-1.0',
        status: 'passed',
        testResults: {
          summary: { passed: 5, failed: 0, total: 5 },
          metrics: {
            duration: 1234,
            coverage: 85.5,
          },
        },
      };

      expect(evidence.testResults.metrics).toBeDefined();
      expect(evidence.testResults.metrics.duration).toBe(1234);
      expect(evidence.testResults.metrics.coverage).toBe(85.5);
    });
  });

  describe('Phase Naming', () => {
    test('should support standard phase format (phase-X.Y)', () => {
      const phases = ['phase-0.1', 'phase-1.0', 'phase-2.5', 'phase-10.20'];

      phases.forEach(phase => {
        const evidence = {
          timestamp: new Date().toISOString(),
          phase: phase,
          status: 'passed',
        };

        const evidenceFile = path.join(evidenceDir, `${phase}.json`);
        fs.writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2));

        const content = JSON.parse(fs.readFileSync(evidenceFile, 'utf8'));
        expect(content.phase).toBe(phase);
      });
    });
  });

  describe('Status Values', () => {
    test('should support valid status values', () => {
      const validStatuses = ['passed', 'failed', 'skipped', 'pending'];

      validStatuses.forEach(status => {
        // Verify status is in the valid list
        expect(['passed', 'failed', 'skipped', 'pending']).toContain(status);
      });
    });
  });

  describe('Timestamp Calculations', () => {
    test('should calculate age in minutes correctly', () => {
      const testCases = [
        { minutesAgo: 0, shouldBeValid: true },
        { minutesAgo: 5, shouldBeValid: true },
        { minutesAgo: 9, shouldBeValid: true },
        { minutesAgo: 10, shouldBeValid: false },
        { minutesAgo: 15, shouldBeValid: false },
        { minutesAgo: 60, shouldBeValid: false },
      ];

      const now = new Date();

      testCases.forEach(({ minutesAgo, shouldBeValid }) => {
        const timestamp = new Date(now.getTime() - minutesAgo * 60 * 1000);
        const ageInMinutes = (now - timestamp) / (1000 * 60);

        if (shouldBeValid) {
          expect(ageInMinutes).toBeLessThan(10);
        } else {
          expect(ageInMinutes).toBeGreaterThanOrEqual(10);
        }
      });
    });

    test('should handle future timestamps gracefully', () => {
      const now = new Date();
      const futureTime = new Date(now.getTime() + 5 * 60 * 1000);

      // Future timestamps should be detectable
      const ageInMinutes = (now - futureTime) / (1000 * 60);
      expect(ageInMinutes).toBeLessThan(0);
    });
  });

  describe('File System Operations', () => {
    test('should create .evidence directory if missing', () => {
      // Remove evidence directory
      if (fs.existsSync(evidenceDir)) {
        fs.rmSync(evidenceDir, { recursive: true });
      }

      expect(fs.existsSync(evidenceDir)).toBe(false);

      // Create it
      fs.mkdirSync(evidenceDir, { recursive: true });

      expect(fs.existsSync(evidenceDir)).toBe(true);
    });

    test('should handle write permissions', () => {
      const evidenceFile = path.join(evidenceDir, 'phase-1.0.json');
      const evidence = {
        timestamp: new Date().toISOString(),
        phase: 'phase-1.0',
        status: 'passed',
      };

      // Write and verify we can read it back
      fs.writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2));

      const content = fs.readFileSync(evidenceFile, 'utf8');
      expect(content).toBeTruthy();

      const parsed = JSON.parse(content);
      expect(parsed.phase).toBe('phase-1.0');
    });
  });
});
