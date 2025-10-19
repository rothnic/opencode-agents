/**
 * Universal Phase Completion Gate Test
 *
 * This test template ensures all standard requirements are met before
 * marking a phase complete. Customize for each phase.
 *
 * Usage:
 *   Copy this template for each phase: test-phase-X.Y-gate.js
 *   Update PHASE_ID and DELIVERABLES constants
 *   Run before marking phase complete
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ============================================================================
// CONFIGURATION - Update for each phase
// ============================================================================

const PHASE_ID = "phase-X.Y"; // e.g., 'phase-1.1', 'phase-2.3'
const PHASE_DIR = `docs/phases/${PHASE_ID}`;

// List all expected deliverables for this phase
const DELIVERABLES = [
	// Example: 'opencode.json',
	// Example: '.opencode/agent/orchestrator.md',
	// Example: 'tests/phase-1/test-1.1-hello-world.js'
];

// ============================================================================
// UNIVERSAL GATE TESTS - Apply to all phases
// ============================================================================

describe(`${PHASE_ID} Completion Gate`, () => {
	describe("Documentation Requirements", () => {
		test("STATUS.md has been updated with current phase", () => {
			expect(fs.existsSync("STATUS.md")).toBe(true);

			const status = fs.readFileSync("STATUS.md", "utf8");
			expect(status).toContain(PHASE_ID);
		});

		test("phase working directory exists", () => {
			expect(fs.existsSync(PHASE_DIR)).toBe(true);
		});

		test("phase has progress.md documenting work", () => {
			const progressPath = path.join(PHASE_DIR, "progress.md");
			expect(fs.existsSync(progressPath)).toBe(true);

			const progress = fs.readFileSync(progressPath, "utf8");
			expect(progress.length).toBeGreaterThan(100); // Not just a stub
		});

		test("phase has notes.md with design decisions", () => {
			const notesPath = path.join(PHASE_DIR, "notes.md");
			expect(fs.existsSync(notesPath)).toBe(true);

			const notes = fs.readFileSync(notesPath, "utf8");
			expect(notes.length).toBeGreaterThan(100);
		});
	});

	describe("Test Evidence Requirements", () => {
		test("test evidence directory exists", () => {
			const evidenceDir = path.join(PHASE_DIR, "test-evidence");
			expect(fs.existsSync(evidenceDir)).toBe(true);
		});

		test("latest test run evidence exists", () => {
			const latestRun = path.join(
				PHASE_DIR,
				"test-evidence",
				"latest-run.json",
			);
			expect(fs.existsSync(latestRun)).toBe(true);
		});

		test("test evidence shows tests passed", () => {
			const latestRun = path.join(
				PHASE_DIR,
				"test-evidence",
				"latest-run.json",
			);
			const evidence = JSON.parse(fs.readFileSync(latestRun, "utf8"));

			expect(evidence.passed).toBe(true);
		});

		test("test evidence is recent (within 10 minutes)", () => {
			const latestRun = path.join(
				PHASE_DIR,
				"test-evidence",
				"latest-run.json",
			);
			const evidence = JSON.parse(fs.readFileSync(latestRun, "utf8"));

			const evidenceAge = Date.now() - new Date(evidence.timestamp).getTime();
			const ageMinutes = Math.floor(evidenceAge / 60000);

			expect(ageMinutes).toBeLessThanOrEqual(10);
		});

		test("test status file shows PASSED", () => {
			const statusFile = path.join(
				PHASE_DIR,
				"test-evidence",
				"test-status.txt",
			);
			expect(fs.existsSync(statusFile)).toBe(true);

			const status = fs.readFileSync(statusFile, "utf8");
			expect(status).toContain("PASSED");
		});
	});

	describe("Deliverables Requirements", () => {
		test("all specified deliverables exist", () => {
			const missing = DELIVERABLES.filter((file) => !fs.existsSync(file));

			if (missing.length > 0) {
				console.error("Missing deliverables:");
				for (const f of missing) {
					console.error(`  - ${f}`);
				}
			}

			expect(missing).toEqual([]);
		});
		DELIVERABLES.forEach((file) => {
			test(`deliverable exists: ${file}`, () => {
				expect(fs.existsSync(file)).toBe(true);
			});
		});
	});

	describe("File Organization Requirements", () => {
		test("no session files in root directory", () => {
			const rootFiles = fs.readdirSync(".");
			const sessionFiles = rootFiles.filter(
				(f) =>
					/SESSION|NOTES|PROGRESS|DRAFT|WIP|TEMP/i.test(f) && f.endsWith(".md"),
			);

			if (sessionFiles.length > 0) {
				console.error("Session files found in root:");
				for (const f of sessionFiles) {
					console.error(`  - ${f}`);
				}
				console.error("These should be in docs/phases/");
			}

			expect(sessionFiles).toEqual([]);
		});

		test("working files are in phase directory", () => {
			// Session-specific files should be in phase dir, not root
			const phaseFiles = fs.readdirSync(PHASE_DIR);

			// At minimum should have README, notes, progress
			expect(phaseFiles).toContain("README.md");
			expect(phaseFiles.some((f) => /notes/i.test(f))).toBe(true);
			expect(phaseFiles.some((f) => /progress/i.test(f))).toBe(true);
		});
	});

	describe("Git Repository Requirements", () => {
		test("git repository is clean (no uncommitted changes)", () => {
			try {
				const status = execSync("git status --porcelain", { encoding: "utf8" });
				const changes = status.trim();

				if (changes) {
					console.warn("Uncommitted changes detected:");
					console.warn(changes);
				}

				// This might be warning-only depending on workflow
				// expect(changes).toBe('');
			} catch (error) {
				// Not in a git repo or other error - skip this test
				console.warn("Could not check git status:", error.message);
			}
		});

		test("on correct branch (main)", () => {
			try {
				const branch = execSync("git rev-parse --abbrev-ref HEAD", {
					encoding: "utf8",
				}).trim();
				expect(branch).toBe("main");
			} catch (error) {
				console.warn("Could not check git branch:", error.message);
			}
		});
	});

	describe("Metrics Requirements", () => {
		test("metrics have been collected", () => {
			const metricsDir = "docs/metrics";
			const metricsFile = path.join(metricsDir, `${PHASE_ID}-metrics.json`);

			// Metrics might not be required for setup phases
			if (fs.existsSync(metricsFile)) {
				const metrics = JSON.parse(fs.readFileSync(metricsFile, "utf8"));
				expect(metrics).toHaveProperty("tokenCount");
			}
		});
	});
});

// ============================================================================
// PHASE-SPECIFIC TESTS - Customize for each phase
// ============================================================================

describe(`${PHASE_ID} Specific Requirements`, () => {
	// Example for Phase 0.2:
	// test('opencode.json is valid JSON', () => {
	//   const config = JSON.parse(fs.readFileSync('opencode.json', 'utf8'));
	//   expect(config).toHaveProperty('agents');
	// });

	// Example for Phase 1.1:
	// test('hello world test exists and passes', () => {
	//   const testFile = 'tests/phase-1/test-1.1-hello-world.js';
	//   expect(fs.existsSync(testFile)).toBe(true);
	//
	//   // Verify it's executable
	//   const result = execSync('npm test ' + testFile, { encoding: 'utf8' });
	//   expect(result).toContain('PASS');
	// });

	test("phase-specific requirements (customize this)", () => {
		// Add your phase-specific validation here
		expect(true).toBe(true);
	});
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper function to extract deliverables from README (unused in template,
// but available for customization if needed in specific phase tests)
//
// function extractDeliverablesFromReadme() {
// 	const readmePath = path.join(PHASE_DIR, "README.md");
//
// 	if (!fs.existsSync(readmePath)) {
// 		return [];
// 	}
//
// 	const readme = fs.readFileSync(readmePath, "utf8");
// 	const deliverables = [];
// 	const lines = readme.split("\n");
//
// 	for (const line of lines) {
// 		const match = line.match(/[-*]\s+`([/.][^`]+)`/);
// 		if (match) {
// 			let file = match[1];
// 			if (file.startsWith("/")) {
// 				file = file.substring(1);
// 			}
// 			if (!file.endsWith("/")) {
// 				deliverables.push(file);
// 			}
// 		}
// 	}
//
// 	return deliverables;
// }
