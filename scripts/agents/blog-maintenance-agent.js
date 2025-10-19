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

const fs = require("fs");
const path = require("path");

// ═══════════════════════════════════════════════════════
//  Configuration
// ═══════════════════════════════════════════════════════

const BLOG_DIR = path.join(__dirname, "../../docs/blog");
const PHASE_DIR = path.join(__dirname, "../../docs/phases");
const MIN_WORD_COUNT = 500;
const STALE_DAYS = 30;

// ═══════════════════════════════════════════════════════
//  Utilities
// ═══════════════════════════════════════════════════════

/**
 * Parse YAML frontmatter from a markdown file
 */
function parseFrontmatter(content) {
	const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) {
		return { metadata: {}, body: content };
	}

	const [, yamlContent, body] = match;
	const metadata = {};

	yamlContent.split("\n").forEach((line) => {
		const colonIndex = line.indexOf(":");
		if (colonIndex === -1) return;

		const key = line.substring(0, colonIndex).trim();
		const value = line.substring(colonIndex + 1).trim();

		// Remove quotes if present
		metadata[key] = value.replace(/^["']|["']$/g, "");
	});

	return { metadata, body };
}

/**
 * Generate frontmatter from metadata object
 */
function generateFrontmatter(metadata) {
	const lines = ["---"];
	Object.entries(metadata).forEach(([key, value]) => {
		// Quote strings that contain special characters
		const needsQuotes =
			typeof value === "string" && /[:#{}[\],&*?|-]/.test(value);
		const formattedValue = needsQuotes ? `"${value}"` : value;
		lines.push(`${key}: ${formattedValue}`);
	});
	lines.push("---");
	return lines.join("\n");
}

/**
 * Count words in content (excluding frontmatter and code blocks)
 */
function countWords(body) {
	// Remove code blocks
	const withoutCode = body.replace(/```[\s\S]*?```/g, "");
	// Remove inline code
	const withoutInlineCode = withoutCode.replace(/`[^`]+`/g, "");
	// Count words
	const words = withoutInlineCode
		.trim()
		.split(/\s+/)
		.filter((w) => w.length > 0);
	return words.length;
}

/**
 * Check if a post is a stub
 */
function isStub(body, metadata) {
	const wordCount = countWords(body);
	const hasStubIndicators =
		/coming soon|todo|tbd|placeholder/i.test(body) || body.trim().length < 100;

	return (
		wordCount < MIN_WORD_COUNT ||
		hasStubIndicators ||
		metadata.status === "stub"
	);
}

/**
 * Get all blog posts with their metadata
 */
function getBlogPosts() {
	const posts = [];
	const files = fs
		.readdirSync(BLOG_DIR)
		.filter(
			(f) =>
				f.endsWith(".md") &&
				f !== "README.md" &&
				f !== "IMPLEMENTATION-SUMMARY.md",
		);

	files.forEach((filename) => {
		const filepath = path.join(BLOG_DIR, filename);
		const content = fs.readFileSync(filepath, "utf8");
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
function getCompletedPhases() {
	const phases = [];
	if (!fs.existsSync(PHASE_DIR)) return phases;

	const phaseDirs = fs
		.readdirSync(PHASE_DIR)
		.filter((d) => d.startsWith("phase-"));

	phaseDirs.forEach((phaseDir) => {
		const phasePath = path.join(PHASE_DIR, phaseDir);
		const stat = fs.statSync(phasePath);

		if (!stat.isDirectory()) return;

		// Check for completion indicators
		const hasReadme = fs.existsSync(path.join(phasePath, "README.md"));
		const hasSummary = fs.existsSync(
			path.join(phasePath, "SESSION-SUMMARY.md"),
		);
		const hasEvidence = fs.existsSync(path.join(phasePath, ".evidence"));

		if (hasReadme && (hasSummary || hasEvidence)) {
			phases.push(phaseDir);
		}
	});

	return phases;
}

/**
 * Check if a post is stale (not updated in STALE_DAYS)
 */
function isStale(metadata) {
	if (!metadata.last_updated) return true;

	const lastUpdated = new Date(metadata.last_updated);
	const now = new Date();
	const daysSince = (now - lastUpdated) / (1000 * 60 * 60 * 24);

	return daysSince > STALE_DAYS;
}

// ═══════════════════════════════════════════════════════
//  Commands
// ═══════════════════════════════════════════════════════

/**
 * List all blog posts with their status
 */
function listPosts() {
	console.log("\n📝 Blog Post Status\n");
	console.log("═".repeat(60));

	const posts = getBlogPosts();
	const completedPhases = getCompletedPhases();

	let stubCount = 0;
	let staleCount = 0;
	let publishedCount = 0;

	posts.forEach((post) => {
		const status = post.isStub ? "🟡 STUB" : "✅ PUBLISHED";
		const stale = !post.isStub && isStale(post.metadata) ? " ⚠️  STALE" : "";
		const phase = post.metadata.phase || "unassigned";

		console.log(`${status}${stale} ${post.filename}`);
		console.log(`  Phase: ${phase} | Words: ${post.wordCount}`);
		console.log(`  Title: ${post.metadata.title || "No title"}`);

		if (post.isStub) {
			stubCount++;
			// Check if phase is completed
			if (completedPhases.includes(phase)) {
				console.log(
					`  ❌ ERROR: Phase ${phase} is complete but post is still a stub!`,
				);
			}
		} else {
			publishedCount++;
			if (isStale(post.metadata)) {
				staleCount++;
			}
		}

		console.log();
	});

	console.log("═".repeat(60));
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
function updateMetadata(filename, updates) {
	const filepath = path.join(BLOG_DIR, filename);
	const content = fs.readFileSync(filepath, "utf8");
	const { metadata, body } = parseFrontmatter(content);

	// Merge updates
	const newMetadata = {
		...metadata,
		...updates,
		last_updated: new Date().toISOString().split("T")[0], // YYYY-MM-DD
	};

	// Recalculate word count if body changed
	if (!updates.word_count) {
		newMetadata.word_count = countWords(body);
	}

	// Write back
	const newContent = `${generateFrontmatter(newMetadata)}\n\n${body.trim()}\n`;
	fs.writeFileSync(filepath, newContent, "utf8");

	console.log(`✅ Updated ${filename}`);
	return newMetadata;
}

/**
 * Validate blog health (check for violations)
 */
function validate() {
	console.log("\n🔍 Validating Blog Health\n");
	console.log("═".repeat(60));

	const posts = getBlogPosts();
	const completedPhases = getCompletedPhases();
	const errors = [];
	const warnings = [];

	posts.forEach((post) => {
		const phase = post.metadata.phase;

		// ERROR: Stub exists for completed phase
		if (post.isStub && completedPhases.includes(phase)) {
			errors.push(
				`❌ ${post.filename}: Phase ${phase} complete but post is still a stub`,
			);
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
		console.log("\n🚨 ERRORS:\n");
		errors.forEach((e) => {
			console.log(e);
		});
	}

	if (warnings.length > 0) {
		console.log("\n⚠️  WARNINGS:\n");
		warnings.forEach((w) => {
			console.log(w);
		});
	}

	if (errors.length === 0 && warnings.length === 0) {
		console.log("✅ All blog posts are healthy!");
	}

	console.log("\n" + "═".repeat(60));
	console.log(`Errors: ${errors.length}`);
	console.log(`Warnings: ${warnings.length}`);
	console.log();

	return { errors, warnings, passed: errors.length === 0 };
}

/**
 * Initialize metadata for all posts (add frontmatter if missing)
 */
function initializeMetadata() {
	console.log("\n🔧 Initializing Blog Post Metadata\n");
	console.log("═".repeat(60));

	const posts = getBlogPosts();
	let updated = 0;

	posts.forEach((post) => {
		const needsUpdate =
			!post.metadata.title ||
			!post.metadata.status ||
			!post.metadata.word_count;

		if (needsUpdate) {
			// Extract title from filename (01-title-here.md -> Title Here)
			const defaultTitle = post.filename
				.replace(/^\d+-/, "")
				.replace(/.md$/, "")
				.split("-")
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
				.join(" ");

			const updates = {
				title: post.metadata.title || defaultTitle,
				status: post.isStub ? "stub" : "published",
				word_count: post.wordCount,
				phase: post.metadata.phase || "unassigned",
			};

			updateMetadata(post.filename, updates);
			updated++;
		}
	});

	console.log("\n" + "═".repeat(60));
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

	console.log("\n" + "═".repeat(60));
	console.log("  Blog Maintenance Agent - OpenCode Agents");
	console.log("═".repeat(60));

	switch (command) {
		case "list":
			listPosts();
			break;
		case "validate": {
			const result = validate();
			process.exit(result.passed ? 0 : 1);
			break;
		}
		case "init":
			initializeMetadata();
			break;
		case "help":
		case "--help":
		case "-h":
			printUsage();
			break;
		default:
			console.log(`\n❌ Unknown command: ${command}\n`);
			printUsage();
			process.exit(1);
	}
}

if (require.main === module) {
	main();
}

module.exports = {
	getBlogPosts,
	getCompletedPhases,
	isStub,
	isStale,
	countWords,
	parseFrontmatter,
	generateFrontmatter,
	validate,
};
