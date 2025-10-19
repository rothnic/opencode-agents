#!/usr/bin/env node

/**
 * Convert .js files to .ts
 *
 * This script renames .js files to .ts and adds basic type annotations
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');

const filesToConvert = [
  'scripts/agents/blog-maintenance-agent.js',
  'scripts/agents/run-agent.js',
  'scripts/validation/check-document-overlap.js',
  'scripts/validation/docs-conventions.js',
  'scripts/gates/file-location-check.js',
  'scripts/gates/gate-check-file-size.js',
  'scripts/gates/gate-check.js',
  'scripts/gates/init-work-verification.js',
  'scripts/gates/pre-merge-check.js',
  'scripts/testing/test-evidence.js',
  'scripts/utils/convert-to-esm.js',
];

function convertFile(relPath: string): void {
  const jsPath = join(rootDir, relPath);
  const tsPath = jsPath.replace(/\.js$/, '.ts');

  if (!existsSync(jsPath)) {
    console.log(`⏭️  Skip: ${relPath} (not found)`);
    return;
  }

  console.log(`📝 Converting: ${relPath}`);

  // Read content
  let content = readFileSync(jsPath, 'utf8');

  // Basic type annotations for common patterns
  content = content
    // Add types to function parameters that are obviously strings/numbers
    .replace(/function (\w+)\((\w+)\) \{/g, 'function $1($2: string) {')
    .replace(/function (\w+)\((\w+), (\w+)\) \{/g, 'function $1($2: string, $3: string) {')
    // Add return type annotations for functions that return boolean
    .replace(/function is(\w+)\(/g, 'function is$1(')
    .replace(/function has(\w+)\(/g, 'function has$1(')
    .replace(/function check(\w+)\(/g, 'function check$1(');

  // Write TypeScript file
  writeFileSync(tsPath, content, 'utf8');

  // Remove old JS file
  execSync(`rm "${jsPath}"`, { cwd: rootDir });

  console.log(`✅ Created: ${relPath.replace(/\.js$/, '.ts')}`);
}

function updatePackageJson(): void {
  const pkgPath = join(rootDir, 'package.json');
  let content = readFileSync(pkgPath, 'utf8');

  // Replace .js with .ts in script paths
  content = content.replace(/scripts\/[^"]+\.js/g, match => {
    return match.replace(/\.js$/, '.ts');
  });

  writeFileSync(pkgPath, content, 'utf8');
  console.log('✅ Updated package.json');
}

function updateTestFiles(): void {
  const testFiles = [
    'tests/scripts/gate-check.test.js',
    'tests/scripts/file-location-check.test.js',
    'tests/scripts/test-evidence.test.js',
  ];

  for (const testFile of testFiles) {
    const testPath = join(rootDir, testFile);
    if (!existsSync(testPath)) continue;

    let content = readFileSync(testPath, 'utf8');
    content = content.replace(/\.js(['"])/g, '.ts$1');
    writeFileSync(testPath, content, 'utf8');
    console.log(`✅ Updated: ${testFile}`);
  }
}

console.log('🔄 Converting .js files to .ts...\n');

for (const file of filesToConvert) {
  convertFile(file);
}

console.log('\n📦 Updating package.json...');
updatePackageJson();

console.log('\n🧪 Updating test files...');
updateTestFiles();

console.log('\n✅ Conversion complete!');
console.log('\n📋 Next steps:');
console.log('   1. Run: npm run type-check');
console.log('   2. Fix any TypeScript errors');
console.log('   3. Run: npm run lint:fix');
console.log('   4. Run: npm test');
