import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { execa } from 'execa';

export interface VitestScorerOptions {
  /**
   * Relative or absolute path to the Vitest file that should be executed.
   */
  testFile: string;
  /**
   * Optional additional files that should remain immutable across the eval run.
   * The scorer will zero out the score if any of the guarded files change.
   */
  immutableFiles?: string[];
  /**
   * Working directory for Vitest execution. Defaults to the current process cwd.
   */
  projectRoot?: string;
  /**
   * Extra CLI arguments to forward to the Vitest command.
   */
  vitestArgs?: string[];
  /**
   * Custom human-friendly scorer name.
   */
  name?: string;
  /**
   * Optional description surfaced by Evalite.
   */
  description?: string;
  /**
   * Optional callback when Vitest run completes.
   */
  onComplete?: (details: VitestRunMetadata) => void | Promise<void>;
}

export interface VitestRunMetadata {
  command: string;
  cwd: string;
  reportFile: string;
  stdout: string;
  stderr: string;
  passedTests: number;
  failedTests: number;
  totalTests: number;
  failingTests: string[];
}

interface GuardedFile {
  absolutePath: string;
  displayPath: string;
  digest: string;
}

interface VitestJsonReport {
  numTotalTests?: number;
  numPassedTests?: number;
  numFailedTests?: number;
  testResults?: Array<{
    name?: string;
    tests?: Array<{
      name?: string;
      status?: string;
      errors?: Array<{ message?: string }>;
    }>;
  }>;
}

const DEFAULT_NAME = 'Vitest Functional Scorer';
const DEFAULT_DESCRIPTION =
  'Runs a Vitest suite against generated artifacts to compute pass/fail based scores.';

function toAbsolute(root: string, maybeRelative: string): string {
  return path.isAbsolute(maybeRelative) ? maybeRelative : path.join(root, maybeRelative);
}

function computeDigest(absolutePath: string): string {
  const content = readFileSync(absolutePath);
  return createHash('sha256').update(content).digest('hex');
}

function buildGuards(root: string, files: string[]): GuardedFile[] {
  return files.map(file => {
    const absolutePath = toAbsolute(root, file);
    if (!existsSync(absolutePath)) {
      throw new Error(`Guarded file does not exist: ${file}`);
    }

    return {
      absolutePath,
      displayPath: path.relative(root, absolutePath) || absolutePath,
      digest: computeDigest(absolutePath),
    };
  });
}

function ensureDirectory(directory: string): void {
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

function checkGuards(guards: GuardedFile[]): string | undefined {
  for (const guard of guards) {
    if (computeDigest(guard.absolutePath) !== guard.digest) {
      return guard.displayPath;
    }
  }
  return undefined;
}

function buildCommand(
  testFile: string,
  reportFile: string,
  extraArgs: string[] = [],
): {
  bin: string;
  args: string[];
  pretty: string;
} {
  const args = [
    'vitest',
    'run',
    testFile,
    '--reporter=json',
    `--outputFile=${reportFile}`,
    ...extraArgs,
  ];
  return { bin: 'npx', args, pretty: `npx ${args.join(' ')}` };
}

async function readVitestReport(reportFile: string): Promise<VitestJsonReport | undefined> {
  if (!existsSync(reportFile)) {
    return undefined;
  }

  const raw = await readFile(reportFile, 'utf8');
  try {
    return JSON.parse(raw) as VitestJsonReport;
  } catch (error) {
    throw new Error(`Failed to parse Vitest JSON report at ${reportFile}: ${error}`);
  }
}

function summarizeFailures(report: VitestJsonReport): string[] {
  if (!report.testResults) return [];
  const failures: string[] = [];

  for (const suite of report.testResults) {
    if (!suite.tests) continue;
    for (const test of suite.tests) {
      if (test.status?.toLowerCase() === 'pass') continue;
      const testName = [suite.name, test.name].filter(Boolean).join(' › ');
      const messages = test.errors?.map(error => error.message?.trim()).filter(Boolean) ?? [];
      failures.push(messages.length > 0 ? `${testName}: ${messages.join(' | ')}` : testName);
    }
  }

  return failures;
}

function extractOutput(result: unknown): { stdout: string; stderr: string } {
  if (typeof result === 'object' && result !== null) {
    const stdout = 'stdout' in result ? String((result as { stdout?: unknown }).stdout ?? '') : '';
    const stderr = 'stderr' in result ? String((result as { stderr?: unknown }).stderr ?? '') : '';
    if (stdout || stderr) {
      return { stdout, stderr };
    }
  }

  return { stdout: '', stderr: String(result ?? '') };
}

function slugify(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function buildScoreMetadata(
  score: number,
  command: string,
  reportFile: string,
  stdout: string,
  stderr: string,
  passedTests: number,
  failedTests: number,
  totalTests: number,
  failingTests: string[],
): { score: number; metadata: Record<string, unknown> } {
  const metadata: Record<string, unknown> = {
    command,
    reportFile,
    stdout,
    stderr,
    passedTests,
    failedTests,
    totalTests,
  };

  if (failingTests.length > 0) {
    metadata['failingTests'] = failingTests;
  }

  return { score, metadata };
}

export function createVitestScorer(options: VitestScorerOptions) {
  const root = options.projectRoot ?? process.cwd();
  const testFileAbsolute = toAbsolute(root, options.testFile);

  if (!existsSync(testFileAbsolute)) {
    throw new Error(`Vitest scorer could not find test file: ${options.testFile}`);
  }

  const guardedFiles = buildGuards(root, [options.testFile, ...(options.immutableFiles ?? [])]);
  const tmpDir = path.join(root, '.tmp', 'evals');
  ensureDirectory(tmpDir);

  const scorerName = options.name ?? DEFAULT_NAME;
  const scorerDescription = options.description ?? DEFAULT_DESCRIPTION;

  return {
    name: scorerName,
    description: scorerDescription,
    scorer: async () => {
      const guardViolation = checkGuards(guardedFiles);
      if (guardViolation) {
        return {
          score: 0,
          metadata: {
            reason: `Guarded file was modified during eval: ${guardViolation}`,
            passedTests: 0,
            failedTests: 0,
            totalTests: 0,
          },
        };
      }

      const relativeTestFile = path.relative(root, testFileAbsolute) || testFileAbsolute;
      const reportFile = path.join(
        tmpDir,
        `${slugify(path.basename(relativeTestFile, path.extname(relativeTestFile)))}-${Date.now()}.json`,
      );

      const command = buildCommand(relativeTestFile, reportFile, options.vitestArgs ?? []);
      const execution = await execa(command.bin, command.args, {
        cwd: root,
        env: { ...process.env, FORCE_COLOR: '0' },
        reject: false,
      });
      const { stdout, stderr } = extractOutput(execution);

      const report = await readVitestReport(reportFile);
      if (!report) {
        return {
          score: 0,
          metadata: {
            reason: 'Vitest report was not generated. Confirm the test path is correct.',
            command: command.pretty,
            stdout,
            stderr,
            passedTests: 0,
            failedTests: 0,
            totalTests: 0,
          },
        };
      }

      const totalTests = report.numTotalTests ?? 0;
      const passedTests = report.numPassedTests ?? 0;
      const failedTests = report.numFailedTests ?? Math.max(totalTests - passedTests, 0);
      const failingTests = summarizeFailures(report);
      const score = totalTests === 0 ? 0 : passedTests / totalTests;

      const runMetadata: VitestRunMetadata = {
        command: command.pretty,
        cwd: root,
        reportFile,
        stdout,
        stderr,
        passedTests,
        failedTests,
        totalTests,
        failingTests,
      };

      await options.onComplete?.(runMetadata);

      return buildScoreMetadata(
        score,
        command.pretty,
        reportFile,
        stdout,
        stderr,
        passedTests,
        failedTests,
        totalTests,
        failingTests,
      );
    },
  };
}
