#!/usr/bin/env node
/**
 * Document Overlap Detector
 *
 * Identifies potentially duplicate or overlapping documentation files.
 * Helps prevent documentation sprawl where agents create multiple docs
 * about th  return matrix[str2.length]![str1.length]!;
}

function setOverlap(set1: string[], set2: string[]): number {
  if (set1.length === 0 && set2.length === 0) {
    return 0;
  }

  const intersection = set1.filter((item: string) => set2.includes(item));
  const union = new Set([...set1, ...set2]);

  return intersection.length / union.size;
}with different names.
 *
 * Detection methods:
 * 1. Title similarity (e.g., "test-strategy" vs "testing-approach")
 * 2. Heading overlap (same section names)
 * 3. Keyword similarity (similar topics)
 *
 * Usage:
 *   node scripts/check-document-overlap.js [--threshold 0.7]
 *
 * Exit Codes:
 *   0 - No overlaps detected (warning only, doesn't block)
 *   1 - Overlaps detected (requires human review)
 */

import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// TYPES
// ============================================================================

interface Document {
  path: string;
  title: string;
  headings: string[];
  keywords: string[];
  content: string;
  lines: number;
  modified: Date;
}

interface Overlap {
  doc1: Document;
  doc2: Document;
  similarity: number;
  reason: string;
  suggestion: {
    action: string;
    keepFile: string;
    mergeFrom: string;
    reason: string;
    steps: string[];
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_THRESHOLD = 0.7; // 70% similarity triggers warning
const DOCS_DIR = 'docs';

// Ignore these files
const IGNORE_FILES = [
  'README.md',
  'GETTING-STARTED.md',
  'SUMMARY.md',
  'docs/templates/**',
  'docs/blog/**',
];

// ============================================================================
// FILE DISCOVERY
// ============================================================================

function getAllDocs(): Document[] {
  const docs: Document[] = [];
  scanDocsDirectory(DOCS_DIR, docs);
  return docs;
}

function scanDocsDirectory(dir: string, docs: Document[]): void {
  if (!fs.existsSync(dir)) {
    return;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDocsDirectory(fullPath, docs);
    } else if (item.endsWith('.md')) {
      // Check if ignored
      const shouldIgnore = IGNORE_FILES.some(pattern => {
        const regex = pattern.replace(/\./g, '\\.').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
        return new RegExp(`^${regex}$`).test(fullPath);
      });

      if (!shouldIgnore) {
        docs.push(parseDocument(fullPath));
      }
    }
  }
}

function parseDocument(filePath: string): Document {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Extract title (first h1)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1] ? titleMatch[1] : path.basename(filePath, '.md');

  // Extract headings (h2, h3)
  const headings: string[] = [];
  const headingRegex = /^#{2,3}\s+(.+)$/gm;
  let match = headingRegex.exec(content);
  while (match !== null) {
    if (match[1]) {
      headings.push(match[1].toLowerCase());
    }
    match = headingRegex.exec(content);
  }

  // Extract keywords (simple word frequency)
  const keywords = extractKeywords(content);

  return {
    path: filePath,
    title: title.toLowerCase(),
    headings,
    keywords,
    content,
    lines: lines.length,
    modified: fs.statSync(filePath).mtime,
  };
}

function extractKeywords(content: string): string[] {
  // Remove markdown syntax
  const text = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/[#*_~]/g, '') // Remove markdown symbols
    .toLowerCase();

  // Split into words
  const words = text.match(/\b[a-z]{4,}\b/g) || [];

  // Count frequency
  const frequency: Record<string, number> = {};
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1;
  }

  // Get top 20 keywords
  return Object.entries(frequency)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 20)
    .map(([word]) => word);
}

// ============================================================================
// SIMILARITY CALCULATION
// ============================================================================

function calculateSimilarity(doc1: Document, doc2: Document): number {
  // Title similarity (50% weight)
  const titleSim = stringSimilarity(doc1.title, doc2.title);

  // Heading overlap (30% weight)
  const headingSim = setOverlap(doc1.headings, doc2.headings);

  // Keyword similarity (20% weight)
  const keywordSim = setOverlap(doc1.keywords, doc2.keywords);

  return titleSim * 0.5 + headingSim * 0.3 + keywordSim * 0.2;
}

function stringSimilarity(str1: string, str2: string): number {
  // Levenshtein distance normalized to 0-1
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Levenshtein distance algorithm requires nested loops
function levenshteinDistance(str1: string, str2: string): number {
  // Initialize matrix with proper dimensions
  const matrix: number[][] = Array.from({ length: str2.length + 1 }, (_, i) => {
    const row = new Array(str1.length + 1).fill(0) as number[];
    row[0] = i;
    return row;
  });

  // Initialize first row
  for (let j = 0; j <= str1.length; j++) {
    const firstRow = matrix[0];
    if (firstRow) firstRow[j] = j;
  }

  // Calculate distances
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      const currentRow = matrix[i];
      const prevRow = matrix[i - 1];
      if (!currentRow || !prevRow) continue;

      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        currentRow[j] = prevRow[j - 1] ?? 0;
      } else {
        currentRow[j] = Math.min(
          (prevRow[j - 1] ?? 0) + 1,
          (currentRow[j - 1] ?? 0) + 1,
          (prevRow[j] ?? 0) + 1,
        );
      }
    }
  }

  const lastRow = matrix[str2.length];
  return lastRow?.[str1.length] ?? 0;
}

function setOverlap(set1: string[], set2: string[]): number {
  if (set1.length === 0 && set2.length === 0) {
    return 0;
  }

  const intersection = set1.filter((item: string) => set2.includes(item));
  const union = new Set([...set1, ...set2]);

  return intersection.length / union.size;
}

// ============================================================================
// CONSOLIDATION SUGGESTIONS
// ============================================================================

function suggestConsolidation(
  doc1: Document,
  doc2: Document,
): {
  action: string;
  keepFile: string;
  mergeFrom: string;
  reason: string;
  steps: string[];
} {
  // Prefer longer file (more complete)
  const keepFile = doc1.lines > doc2.lines ? doc1 : doc2;
  const mergeFrom = keepFile === doc1 ? doc2 : doc1;

  return {
    action: 'merge',
    keepFile: keepFile.path,
    mergeFrom: mergeFrom.path,
    reason: `${keepFile.path} is more complete (${keepFile.lines} lines vs ${mergeFrom.lines})`,
    steps: [
      '1. Review both files for unique content',
      `2. Merge unique sections from ${mergeFrom.path} into ${keepFile.path}`,
      `3. Delete ${mergeFrom.path}`,
      `4. Update any links to ${mergeFrom.path}`,
    ],
  };
}

// ============================================================================
// REPORTING
// ============================================================================

function printResults(overlaps: Overlap[]): void {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Document Overlap Detection');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  if (overlaps.length === 0) {
    console.log('✅ No overlapping documents detected');
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    return;
  }

  console.log(`⚠️  ${overlaps.length} potential overlap(s) detected:\n`);

  for (const overlap of overlaps) {
    console.log(`⚠️  ${Math.round(overlap.similarity * 100)}% similar:`);
    console.log(`   ${overlap.doc1.path}`);
    console.log(`   ${overlap.doc2.path}`);
    console.log('');
    console.log(`   Reason: ${overlap.reason}`);
    console.log('');
    console.log(`   Suggestion: ${overlap.suggestion.action}`);
    console.log(`   - Keep: ${overlap.suggestion.keepFile}`);
    console.log(`   - Merge from: ${overlap.suggestion.mergeFrom}`);
    console.log(`   - Why: ${overlap.suggestion.reason}`);
    console.log('');
    console.log('   Steps:');
    for (const step of overlap.suggestion.steps) {
      console.log(`   ${step}`);
    }
    console.log('');
    console.log('───────────────────────────────────────────────────────');
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('⚠️  REVIEW REQUIRED');
  console.log(`${overlaps.length} potential duplicate document(s) detected`);
  console.log('');
  console.log('This is a WARNING, not an error.');
  console.log('Consider consolidating overlapping documents to reduce confusion.');
  console.log('═══════════════════════════════════════════════════════');
}

// ============================================================================
// MAIN
// ============================================================================

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Main function orchestrates multiple checks
function main(): void {
  const args = process.argv.slice(2);
  const thresholdArg = args.find(arg => arg.startsWith('--threshold='));
  const thresholdStr = thresholdArg?.split('=')[1];
  const threshold = thresholdStr ? parseFloat(thresholdStr) : DEFAULT_THRESHOLD;

  const docs = getAllDocs();
  const overlaps: Overlap[] = [];

  // Compare all pairs
  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      const doc1 = docs[i];
      const doc2 = docs[j];

      if (!doc1 || !doc2) continue;

      const similarity = calculateSimilarity(doc1, doc2);

      if (similarity >= threshold) {
        const reasons: string[] = [];
        const titleSim = stringSimilarity(doc1.title, doc2.title);
        const headingSim = setOverlap(doc1.headings, doc2.headings);

        if (titleSim > 0.6) {
          reasons.push(`Similar titles (${Math.round(titleSim * 100)}%)`);
        }
        if (headingSim > 0.4) {
          reasons.push(`Overlapping headings (${Math.round(headingSim * 100)}%)`);
        }

        overlaps.push({
          doc1,
          doc2,
          similarity,
          reason: reasons.join(', '),
          suggestion: suggestConsolidation(doc1, doc2),
        });
      }
    }
  }

  printResults(overlaps);

  // Warning only - don't block commits
  process.exit(0);
}

// Run if called directly (ESM check)
const isMain =
  process.argv[1] &&
  (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1]));
if (isMain) {
  main();
}

export { calculateSimilarity, suggestConsolidation };
