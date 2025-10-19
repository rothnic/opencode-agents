#!/usr/bin/env tsx
/**
 * Comprehensive repository state audit
 * Uses configurable rules from .opencode/validation-rules.json
 *
 * Usage:
 *   npm run audit-repository
 *   npm run audit-repository -- --fix
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

interface Issue {
  type: 'error' | 'warning' | 'info';
  category: string;
  file: string;
  description: string;
  autoFixable: boolean;
  ruleNeeded?: string;
  fix?: () => void;
}

const issues: Issue[] = [];

// Load validation rules
const rulesPath = join(rootDir, '.opencode/validation-rules.json');
if (!existsSync(rulesPath)) {
  console.error('❌ Validation rules not found: .opencode/validation-rules.json');
  process.exit(1);
}

interface PatternConfig {
  replacement: string;
  message: string;
  searchIn: string[];
  exceptions?: string[];
}

interface ValidationRules {
  version: string;
  rules: {
    outdatedReferences: {
      enabled: boolean;
      severity: 'error' | 'warning' | 'info';
      patterns: {
        dependencies: Record<string, PatternConfig>;
        models: Record<string, PatternConfig>;
      };
    };
    backupFiles: {
      enabled: boolean;
      severity: 'error' | 'warning' | 'info';
      patterns: string[];
      autoFix: string;
      message: string;
    };
    statusFreshness: {
      enabled: boolean;
      severity: 'error' | 'warning' | 'info';
      file: string;
      maxAgeHours: number;
      requiredSections: string[];
      message: string;
    };
    uncommittedChanges: {
      enabled: boolean;
      severity: 'error' | 'warning' | 'info';
      maxFiles: number;
      message: string;
    };
    requiredFiles: {
      enabled: boolean;
      severity: 'error' | 'warning' | 'info';
      files: Record<string, { purpose?: string; template?: string; location?: string }>;
    };
    modelDefaults: {
      enabled?: boolean;
      recommendations: Record<string, string>;
    };
  };
  excludePaths: string[];
}

const rules = JSON.parse(readFileSync(rulesPath, 'utf8')) as ValidationRules;

// 1. Find backup files (antipattern)
function findBackupFiles(): void {
  if (!rules.rules.backupFiles.enabled) return;

  const patterns = rules.rules.backupFiles.patterns;

  for (const pattern of patterns) {
    try {
      const cmd = `find . -name "${pattern}" -not -path "*/node_modules/*" -not -path "*/.git/*"`;
      const files = execSync(cmd, {
        encoding: 'utf8',
        cwd: rootDir,
      })
        .trim()
        .split('\n')
        .filter(Boolean);

      for (const file of files) {
        issues.push({
          type: rules.rules.backupFiles.severity,
          category: 'backup-files',
          file,
          description: rules.rules.backupFiles.message,
          autoFixable: rules.rules.backupFiles.autoFix === 'delete',
          fix:
            rules.rules.backupFiles.autoFix === 'delete'
              ? () => {
                  const fullPath = join(rootDir, file);
                  unlinkSync(fullPath);
                  console.log(`   🗑️  Deleted: ${file}`);
                }
              : undefined,
        });
      }
    } catch {
      // No files found
    }
  }
}

// 2. Find outdated dependency references
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Will refactor in next iteration
function findOutdatedReferences(): void {
  if (!rules.rules.outdatedReferences.enabled) return;

  const categories = ['dependencies', 'models'];

  for (const category of categories) {
    const patterns =
      category === 'dependencies'
        ? rules.rules.outdatedReferences.patterns.dependencies
        : rules.rules.outdatedReferences.patterns.models;

    for (const [outdated, config] of Object.entries(patterns)) {
      for (const searchPattern of config.searchIn) {
        try {
          const cmd = `grep -r "${outdated}" --include="${searchPattern}" . 2>/dev/null || true`;
          const result = execSync(cmd, {
            encoding: 'utf8',
            cwd: rootDir,
          }).trim();

          if (result) {
            const lines = result.split('\n');
            const fileMatches = new Map<string, number>();

            for (const line of lines) {
              const colonIndex = line.indexOf(':');
              if (colonIndex === -1) continue;

              const file = line.substring(0, colonIndex);
              if (
                file.includes('node_modules') ||
                file.includes('.git') ||
                file.includes('audit-repository')
              ) {
                continue;
              }

              fileMatches.set(file, (fileMatches.get(file) || 0) + 1);
            }

            for (const [file, count] of fileMatches) {
              issues.push({
                type: rules.rules.outdatedReferences.severity,
                category: `outdated-${category}`,
                file,
                description: `${count}x reference to '${outdated}'. ${config.message}`,
                autoFixable: false,
                ruleNeeded: `Update to ${config.replacement}`,
              });
            }
          }
        } catch {
          // Pattern not found
        }
      }
    }
  }
}

// 3. Check STATUS.md freshness
function checkStatusMd(): void {
  if (!rules.rules.statusFreshness.enabled) return;

  const statusPath = join(rootDir, rules.rules.statusFreshness.file);

  if (!existsSync(statusPath)) {
    issues.push({
      type: 'error',
      category: 'missing-file',
      file: rules.rules.statusFreshness.file,
      description: 'STATUS.md is missing. Project tracking lost.',
      autoFixable: false,
      ruleNeeded: 'Create from template',
    });
    return;
  }

  const content = readFileSync(statusPath, 'utf8');
  const stats = statSync(statusPath);
  const hoursSinceUpdate = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);

  if (hoursSinceUpdate > rules.rules.statusFreshness.maxAgeHours) {
    issues.push({
      type: rules.rules.statusFreshness.severity,
      category: 'stale-status',
      file: rules.rules.statusFreshness.file,
      description: `STATUS.md not updated in ${Math.floor(hoursSinceUpdate)} hours. ${rules.rules.statusFreshness.message}`,
      autoFixable: false,
      ruleNeeded: 'Update with current progress',
    });
  }

  // Check required sections
  for (const section of rules.rules.statusFreshness.requiredSections) {
    if (!content.includes(section)) {
      issues.push({
        type: 'warning',
        category: 'incomplete-status',
        file: rules.rules.statusFreshness.file,
        description: `Missing required section: "${section}"`,
        autoFixable: false,
      });
    }
  }
}

// 4. Check for uncommitted changes
function checkUncommittedChanges(): void {
  if (!rules.rules.uncommittedChanges.enabled) return;

  try {
    const status = execSync('git status --porcelain', {
      encoding: 'utf8',
      cwd: rootDir,
    });
    const lines = status.trim().split('\n').filter(Boolean);

    if (lines.length > rules.rules.uncommittedChanges.maxFiles) {
      issues.push({
        type: rules.rules.uncommittedChanges.severity,
        category: 'too-many-uncommitted',
        file: 'git working directory',
        description: `${lines.length} uncommitted changes (max: ${rules.rules.uncommittedChanges.maxFiles}). ${rules.rules.uncommittedChanges.message}`,
        autoFixable: false,
        ruleNeeded: 'Make incremental commits',
      });
    }
  } catch {
    // Not a git repo or no changes
  }
}

// 5. Check for required files
function checkRequiredFiles(): void {
  if (!rules.rules.requiredFiles.enabled) return;

  for (const [filename, config] of Object.entries(rules.rules.requiredFiles.files)) {
    const filePath = config.location || filename;
    const fullPath = join(rootDir, filePath);

    if (!existsSync(fullPath)) {
      issues.push({
        type: rules.rules.requiredFiles.severity,
        category: 'missing-file',
        file: filePath,
        description: `${config.purpose}. Should be created from template.`,
        autoFixable: existsSync(join(rootDir, config.template || '')),
        ruleNeeded: config.template ? `Copy from ${config.template}` : 'Create manually',
      });
    }
  }
}

// 6. Check opencode.json model configuration
function checkOpencodeJson(): void {
  const opencodePath = join(rootDir, 'opencode.json');

  if (!existsSync(opencodePath)) {
    issues.push({
      type: 'error',
      category: 'missing-config',
      file: 'opencode.json',
      description: 'opencode.json missing. Project configuration required.',
      autoFixable: false,
    });
    return;
  }

  const content = JSON.parse(readFileSync(opencodePath, 'utf8'));

  // Check test framework
  if (content.testingFramework && content.testingFramework !== 'vitest') {
    issues.push({
      type: 'error',
      category: 'outdated-config',
      file: 'opencode.json',
      description: `testingFramework should be "vitest", not "${content.testingFramework}"`,
      autoFixable: true,
      fix: () => {
        content.testingFramework = 'vitest';
        writeFileSync(opencodePath, `${JSON.stringify(content, null, 2)}\n`);
        console.log('   ✅ Updated testingFramework to "vitest"');
      },
    });
  }

  // Check model configuration
  if (rules.rules.modelDefaults.enabled) {
    const recommended = rules.rules.modelDefaults.recommendations['default'];

    if (
      content.defaultModel &&
      !content.defaultModel.includes('4o') &&
      !content.defaultModel.includes('claude-3')
    ) {
      issues.push({
        type: 'warning',
        category: 'outdated-model-config',
        file: 'opencode.json',
        description: `Consider updating defaultModel to "${recommended}" (current: ${content.defaultModel})`,
        autoFixable: true,
        fix: () => {
          content.defaultModel = recommended;
          writeFileSync(opencodePath, `${JSON.stringify(content, null, 2)}\n`);
          console.log(`   ✅ Updated defaultModel to "${recommended}"`);
        },
      });
    }
  }
}

// Run all checks
console.log('🔍 Auditing repository state...');
console.log(`   Using rules: .opencode/validation-rules.json (v${rules.version})\n`);

findBackupFiles();
findOutdatedReferences();
checkStatusMd();
checkUncommittedChanges();
checkRequiredFiles();
checkOpencodeJson();

// Check for --fix flag
const shouldFix = process.argv.includes('--fix');

// Report results
console.log('📊 Audit Results:\n');

const byCategory = issues.reduce(
  (acc, issue) => {
    const categoryIssues = acc[issue.category] || [];
    categoryIssues.push(issue);
    acc[issue.category] = categoryIssues;
    return acc;
  },
  {} as Record<string, Issue[]>,
);

for (const [category, categoryIssues] of Object.entries(byCategory)) {
  console.log(`\n## ${category.toUpperCase().replace(/-/g, ' ')}\n`);

  for (const issue of categoryIssues) {
    const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${icon} ${issue.file}`);
    console.log(`   ${issue.description}`);

    if (issue.autoFixable && shouldFix && issue.fix) {
      try {
        issue.fix();
      } catch (error) {
        console.error(`   ❌ Auto-fix failed: ${error}`);
      }
    } else if (issue.autoFixable) {
      console.log('   ✅ Auto-fixable (run with --fix)');
    }

    if (issue.ruleNeeded) {
      console.log(`   📝 ${issue.ruleNeeded}`);
    }
    console.log();
  }
}

// Summary
const errors = issues.filter(i => i.type === 'error').length;
const warnings = issues.filter(i => i.type === 'warning').length;
const autoFixable = issues.filter(i => i.autoFixable).length;

console.log(`\n${'='.repeat(60)}`);
console.log(`Total issues: ${issues.length}`);
console.log(`  Errors: ${errors}`);
console.log(`  Warnings: ${warnings}`);
console.log(`  Auto-fixable: ${autoFixable}`);
console.log('='.repeat(60));

if (shouldFix && autoFixable > 0) {
  console.log('\n✅ Auto-fixes applied!');
  console.log('   Run audit again to verify.\n');
}

if (!shouldFix && autoFixable > 0) {
  console.log('\n💡 Run with --fix to automatically fix issues:\n');
  console.log('   npm run audit-repository -- --fix\n');
}

if (errors > 0) {
  console.log('\n❌ Critical issues found. See above for details.\n');
  process.exit(1);
}

if (warnings > 0) {
  console.log('\n⚠️  Warnings found. Consider addressing them.\n');
  process.exit(0);
}

console.log('\n✅ Repository audit passed!\n');
