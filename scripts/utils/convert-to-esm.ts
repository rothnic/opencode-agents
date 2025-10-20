#!/usr/bin/env node
/**
 * Convert CommonJS files to ES modules
 *
 * This script converts require() to import and module.exports to export
 * for all .js files in the project (except .cjs files).
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'coverage', '.git'];

function convertFile(filePath: string) {
  console.log(`Converting: ${filePath}`);

  let content = readFileSync(filePath, 'utf8');
  let modified = false;

  // Convert require() to import
  // Pattern 1: const fs = require('fs');
  content = content.replace(
    /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    (_match, varName, moduleName) => {
      modified = true;
      return `import ${varName} from '${moduleName}';`;
    },
  );

  // Pattern 2: const { a, b } = require('module');
  content = content.replace(
    /const\s*\{([^}]+)\}\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    (_match, imports, moduleName) => {
      modified = true;
      return `import { ${imports} } from '${moduleName}';`;
    },
  );

  // Convert module.exports = { ... }
  content = content.replace(/module\.exports\s*=\s*\{/g, () => {
    modified = true;
    return 'export {';
  });

  // Convert module.exports = function/class
  content = content.replace(
    /module\.exports\s*=\s*(function|class)\s+(\w+)/g,
    (_match, type, name) => {
      modified = true;
      return `export default ${type} ${name}`;
    },
  );

  // Convert exports.foo = ...
  content = content.replace(/exports\.(\w+)\s*=/g, (_match, name) => {
    modified = true;
    return `export const ${name} =`;
  });

  if (modified) {
    writeFileSync(filePath, content, 'utf8');
    console.log('  ✅ Converted');
    return true;
  }

  console.log('  ⏭️  No changes needed');
  return false;
}

function processDirectory(dir: string, depth = 0) {
  const files = readdirSync(dir);
  let convertedCount = 0;

  for (const file of files) {
    const fullPath = join(dir, file);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (!SKIP_DIRS.includes(file)) {
        convertedCount += processDirectory(fullPath, depth + 1);
      }
    } else if (stats.isFile() && extname(file) === '.js' && file !== 'convert-to-esm.js') {
      if (convertFile(fullPath)) {
        convertedCount++;
      }
    }
  }

  return convertedCount;
}

console.log('🔄 Converting CommonJS to ES modules...\n');

const convertedCount = processDirectory('.');

console.log(`\n✅ Converted ${convertedCount} files to ES modules`);
console.log('\n📝 Next steps:');
console.log('  1. Review changes: git diff');
console.log('  2. Handle __dirname/__filename manually if needed');
console.log('  3. Run: npm run lint');
console.log('  4. Run: npm test');
console.log('  5. Fix any remaining issues');
