#!/usr/bin/env node

/**
 * Blog Maintenance Agent
 *
 * Automatically maintains blog post quality and freshness by:
 * - Detecting stub posts (< 500 words or contain "Coming soon")
 * - Updating stubs when phases complete
 * - Managing metadata (status, last_updated, word_count)
 * - Validating no stubs exist for completed phases
 *
 * Based on specification in docs/agents/README.md
 */

import fs from 'node:fs';
import path, { dirname } from 'node:path';

import { fileURLToPath } from 'node:url';
import type { BlogMetadata } from '../schemas/blog-schema.js';
import { parseFrontmatterMetadata } from '../schemas/blog-schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ═══════════════════════════════════════════════════════
//  Configuration
// ═══════════════════════════════════════════════════════

const BLOG_DIR = path.join(__dirname, '../../docs/blog');
const PHASE_DIR = path.join(__dirname, '../../docs/phases');
const MIN_WORD_COUNT = 500;
const STALE_DAYS = 30;

// ═══════════════════════════════════════════════════════
//  Utilities
// ═══════════════════════════════════════════════════════

/**
 * Parse YAML frontmatter from a markdown file
 */
function parseFrontmatter(content: string): { metadata: BlogMetadata; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { metadata: {} as BlogMetadata, body: content };
  }

  const [, yamlContent, bodyMatch] = match;
  const metadataRaw: Record<string, unknown> = {};

  String(yamlContent)
    .split('\n')
    .forEach((line: string) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) return;

      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      // Remove quotes if present
      metadataRaw[key] = value.replace(/^['"]|['"]$/g, '');
    });

  const bodyStr = String(bodyMatch ?? '');
  const metadata = parseFrontmatterMetadata(metadataRaw);
  return { metadata, body: bodyStr };
}

/**
 * Generate frontmatter from metadata object
 */
function generateFrontmatter(metadata: Record<string, unknown>): string {
  const lines: string[] = ['---'];
  Object.entries(metadata).forEach(([key, value]) => {
    // Quote strings that contain special characters
    const needsQuotes = typeof value === 'string' && /[:#{}[\],&*?|-]/.test(value as string);
    const formattedValue = needsQuotes ? `"${String(value)}"` : String(value);
    lines.push(`${key}: ${formattedValue}`);
  });
  lines.push('---');
  return lines.join('\n');
}

/**
 * Count words in content (excluding frontmatter and code blocks)
 */
function countWords(body: string): number {
  // Remove code blocks
  const withoutCode = body.replace(/```[\s\S]*?```/g, '');
  // Remove inline code
  const withoutInlineCode = withoutCode.replace(/`[^`]+`/g, '');
  // Count words
  const words = withoutInlineCode
    .trim()
    .split(/\s+/)
    .filter((w: string) => w.length > 0);
  return words.length;
}

/**
 * Check if a post is a stub
 */
function isStub(body: string, metadata: BlogMetadata): boolean {
  const wordCount = countWords(body);
  const hasStubIndicators =
    /coming soon|todo|tbd|placeholder/i.test(body) || body.trim().length < 100;
  const status = String(metadata.status ?? '');

  return wordCount < MIN_WORD_COUNT || hasStubIndicators || status === 'stub';
}

/**
 * Get all blog posts with their metadata
 */
interface BlogPost {
  filename: string;
  filepath: string;
  metadata: BlogMetadata;
  body: string;
  wordCount: number;
  isStub: boolean;
}

function getBlogPosts(): BlogPost[] {
  const posts: BlogPost[] = [];
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.md') && f !== 'README.md' && f !== 'IMPLEMENTATION-SUMMARY.md');

  files.forEach(filename => {
    const filepath = path.join(BLOG_DIR, filename);
    const content = fs.readFileSync(filepath, 'utf8');
    const { metadata, body } = parseFrontmatter(content);
    const wordCount = countWords(body);

    posts.push({
      filename,
      filepath,
      metadata,
      body,
      wordCount,
      isStub: isStub(body, metadata),
    });
  });

  return posts.sort((a, b) => a.filename.localeCompare(b.filename));
}

/**
 * Get completed phases
 */
function getCompletedPhases(): string[] {
  const phases: string[] = [];
  if (!fs.existsSync(PHASE_DIR)) return phases;

  const phaseDirs = fs.readdirSync(PHASE_DIR).filter(d => d.startsWith('phase-'));

  phaseDirs.forEach(phaseDir => {
    const phasePath = path.join(PHASE_DIR, phaseDir);
    const stat = fs.statSync(phasePath);

    if (!stat.isDirectory()) return;

    // Check for completion indicators
    const hasReadme = fs.existsSync(path.join(phasePath, 'README.md'));
    const hasSummary = fs.existsSync(path.join(phasePath, 'SESSION-SUMMARY.md'));
    const hasEvidence = fs.existsSync(path.join(phasePath, '.evidence'));

    if (hasReadme && (hasSummary || hasEvidence)) {
      phases.push(phaseDir);
    }
  });

  return phases;
}

/**
 * Check if a post is stale (not updated in STALE_DAYS)
 */
function isStale(metadata: BlogMetadata): boolean {
  const last = metadata.last_updated;
  if (!last) return true;

  const lastUpdated = new Date(String(last));
  const now = Date.now();
  const daysSince = (now - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

  return daysSince > STALE_DAYS;
}

// ═══════════════════════════════════════════════════════
//  Commands
// ═══════════════════════════════════════════════════════

/**
 * List all blog posts with their status
 */
function listPosts(): {
  posts: BlogPost[];
  stubCount: number;
  staleCount: number;
  publishedCount: number;
} {
  console.log('\n📝 Blog Post Status\n');
  console.log('═'.repeat(60));

  const posts = getBlogPosts();
  const completedPhases = getCompletedPhases();

  let stubCount = 0;
  let staleCount = 0;
  let publishedCount = 0;

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Post summary formatting requires multiple checks
  posts.forEach(post => {
    const status = post.isStub ? '🟡 STUB' : '✅ PUBLISHED';
    const stale = !post.isStub && isStale(post.metadata) ? ' ⚠️  STALE' : '';
    const phase = String(post.metadata.phase ?? 'unassigned');

    console.log(`${status}${stale} ${post.filename}`);
    console.log(`  Phase: ${phase} | Words: ${post.wordCount}`);
    console.log(`  Title: ${String(post.metadata.title ?? 'No title')}`);

    if (post.isStub) {
      stubCount++;
      // Check if phase is completed
      if (completedPhases.includes(phase)) {
        console.log(`  ❌ ERROR: Phase ${phase} is complete but post is still a stub!`);
      }
    } else {
      publishedCount++;
      if (isStale(post.metadata)) {
        staleCount++;
      }
    }

    console.log();
  });

  console.log('═'.repeat(60));
  console.log(`Total posts: ${posts.length}`);
  console.log(`Published: ${publishedCount}`);
  console.log(`Stubs: ${stubCount}`);
  console.log(`Stale: ${staleCount}`);
  console.log();

  return { posts, stubCount, staleCount, publishedCount };
}

/**
 * Update post metadata (add frontmatter if missing)
 */
function updateMetadata(
  filename: string,
  updates: Record<string, unknown>,
): Record<string, unknown> {
  const filepath = path.join(BLOG_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf8');
  const { metadata, body } = parseFrontmatter(content);

  // Merge updates
  const newMetadata: Record<string, unknown> & BlogMetadata = {
    ...metadata,
    ...updates,
    last_updated: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  };

  // Recalculate word count if body changed
  if (!('word_count' in updates)) {
    newMetadata.word_count = countWords(body);
  }

  // Write back
  const newContent = `${generateFrontmatter(newMetadata)}\n\n${body.trim()}\n`;
  fs.writeFileSync(filepath, newContent, 'utf8');

  console.log(`✅ Updated ${filename}`);
  return newMetadata;
}

/**
 * Validate blog health (check for violations)
 */
function validate(): { errors: string[]; warnings: string[]; passed: boolean } {
  console.log('\n🔍 Validating Blog Health\n');
  console.log('═'.repeat(60));

  const posts = getBlogPosts();
  const completedPhases = getCompletedPhases();
  const errors: string[] = [];
  const warnings: string[] = [];

  posts.forEach(post => {
    const phase = post.metadata.phase;

    // ERROR: Stub exists for completed phase
    if (post.isStub && typeof phase === 'string' && completedPhases.includes(phase)) {
      errors.push(`❌ ${post.filename}: Phase ${phase} complete but post is still a stub`);
    }

    // WARNING: Post is stale
    if (!post.isStub && isStale(post.metadata)) {
      warnings.push(`⚠️  ${post.filename}: Not updated in ${STALE_DAYS}+ days`);
    }

    // WARNING: Missing metadata
    if (!post.metadata.title) {
      warnings.push(`⚠️  ${post.filename}: Missing title`);
    }
    if (!post.metadata.phase) {
      warnings.push(`⚠️  ${post.filename}: Missing phase assignment`);
    }
    if (!post.metadata.status) {
      warnings.push(`⚠️  ${post.filename}: Missing status`);
    }
  });

  // Print results
  if (errors.length > 0) {
    console.log('\n🚨 ERRORS:\n');
    errors.forEach(e => {
      console.log(e);
    });
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    warnings.forEach(w => {
      console.log(w);
    });
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All blog posts are healthy!');
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log();

  return { errors, warnings, passed: errors.length === 0 };
}

/**
 * Initialize metadata for all posts (add frontmatter if missing)
 */
function initializeMetadata() {
  console.log('\n🔧 Initializing Blog Post Metadata\n');
  console.log('═'.repeat(60));

  const posts = getBlogPosts();
  let updated = 0;

  posts.forEach(post => {
    const needsUpdate = !post.metadata.title || !post.metadata.status || !post.metadata.word_count;

    if (needsUpdate) {
      // Extract title from filename (01-title-here.md -> Title Here)
      const defaultTitle = post.filename
        .replace(/^\d+-/, '')
        .replace(/.md$/, '')
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const updates = {
        title: post.metadata.title || defaultTitle,
        status: post.isStub ? 'stub' : 'published',
        word_count: post.wordCount,
        phase: post.metadata.phase || 'unassigned',
      };

      updateMetadata(post.filename, updates);
      updated++;
    }
  });

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ Initialized ${updated} posts`);
  console.log();
}

// ═══════════════════════════════════════════════════════
//  CLI
// ═══════════════════════════════════════════════════════

function printUsage() {
  console.log(`
Blog Maintenance Agent

Usage:
  blog-maintenance-agent.js <command>

Commands:
  list        List all blog posts with status
  validate    Check for violations (stubs for completed phases, stale posts)
  init        Initialize metadata for all posts
  update      Update a specific post's metadata
  help        Show this help message

Examples:
  node scripts/agents/blog-maintenance-agent.js list
  node scripts/agents/blog-maintenance-agent.js validate
  node scripts/agents/blog-maintenance-agent.js init
`);
}

function main() {
  const command = process.argv[2];

  console.log(`\n${'═'.repeat(60)}`);
  console.log('  Blog Maintenance Agent - OpenCode Agents');
  console.log('═'.repeat(60));

  if (command === 'list') {
    listPosts();
  } else if (command === 'validate') {
    const result = validate();
    process.exit(result.passed ? 0 : 1);
  } else if (command === 'init') {
    initializeMetadata();
  } else if (command === 'help' || command === '--help' || command === '-h') {
    printUsage();
  } else {
    console.log(`\n❌ Unknown command: ${command}\n`);
    printUsage();
    process.exit(1);
  }
}

// Run if called directly (ESM check)
const isMain =
  process.argv[1] &&
  (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1]));
if (isMain) {
  main();
}

export {
  getBlogPosts,
  getCompletedPhases,
  isStub,
  isStale,
  countWords,
  parseFrontmatter,
  generateFrontmatter,
  validate,
};
