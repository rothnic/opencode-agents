#!/usr/bin/env node

/**
 * Markdown Lint Auto-Fix
 *
 * Automatically fixes common markdown lint issues:
 * - MD040: Add language to fenced code blocks
 * - MD036: Convert emphasis to headings
 * - MD029: Fix ordered list prefixes
 *
 * Usage:
 *   npx tsx scripts/utils/fix-markdown-lint.ts [file-pattern]
 *
 * Examples:
 *   npx tsx scripts/utils/fix-markdown-lint.ts
 *   npx tsx scripts/utils/fix-markdown-lint.ts 'docs/*.md'
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';

// Get all markdown files
function getMarkdownFiles(pattern?: string): string[] {
  if (pattern) {
    try {
      const output = execSync(`find . -path "${pattern}" -type f`, {
        encoding: 'utf8',
      });
      return output.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  // Default: all markdown files in project
  try {
    const output = execSync('find . -name "*.md" -type f | grep -v node_modules', {
      encoding: 'utf8',
    });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

// Fix MD040: Add language to fenced code blocks
function fixFencedCodeBlocks(content: string): string {
  // Find code blocks without language
  return content.replace(/^```\s*$/gm, '```text');
}

// Fix MD036: Convert emphasis to heading
function fixEmphasisAsHeading(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prevLine = i > 0 ? lines[i - 1] : '';
    const nextLine = i < lines.length - 1 ? lines[i + 1] : '';

    // Check if line is emphasis used as heading
    if (line?.match(/^\*[^*]+\*$/) && prevLine === '' && nextLine === '') {
      // Convert to proper heading
      result.push(`## ${line.slice(1, -1)}`);
    } else {
      result.push(line ?? '');
    }
  }

  return result.join('\n');
}

// Fix MD029: Fix ordered list prefixes
function fixOrderedListPrefixes(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let inList = false;
  let listCounter = 1;

  for (const line of lines) {
    const match = line.match(/^(\s*)(\d+)\.\s+(.+)$/);

    if (match) {
      const [, indent, , text] = match;
      if (!inList) {
        inList = true;
        listCounter = 1;
      }
      result.push(`${indent ?? ''}${listCounter}. ${text ?? ''}`);
      listCounter++;
    } else if (line.trim() === '') {
      // Blank line ends list
      inList = false;
      listCounter = 1;
      result.push(line);
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

// Apply all fixes
function fixMarkdownFile(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let fixed = content;

    // Apply fixes
    fixed = fixFencedCodeBlocks(fixed);
    fixed = fixEmphasisAsHeading(fixed);
    fixed = fixOrderedListPrefixes(fixed);

    // Only write if changed
    if (fixed !== content) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fixing ${filePath}: ${errorMessage}`);
    return false;
  }
}

// Main
function main(): void {
  const args = process.argv.slice(2);
  const pattern = args[0];

  console.log('🔧 Markdown Lint Auto-Fix\n');

  const files = getMarkdownFiles(pattern);
  let fixedCount = 0;

  console.log(`Found ${files.length} markdown files\n`);

  for (const file of files) {
    const wasFixed = fixMarkdownFile(file);
    if (wasFixed) {
      console.log(`✓ Fixed: ${file}`);
      fixedCount++;
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} files`);
  console.log(`   Skipped ${files.length - fixedCount} files (no changes needed)`);
}

main();
