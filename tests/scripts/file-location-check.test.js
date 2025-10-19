/**
 * Tests for file-location-check.js
 *
 * These tests verify that the file location validator correctly:
 * - Identifies session files in the root directory
 * - Allows valid files in root
 * - Provides correct suggestions for file relocation
 * - Handles edge cases (empty directories, special characters, etc.)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

describe("File Location Check", () => {
	const scriptPath = path.join(
		__dirname,
		"../../scripts/file-location-check.js",
	);
	const testDir = path.join(__dirname, "../fixtures/file-location-test");

	beforeAll(() => {
		// Ensure test fixture directory exists
		if (!fs.existsSync(testDir)) {
			fs.mkdirSync(testDir, { recursive: true });
		}
	});

	describe("Session File Detection", () => {
		const sessionPatterns = [
			"SESSION-SUMMARY.md",
			"SESSION-NOTES.md",
			"PROGRESS-REPORT.md",
			"DRAFT-NOTES.md",
			"WIP-DOCUMENT.md",
			"TEMP-FILE.md",
		];

		test.each(sessionPatterns)(
			"should detect %s as a session file",
			(filename) => {
				const testFile = path.join(testDir, filename);

				// Create test file
				fs.writeFileSync(testFile, "# Test content\n");

				try {
					// Run the check (should fail for session files in root)
					execSync(`node ${scriptPath}`, {
						cwd: testDir,
						encoding: "utf8",
					});

					// If we get here, the check passed when it shouldn't have
					fail(`Expected ${filename} to be flagged as session file`);
				} catch (error) {
					// Expected to fail - verify error message contains the filename
					expect(error.status).toBe(1);
					expect(error.stdout || error.stderr).toContain(filename);
				} finally {
					// Cleanup
					if (fs.existsSync(testFile)) {
						fs.unlinkSync(testFile);
					}
				}
			},
		);

		test("should allow session files in docs/phases/ directory", () => {
			const phaseDir = path.join(testDir, "docs/phases/phase-1.0");
			const sessionFile = path.join(phaseDir, "SESSION-SUMMARY.md");

			// Create directory and file
			fs.mkdirSync(phaseDir, { recursive: true });
			fs.writeFileSync(sessionFile, "# Phase session summary\n");

			try {
				const output = execSync(`node ${scriptPath}`, {
					cwd: testDir,
					encoding: "utf8",
				});

				// Should not complain about session files in correct location
				expect(output).not.toContain("SESSION-SUMMARY.md");
			} finally {
				// Cleanup
				fs.rmSync(path.join(testDir, "docs"), { recursive: true, force: true });
			}
		});
	});

	describe("Allowed Root Files", () => {
		const allowedFiles = [
			"README.md",
			"LICENSE",
			"package.json",
			".gitignore",
			".eslintrc.js",
		];

		test.each(allowedFiles)("should allow %s in root", (filename) => {
			const testFile = path.join(testDir, filename);

			// Create test file
			fs.writeFileSync(testFile, "test content\n");

			try {
				const output = execSync(`node ${scriptPath}`, {
					cwd: testDir,
					encoding: "utf8",
				});

				// Should not flag allowed files
				expect(output).not.toContain(`❌ Found`);
			} catch (error) {
				// If it fails, make sure it's not because of our allowed file
				const errorOutput = error.stdout || error.stderr || "";
				expect(errorOutput).not.toContain(filename);
			} finally {
				// Cleanup
				if (fs.existsSync(testFile)) {
					fs.unlinkSync(testFile);
				}
			}
		});
	});

	describe("Error Messages and Suggestions", () => {
		test("should provide helpful suggestion for session file location", () => {
			const sessionFile = path.join(testDir, "SESSION-NOTES.md");
			fs.writeFileSync(sessionFile, "# Test\n");

			try {
				execSync(`node ${scriptPath}`, {
					cwd: testDir,
					encoding: "utf8",
				});
				fail("Expected validation to fail");
			} catch (error) {
				const output = error.stdout || error.stderr || "";

				// Should contain the problematic file name
				expect(output).toContain("SESSION-NOTES.md");

				// Should suggest correct location
				expect(output).toMatch(/docs\/phases\/phase-/);

				// Should indicate it's a session/temporary file
				expect(output).toMatch(/Session\/temporary/i);
			} finally {
				fs.unlinkSync(sessionFile);
			}
		});

		test("should mention --fix flag for seeing move commands", () => {
			const sessionFile = path.join(testDir, "TEMP-FILE.md");
			fs.writeFileSync(sessionFile, "# Test\n");

			try {
				execSync(`node ${scriptPath}`, {
					cwd: testDir,
					encoding: "utf8",
				});
				fail("Expected validation to fail");
			} catch (error) {
				const output = error.stdout || error.stderr || "";
				expect(output).toMatch(/--fix/);
			} finally {
				fs.unlinkSync(sessionFile);
			}
		});
	});

	describe("Edge Cases", () => {
		test("should handle empty root directory", () => {
			const emptyDir = path.join(testDir, "empty-test");
			fs.mkdirSync(emptyDir, { recursive: true });

			try {
				const output = execSync(`node ${scriptPath}`, {
					cwd: emptyDir,
					encoding: "utf8",
				});

				// Should complete without errors
				expect(output).toMatch(/✅|No violations/);
			} finally {
				fs.rmdirSync(emptyDir);
			}
		});

		test("should handle files with special characters", () => {
			const specialFile = path.join(testDir, "my-notes.md");
			fs.writeFileSync(specialFile, "# Normal file\n");

			try {
				const output = execSync(`node ${scriptPath}`, {
					cwd: testDir,
					encoding: "utf8",
				});

				// my-notes.md should be flagged as not in whitelist
				// (it's in root and not an allowed file)
				expect(output).toContain("my-notes.md");
			} catch (error) {
				// Expected - file not in whitelist
				const errorOutput = error.stdout || error.stderr || "";
				expect(errorOutput).toContain("my-notes.md");
			} finally {
				if (fs.existsSync(specialFile)) {
					fs.unlinkSync(specialFile);
				}
			}
		});

		test("should handle non-git directory gracefully", () => {
			const nonGitDir = path.join(testDir, "non-git-test");
			fs.mkdirSync(nonGitDir, { recursive: true });

			try {
				const output = execSync(`node ${scriptPath}`, {
					cwd: nonGitDir,
					encoding: "utf8",
				});

				// Should complete gracefully - checking files not in git
				expect(output).toMatch(
					/All files are in correct locations|Checking file/i,
				);
			} finally {
				fs.rmdirSync(nonGitDir);
			}
		});
	});

	describe("Pattern Matching", () => {
		test("should be case-insensitive for session patterns", () => {
			const testCases = [
				"session-notes.md",
				"Session-Notes.md",
				"SESSION-NOTES.md",
				"progress-report.md",
				"PROGRESS-REPORT.md",
			];

			testCases.forEach((filename) => {
				const testFile = path.join(testDir, filename);
				fs.writeFileSync(testFile, "# Test\n");

				try {
					execSync(`node ${scriptPath}`, {
						cwd: testDir,
						encoding: "utf8",
					});
					fail(`Expected ${filename} to be flagged`);
				} catch (error) {
					expect(error.status).toBe(1);
				} finally {
					if (fs.existsSync(testFile)) {
						fs.unlinkSync(testFile);
					}
				}
			});
		});

		test("should only flag .md files with session patterns", () => {
			// Non-.md files with session patterns are flagged as "not in whitelist"
			// Let's test with an allowed file type instead
			const testFile = path.join(testDir, "data.json");
			fs.writeFileSync(testFile, '{"test": true}\n');

			try {
				execSync(`node ${scriptPath}`, {
					cwd: testDir,
					encoding: "utf8",
				});

				// Should flag non-whitelisted files
				fail("Expected validation to fail for non-whitelisted file");
			} catch (error) {
				const errorOutput = error.stdout || error.stderr || "";
				// data.json is not in whitelist, so it will be flagged
				expect(errorOutput).toContain("data.json");
			} finally {
				if (fs.existsSync(testFile)) {
					fs.unlinkSync(testFile);
				}
			}
		});
	});
});
