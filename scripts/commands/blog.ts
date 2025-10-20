/**
 * Command: Blog Maintenance
 *
 * Automatically maintains blog post quality and freshness by:
 * - Detecting stub posts (< 500 words or contain "Coming soon")
 * - Updating stubs when phases complete
 * - Managing metadata (status, last_updated, word_count)
 * - Validating no stubs exist for completed phases
 */

import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineCommand, defineOptions } from '@robingenz/zli';
import { z } from 'zod';
import type { BlogMetadata } from '../schemas/blog-schema';
import { parseFrontmatterMetadata } from '../schemas/blog-schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../../docs/blog');
const PHASE_DIR = path.join(__dirname, '../../docs/phases');
const MIN_WORD_COUNT = 500;
const STALE_DAYS = 30;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

interface BlogPost {
  filename: string;
  filepath: string;
  metadata: BlogMetadata;
  body: string;
  wordCount: number;
  isStub: boolean;
}

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

      metadataRaw[key] = value.replace(/^['"]|['"]$/g, '');
    });

  const bodyStr = String(bodyMatch ?? '');
  const metadata = parseFrontmatterMetadata(metadataRaw);
  return { metadata, body: bodyStr };
}

function countWords(body: string): number {
  const withoutCode = body.replace(/```[\s\S]*?```/g, '');
  const withoutInlineCode = withoutCode.replace(/`[^`]+`/g, '');
  const words = withoutInlineCode
    .trim()
    .split(/\s+/)
    .filter((w: string) => w.length > 0);
  return words.length;
}

function isStub(body: string, metadata: BlogMetadata): boolean {
  const wordCount = countWords(body);
  const hasStubIndicators =
    /coming soon|todo|tbd|placeholder/i.test(body) || body.trim().length < 100;
  const status = String(metadata.status ?? '');

  return wordCount < MIN_WORD_COUNT || hasStubIndicators || status === 'stub';
}

function getBlogPosts(): BlogPost[] {
  const posts: BlogPost[] = [];
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.md') && f !== 'README.md' && f !== 'IMPLEMENTATION-SUMMARY.md');

  for (const filename of files) {
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
  }

  return posts.sort((a, b) => a.filename.localeCompare(b.filename));
}

function getCompletedPhases(): string[] {
  const phases: string[] = [];
  if (!fs.existsSync(PHASE_DIR)) return phases;

  const phaseDirs = fs.readdirSync(PHASE_DIR).filter(d => d.startsWith('phase-'));

  phaseDirs.forEach(phaseDir => {
    const phasePath = path.join(PHASE_DIR, phaseDir);
    const stat = fs.statSync(phasePath);

    if (!stat.isDirectory()) return;

    const hasReadme = fs.existsSync(path.join(phasePath, 'README.md'));
    const hasSummary = fs.existsSync(path.join(phasePath, 'SESSION-SUMMARY.md'));
    const hasEvidence = fs.existsSync(path.join(phasePath, '.evidence'));

    if (hasReadme && (hasSummary || hasEvidence)) {
      phases.push(phaseDir);
    }
  });

  return phases;
}

function isStale(metadata: BlogMetadata): boolean {
  const last = metadata.last_updated;
  if (!last) return true;

  const lastUpdated = new Date(String(last));
  const now = Date.now();
  const daysSince = (now - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

  return daysSince > STALE_DAYS;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

function formatPostStatus(post: BlogPost, completedPhases: string[]): string[] {
  const status = post.isStub ? '🟡 STUB' : '✅ PUBLISHED';
  const stale = !post.isStub && isStale(post.metadata) ? ' ⚠️  STALE' : '';
  const phase = String(post.metadata.phase ?? 'unassigned');

  const lines = [
    `${status}${stale} ${post.filename}`,
    `  Phase: ${phase} | Words: ${post.wordCount}`,
    `  Title: ${String(post.metadata.title ?? 'No title')}`,
  ];

  if (post.isStub && completedPhases.includes(phase)) {
    lines.push(`  ❌ ERROR: Phase ${phase} is complete but post is still a stub!`);
  }

  return lines;
}

function countPostStatistics(posts: BlogPost[]): {
  stubCount: number;
  staleCount: number;
  publishedCount: number;
} {
  let stubCount = 0;
  let staleCount = 0;
  let publishedCount = 0;

  for (const post of posts) {
    if (post.isStub) {
      stubCount++;
    } else {
      publishedCount++;
      if (isStale(post.metadata)) {
        staleCount++;
      }
    }
  }

  return { stubCount, staleCount, publishedCount };
}

async function listPostsAction(): Promise<void> {
  console.log('\n📝 Blog Post Status\n');
  console.log('═'.repeat(60));

  const posts = getBlogPosts();
  const completedPhases = getCompletedPhases();
  const stats = countPostStatistics(posts);

  for (const post of posts) {
    const lines = formatPostStatus(post, completedPhases);
    lines.forEach((line: string) => {
      console.log(line);
    });
    console.log();
  }

  console.log('═'.repeat(60));
  console.log(`Total posts: ${posts.length}`);
  console.log(`Published: ${stats.publishedCount}`);
  console.log(`Stubs: ${stats.stubCount}`);
  console.log(`Stale: ${stats.staleCount}`);
  console.log();
}

function validatePost(
  post: BlogPost,
  completedPhases: string[],
  errors: string[],
  warnings: string[],
): void {
  const phase = post.metadata.phase;

  if (post.isStub && typeof phase === 'string' && completedPhases.includes(phase)) {
    errors.push(`❌ ${post.filename}: Phase ${phase} complete but post is still a stub`);
  }

  if (!post.isStub && isStale(post.metadata)) {
    warnings.push(`⚠️  ${post.filename}: Not updated in ${STALE_DAYS}+ days`);
  }

  if (!post.metadata.title) {
    warnings.push(`⚠️  ${post.filename}: Missing title`);
  }
  if (!post.metadata.phase) {
    warnings.push(`⚠️  ${post.filename}: Missing phase assignment`);
  }
  if (!post.metadata.status) {
    warnings.push(`⚠️  ${post.filename}: Missing status`);
  }
}

async function validateAction(): Promise<void> {
  console.log('\n🔍 Validating Blog Health\n');
  console.log('═'.repeat(60));

  const posts = getBlogPosts();
  const completedPhases = getCompletedPhases();
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const post of posts) {
    validatePost(post, completedPhases, errors, warnings);
  }

  if (errors.length > 0) {
    console.log('\n🚨 ERRORS:\n');
    for (const e of errors) {
      console.log(e);
    }
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    for (const w of warnings) {
      console.log(w);
    }
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All blog posts are healthy!');
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log();

  if (errors.length > 0) {
    process.exit(1);
  }
}

export const blogCommand = defineCommand({
  description: 'Manage blog posts and metadata',
  options: defineOptions(
    z.object({
      action: z.enum(['list', 'validate']).default('list').describe('Blog action to perform'),
    }),
    { a: 'action' },
  ),
  action: async options => {
    switch (options.action) {
      case 'list':
        await listPostsAction();
        break;
      case 'validate':
        await validateAction();
        break;
      default:
        console.error(`Unknown blog action: ${options.action}`);
        process.exit(1);
    }
  },
});
