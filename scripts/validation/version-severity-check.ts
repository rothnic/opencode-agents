#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

/**
 * Get current package version
 */
function getCurrentVersion(): string {
  const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
  return packageJson.version;
}

/**
 * Compare semantic versions
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
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

interface VersionSeverityConfig {
  enabled: boolean;
  milestones: Record<
    string,
    {
      description: string;
      severity?: 'error' | 'warning' | 'info';
      rules?: string[];
      escalations?: Record<string, 'error' | 'warning' | 'info'>;
    }
  >;
}

/**
 * Get effective severity for a rule based on version milestones
 */
function getEffectiveSeverity(
  ruleName: string,
  versionSeverity: VersionSeverityConfig,
  currentVersion: string,
): 'error' | 'warning' | 'info' | null {
  if (!versionSeverity?.enabled) return null;

  const milestones = versionSeverity.milestones;
  let effectiveSeverity: 'error' | 'warning' | 'info' | null = null;

  // Sort milestone versions
  const sortedMilestones = Object.keys(milestones).sort(compareVersions);

  // Apply escalations from lowest to current version
  for (const milestoneVersion of sortedMilestones) {
    if (compareVersions(currentVersion, milestoneVersion) >= 0) {
      const milestone = milestones[milestoneVersion];

      // Check if this milestone sets initial severity
      if (milestone?.severity && milestone.rules?.includes(ruleName)) {
        effectiveSeverity = milestone?.severity ?? effectiveSeverity;
      }

      // Check if this milestone has escalations
      if (milestone?.escalations?.[ruleName]) {
        effectiveSeverity = milestone?.escalations?.[ruleName] ?? effectiveSeverity;
      }
    }
  }

  return effectiveSeverity;
}

/**
 * Apply version-based severity escalation to validation rules
 */
function applyVersionSeverity(rules: {
  versionSeverity?: VersionSeverityConfig;
  rules: Record<string, unknown>;
}): typeof rules {
  const currentVersion = getCurrentVersion();
  console.log(`📦 Current version: ${currentVersion}`);

  const versionSeverity = rules.versionSeverity;
  if (!versionSeverity?.enabled) {
    console.log('ℹ️  Version-based severity not enabled');
    return rules;
  }

  const escalatedRules = { ...rules };

  // Apply version-based severity to each rule
  for (const [ruleName, ruleConfig] of Object.entries(rules.rules)) {
    if (ruleName === 'versionSeverity') continue;

    const effectiveSeverity = getEffectiveSeverity(ruleName, versionSeverity, currentVersion);

    if (
      effectiveSeverity &&
      typeof ruleConfig === 'object' &&
      ruleConfig !== null &&
      'severity' in ruleConfig
    ) {
      const oldSeverity = (ruleConfig as { severity: 'error' | 'warning' | 'info' }).severity;
      if (oldSeverity !== effectiveSeverity) {
        console.log(`🔄 Escalating '${ruleName}': ${oldSeverity} → ${effectiveSeverity}`);
        const rule = escalatedRules.rules[ruleName] as unknown as { severity: string };
        rule.severity = effectiveSeverity;
      }
    }
  }

  return escalatedRules;
}

/**
 * Check if version milestone has been reached and show messages
 */
function checkMilestones(): void {
  const rulesPath = join(rootDir, '.opencode', 'validation-rules.json');
  const rulesFile = JSON.parse(readFileSync(rulesPath, 'utf8'));

  const currentVersion = getCurrentVersion();
  const versionSeverity = rulesFile.rules?.versionSeverity;

  if (!versionSeverity?.enabled) {
    console.log('ℹ️  Version-based severity not enabled');
    return;
  }

  console.log('\n🎯 Version Milestones:\n');

  const milestones = versionSeverity.milestones;
  const sortedMilestones = Object.keys(milestones).sort(compareVersions);

  for (const milestoneVersion of sortedMilestones) {
    const milestone = milestones[milestoneVersion];
    const comparison = compareVersions(currentVersion, milestoneVersion);

    let status = '';
    if (comparison < 0) {
      status = `⏳ Upcoming (at v${milestoneVersion})`;
    } else if (comparison === 0) {
      status = `✅ ACTIVE (v${milestoneVersion})`;
    } else {
      status = `✓ Passed (v${milestoneVersion})`;
    }

    console.log(`${status}`);
    console.log(`   ${milestone.description}`);

    if (milestone?.escalations) {
      console.log('   Escalations:');
      for (const [rule, severity] of Object.entries(milestone.escalations)) {
        console.log(`     - ${rule} → ${severity}`);
      }
    }
    console.log();
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

if (command === 'check') {
  checkMilestones();
} else if (command === 'apply') {
  const rulesPath = join(rootDir, '.opencode', 'validation-rules.json');
  const rules = JSON.parse(readFileSync(rulesPath, 'utf8'));
  applyVersionSeverity(rules);
  console.log('\n✅ Severity escalation applied based on current version');
  console.log('\nNote: This is a preview. Rules are applied at runtime during audits.');
} else {
  console.log(`
Usage: version-severity-check.ts [command]

Commands:
  check   Show current version and milestone status
  apply   Preview severity escalations for current version

Examples:
  npm run version:check    # Check milestone status
  npm run version:apply    # Preview escalations
	`);
}

export { compareVersions, getEffectiveSeverity, applyVersionSeverity };
