#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');

/**
 * Execute command and return output
 * For commands that may fail (like npm test), we still want the output
 */
function exec(cmd: string): string {
  try {
    return execSync(cmd, { cwd: rootDir, encoding: 'utf8' }).trim();
  } catch (error: unknown) {
    // If command fails, try to get output from stderr/stdout
    if (error && typeof error === 'object' && 'stdout' in error && 'stderr' in error) {
      const stdout = ((error.stdout as Buffer | string) || '').toString();
      const stderr = ((error.stderr as Buffer | string) || '').toString();
      return (stdout + stderr).trim();
    }
    return '';
  }
}

/**
 * Get package.json data
 */
function getPackageInfo() {
  const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
  return {
    name: pkg.name,
    version: pkg.version,
    type: pkg.type,
  };
}

/**
 * Get git information
 */
function getGitInfo() {
  return {
    branch: exec('git branch --show-current'),
    commits: Number.parseInt(exec('git rev-list --count HEAD') || '0', 10),
    uncommitted: exec('git status --porcelain').split('\n').filter(Boolean).length,
    lastCommit: exec('git log -1 --format="%h - %s (%ar)"'),
    remote: exec('git remote get-url origin'),
  };
}

/**
 * Get STATUS.md information
 */
function getStatusInfo() {
  const statusPath = join(rootDir, 'STATUS.md');
  if (!existsSync(statusPath)) {
    return { exists: false, age: 0, phase: 'Unknown' };
  }

  const stats = statSync(statusPath);
  const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
  const content = readFileSync(statusPath, 'utf8');

  // Extract current phase
  const phaseMatch = content.match(/\*\*Current Phase\*\*:\s*(.+)/);
  const phase = phaseMatch?.[1]?.trim() ?? 'Unknown';

  // Extract next task
  const nextMatch = content.match(/\*\*Next Task\*\*:\s*(.+)/);
  const nextTask = nextMatch?.[1]?.trim() ?? 'Unknown';

  return {
    exists: true,
    age: Math.floor(ageHours),
    phase,
    nextTask,
    stale: ageHours > 24,
  };
}

/**
 * Get test status
 */
function getTestStatus() {
  const output = exec('npm test 2>&1');

  // Try vitest format: "Tests  3 failed | 26 passed | 9 skipped (120)"
  // Note: uses 2 spaces between "Tests" and the numbers
  const testMatch = output.match(
    /Tests\s\s(\d+)\s+failed\s+\|\s+(\d+)\s+passed\s+\|\s+(\d+)\s+skipped/,
  );

  if (testMatch?.[1] && testMatch?.[2] && testMatch?.[3]) {
    const failed = Number.parseInt(testMatch[1], 10);
    const passed = Number.parseInt(testMatch[2], 10);
    const skipped = Number.parseInt(testMatch[3], 10);
    return { failed, passed, skipped, total: failed + passed + skipped };
  }

  // Fallback to individual matches
  const failedMatch = output.match(/(\d+) failed/);
  const passedMatch = output.match(/(\d+) passed/);
  const skippedMatch = output.match(/(\d+) skipped/);

  const failed = failedMatch?.[1] ? Number.parseInt(failedMatch[1], 10) : 0;
  const passed = passedMatch?.[1] ? Number.parseInt(passedMatch[1], 10) : 0;
  const skipped = skippedMatch?.[1] ? Number.parseInt(skippedMatch[1], 10) : 0;

  return {
    failed,
    passed,
    skipped,
    total: failed + passed + skipped,
  };
}

/**
 * Check validation rules
 */
function getValidationStatus() {
  const rulesPath = join(rootDir, '.opencode', 'validation-rules.json');
  if (!existsSync(rulesPath)) {
    return { exists: false };
  }

  const rules = JSON.parse(readFileSync(rulesPath, 'utf8'));
  return {
    exists: true,
    version: rules.version,
    lastUpdated: rules.lastUpdated,
  };
}

/**
 * Get project maturity level
 */
function getMaturityLevel(commits: number): {
  level: string;
  description: string;
} {
  if (commits < 100) {
    return {
      level: 'Bootstrap',
      description: 'Early stage - focus on velocity',
    };
  }
  if (commits < 500) {
    return {
      level: 'Development',
      description: 'Active development - balanced guardrails',
    };
  }
  return {
    level: 'Production',
    description: 'Mature project - strict enforcement',
  };
}

/**
 * Get version milestone status
 */
function getVersionMilestones(currentVersion: string) {
  const milestones = [
    { version: '0.1.0', desc: 'Development - warnings only' },
    { version: '0.5.0', desc: 'Pre-release - some errors' },
    { version: '1.0.0', desc: 'Production - strict enforcement' },
  ];

  return milestones.map(m => {
    const comparison = compareVersions(currentVersion, m.version);
    return {
      version: m.version,
      description: m.desc,
      status: comparison < 0 ? 'upcoming' : comparison === 0 ? 'active' : 'passed',
    };
  });
}

/**
 * Compare semantic versions
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  return 0;
}

/**
 * Get current objectives from STATUS.md
 */
function getCurrentObjectives() {
  const statusPath = join(rootDir, 'STATUS.md');
  if (!existsSync(statusPath)) return [];

  const content = readFileSync(statusPath, 'utf8');

  // Extract "In Progress" section
  const inProgressMatch = content.match(/### In Progress[^\n]*\n([\s\S]*?)(?=\n##|\n###|$)/);
  if (!inProgressMatch) return [];

  // Parse bullet points
  const bullets = (inProgressMatch?.[1] ?? '')
    .split('\n')
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('⏳'))
    .map(line => line.replace(/^[\s-⏳✅❌]+/, '').trim())
    .filter(Boolean);

  return bullets;
}

/**
 * Generate recommendations based on current state
 */
function generateRecommendations(data: {
  git: ReturnType<typeof getGitInfo>;
  status: ReturnType<typeof getStatusInfo>;
  tests: ReturnType<typeof getTestStatus>;
  pkg: ReturnType<typeof getPackageInfo>;
}) {
  const recommendations: Array<string> = [];

  // Check uncommitted changes
  if (data.git.uncommitted > 10) {
    recommendations.push(
      `⚠️  CRITICAL: ${data.git.uncommitted} uncommitted files. Make incremental commits!`,
    );
  }

  // Check STATUS.md freshness
  if (data.status.stale) {
    recommendations.push(
      `⚠️  STATUS.md is ${data.status.age} hours old. Update with current progress.`,
    );
  }

  // Check test failures
  if (data.tests.failed > 0) {
    recommendations.push(`❌ ${data.tests.failed} test(s) failing. Fix before moving forward.`);
  }

  // Check if ready for next phase
  if (data.git.uncommitted <= 5 && data.tests.failed === 0) {
    recommendations.push('✅ Repository is clean. Ready to start next objective!');
  }

  return recommendations;
}

/**
 * Print status report - split into smaller functions to reduce complexity
 */
function printHeader() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('🎯 PROJECT STATUS REPORT');
  console.log(`${'='.repeat(80)}\n`);
}

function printProjectInfo(
  pkg: ReturnType<typeof getPackageInfo>,
  maturity: ReturnType<typeof getMaturityLevel>,
  gitCommits: number,
) {
  console.log('📦 PROJECT');
  console.log(`   Name:           ${pkg.name}`);
  console.log(`   Version:        ${pkg.version}`);
  console.log(`   Type:           ${pkg.type}`);
  console.log(`   Maturity:       ${maturity.level} (${gitCommits} commits)`);
  console.log(`   Description:    ${maturity.description}\n`);
}

function printGitInfo(git: ReturnType<typeof getGitInfo>) {
  console.log('🔀 GIT');
  console.log(`   Branch:         ${git.branch}`);
  console.log(`   Commits:        ${git.commits}`);
  console.log(
    `   Uncommitted:    ${git.uncommitted} files ${git.uncommitted > 10 ? '⚠️  (>10 limit!)' : '✅'}`,
  );
  console.log(`   Last Commit:    ${git.lastCommit}`);
  console.log(`   Remote:         ${git.remote}\n`);
}

function printCurrentPhase(status: ReturnType<typeof getStatusInfo>) {
  console.log('📍 CURRENT PHASE');
  if (status.exists) {
    console.log(`   Phase:          ${status.phase}`);
    console.log(`   Next Task:      ${status.nextTask}`);
    console.log(
      `   STATUS.md Age:  ${status.age} hours ${status.stale ? '⚠️  (>24hr limit!)' : '✅'}`,
    );
  } else {
    console.log('   ❌ STATUS.md not found!');
  }
  console.log();
}

function printTestStatus(tests: ReturnType<typeof getTestStatus>) {
  console.log('🧪 TESTS');
  console.log(
    `   Status:         ${tests.passed}/${tests.total} passing ${tests.failed > 0 ? '❌' : '✅'}`,
  );
  if (tests.failed > 0) {
    console.log(`   Failed:         ${tests.failed} tests need fixing`);
  }
  if (tests.skipped > 0) {
    console.log(`   Skipped:        ${tests.skipped} tests`);
  }
  console.log();
}

function printVersionMilestones(milestones: ReturnType<typeof getVersionMilestones>) {
  console.log('📊 VERSION MILESTONES');
  for (const milestone of milestones) {
    const icon =
      milestone.status === 'active'
        ? '✅ ACTIVE'
        : milestone.status === 'upcoming'
          ? '⏳ Upcoming'
          : '✓ Passed';
    console.log(`   ${icon.padEnd(12)} v${milestone.version} - ${milestone.description}`);
  }
  console.log();
}

function printValidation(validation: ReturnType<typeof getValidationStatus>) {
  console.log('🛡️  VALIDATION');
  if (validation.exists) {
    console.log(`   Rules:          v${validation.version} (${validation.lastUpdated})`);
    console.log('   Status:         ✅ Active');
  } else {
    console.log('   Status:         ❌ validation-rules.json not found');
  }
  console.log();
}

function printObjectives(objectives: Array<string>) {
  if (objectives.length > 0) {
    console.log('🎯 IN PROGRESS');
    for (const obj of objectives) {
      console.log(`   • ${obj}`);
    }
    console.log();
  }
}

function printRecommendations(recommendations: Array<string>) {
  if (recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS');
    for (const rec of recommendations) {
      console.log(`   ${rec}`);
    }
    console.log();
  }
}

function printQuickActions() {
  console.log('⚡ QUICK ACTIONS');
  console.log('   npm run audit-repository    # Check for issues');
  console.log('   npm run version:check        # Check version milestones');
  console.log('   npm run ci                   # Full quality check');
  console.log('   npm test                     # Run tests');
  console.log('   git status                   # See uncommitted changes');
  console.log();
}

function printFooter() {
  console.log('='.repeat(80));
  console.log('Run: npm run status -- --help for more options');
  console.log(`${'='.repeat(80)}\n`);
}

function printStatus() {
  const pkg = getPackageInfo();
  const git = getGitInfo();
  const status = getStatusInfo();
  const tests = getTestStatus();
  const validation = getValidationStatus();
  const maturity = getMaturityLevel(git.commits);
  const milestones = getVersionMilestones(pkg.version);
  const objectives = getCurrentObjectives();
  const recommendations = generateRecommendations({ git, status, tests, pkg });

  printHeader();
  printProjectInfo(pkg, maturity, git.commits);
  printGitInfo(git);
  printCurrentPhase(status);
  printTestStatus(tests);
  printVersionMilestones(milestones);
  printValidation(validation);
  printObjectives(objectives);
  printRecommendations(recommendations);
  printQuickActions();
  printFooter();
}

// Run the status report
printStatus();

export { getGitInfo, getStatusInfo, getTestStatus, getMaturityLevel };
