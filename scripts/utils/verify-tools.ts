#!/usr/bin/env tsx

/**
 * Verify all development tools are installed and working via CLI
 * This ensures that VS Code extensions have corresponding CLI tools
 * for use in git hooks and CI/CD pipelines.
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

interface ToolCheck {
  name: string;
  command: string;
  required: boolean;
  category: 'core' | 'linting' | 'testing' | 'security';
}

const tools: ToolCheck[] = [
  // Core TypeScript tooling
  {
    name: 'TypeScript',
    command: 'npx tsc --version',
    required: true,
    category: 'core',
  },
  {
    name: 'tsx (TypeScript executor)',
    command: 'npx tsx --version',
    required: true,
    category: 'core',
  },

  // Testing
  {
    name: 'Vitest',
    command: 'npx vitest --version',
    required: true,
    category: 'testing',
  },

  // Linting & Formatting
  {
    name: 'Biome',
    command: 'npx biome --version',
    required: true,
    category: 'linting',
  },
  {
    name: 'markdownlint-cli2',
    command: 'npx markdownlint-cli2 --version',
    required: true,
    category: 'linting',
  },
  {
    name: 'commitlint',
    command: 'npx commitlint --version',
    required: true,
    category: 'linting',
  },

  // Security & Quality
  {
    name: 'Madge (circular deps)',
    command: 'npx madge --version',
    required: true,
    category: 'security',
  },
  {
    name: 'npm audit',
    command: 'npm audit --help',
    required: true,
    category: 'security',
  },
];

console.log('🔍 Verifying Development Tools\n');
console.log('═'.repeat(60));

let allRequired = true;
const results: Record<string, { passed: number; failed: number }> = {
  core: { passed: 0, failed: 0 },
  linting: { passed: 0, failed: 0 },
  testing: { passed: 0, failed: 0 },
  security: { passed: 0, failed: 0 },
};

// Group by category
const categories = {
  core: tools.filter(t => t.category === 'core'),
  testing: tools.filter(t => t.category === 'testing'),
  linting: tools.filter(t => t.category === 'linting'),
  security: tools.filter(t => t.category === 'security'),
};

for (const [category, categoryTools] of Object.entries(categories)) {
  console.log(`\n📦 ${category.charAt(0).toUpperCase() + category.slice(1)}`);
  console.log('─'.repeat(60));

  for (const tool of categoryTools) {
    try {
      const output = execSync(tool.command, {
        encoding: 'utf8',
        stdio: 'pipe',
      });
      const version = output.trim().split('\n')[0];
      console.log(`  ✅ ${tool.name.padEnd(30)} ${version}`);
      const result = results[category];
      if (result) result.passed++;
    } catch (_error) {
      const result = results[category];
      if (!result) continue;

      if (tool.required) {
        console.error(`  ❌ ${tool.name.padEnd(30)} NOT FOUND (required)`);
        result.failed++;
        allRequired = false;
      } else {
        console.warn(`  ⚠️  ${tool.name.padEnd(30)} NOT FOUND (optional)`);
      }
    }
  }
}

// Check git hooks
console.log('\n🪝 Git Hooks');
console.log('─'.repeat(60));

const hooks = [
  { path: '.git/hooks/pre-commit', name: 'pre-commit' },
  { path: '.git/hooks/commit-msg', name: 'commit-msg' },
];

let hooksOk = true;
for (const hook of hooks) {
  if (existsSync(hook.path)) {
    console.log(`  ✅ ${hook.name.padEnd(30)} exists`);
  } else {
    console.error(`  ❌ ${hook.name.padEnd(30)} NOT FOUND`);
    hooksOk = false;
  }
}

// Check VS Code extensions (recommendations)
console.log('\n🎨 VS Code Extensions (Recommended)');
console.log('─'.repeat(60));

const extensions = [
  { id: 'biomejs.biome', name: 'Biome' },
  { id: 'davidanson.vscode-markdownlint', name: 'markdownlint' },
  { id: 'sonarsource.sonarlint-vscode', name: 'SonarLint' },
];

console.log('  Install these for IDE integration:');
for (const ext of extensions) {
  console.log(`    code --install-extension ${ext.id}`);
}

// Summary
console.log('\n═'.repeat(60));
console.log('📊 Summary\n');

for (const [category, result] of Object.entries(results)) {
  const total = result.passed + result.failed;
  const status = result.failed === 0 ? '✅' : '❌';
  console.log(`  ${status} ${category.padEnd(12)} ${result.passed}/${total} tools working`);
}

if (!hooksOk) {
  console.log('\n⚠️  Git hooks missing. Run:');
  console.log('    cp docs/templates/pre-commit .git/hooks/pre-commit');
  console.log('    cp docs/templates/commit-msg .git/hooks/commit-msg');
  console.log('    chmod +x .git/hooks/*');
}

console.log('═'.repeat(60));

if (!allRequired) {
  console.error('\n❌ Some required tools are missing!');
  console.error('   Run: npm install');
  process.exit(1);
}

if (!hooksOk) {
  console.warn('\n⚠️  Git hooks not installed!');
  console.warn('   Commits may bypass quality checks.');
  process.exit(1);
}

console.log('\n✅ All required tools verified!\n');
console.log('Next steps:');
console.log('  • Run tests: npm test');
console.log('  • Type check: npm run type-check');
console.log('  • Lint code: npm run lint');
console.log('  • Full CI check: npm run ci\n');
