#!/usr/bin/env node

/**
 * Initialize Work Verification Document
 *
 * Creates a WORK-VERIFICATION.md template for the current branch.
 * This document is required before merging feature branches.
 *
 * Usage:
 *   node scripts/init-work-verification.js [branch-name]
 *
 * If branch-name is omitted, uses current git branch.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';

// ============================================================================
// HELPERS
// ============================================================================

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
    }).trim();
  } catch {
    return null;
  }
}

function getFeatureName(branchName: string): string {
  // Extract feature name from branch
  // feature/documentation-conventions -> Documentation Conventions
  const parts = branchName.split('/');
  if (parts.length > 1 && parts[1]) {
    return parts[1]
      .split('-')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return branchName;
}

function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

// ============================================================================
// TEMPLATE GENERATION
// ============================================================================

function generateTemplate(branchName: string, featureName: string): string {
  return `# Work Verification: ${featureName}

**Branch**: \`${branchName}\`  
**Started**: ${getCurrentDate()}  
**Completed**: _[Date when work is done]_

---

## Objectives

What was this work supposed to accomplish?

- [ ] Objective 1: _[Describe what should be achieved]_
- [ ] Objective 2: _[Describe what should be achieved]_
- [ ] Objective 3: _[Describe what should be achieved]_

_Add or remove objectives as needed_

---

## Deliverables

What files/features were created or modified?

### Created
- \`path/to/new-file.js\` - _[Purpose of this file]_
- \`path/to/another-file.js\` - _[Purpose of this file]_

### Modified
- \`path/to/existing-file.js\` - _[What changes were made]_
- \`path/to/another-file.js\` - _[What changes were made]_

---

## Verification Strategy

How do we know this work is correct?

### Test Coverage

| Objective | Test File | Test Description | Status |
|-----------|-----------|------------------|--------|
| Objective 1 | \`tests/feature/test-name.test.js\` | Verifies X behavior | ⏳ Pending |
| Objective 2 | \`tests/feature/test-name.test.js\` | Verifies Y behavior | ⏳ Pending |
| Objective 3 | \`tests/feature/test-name.test.js\` | Verifies Z behavior | ⏳ Pending |

_Update Status: ⏳ Pending → ✅ Pass → ❌ Fail_

### Manual Verification

Steps to manually verify (if applicable):

1. _[Step 1 to manually test the feature]_
2. _[Step 2 to manually test the feature]_
3. **Expected Result**: _[What should happen]_

_Remove this section if no manual verification needed_

---

## Test Organization

Tests are organized as follows:

\`\`\`
tests/
├── feature/
│   └── test-${branchName.split('/')[1] || branchName}.test.js
│       ├── Suite: ${featureName}
│       │   ├── Objective 1 tests (X tests)
│       │   ├── Objective 2 tests (Y tests)
│       │   └── Objective 3 tests (Z tests)
│       └── Total: [N] tests
\`\`\`

### Test Suite Structure

\`\`\`javascript
describe('Feature: ${featureName}', () => {
  describe('Objective 1: [What it does]', () => {
    test('handles normal case', ...);
    test('handles edge case X', ...);
    test('handles error case Y', ...);
  });
  
  describe('Objective 2: [What it does]', () => {
    test('...', ...);
  });
});
\`\`\`

---

## Completion Checklist

Before merging, ensure all items are checked:

- [ ] All objectives completed
- [ ] Tests written for all objectives
- [ ] All tests passing (\`npm test\`)
- [ ] Test evidence recorded
- [ ] Documentation updated (README, guides, etc.)
- [ ] WORK-VERIFICATION.md fully filled out
- [ ] Pre-merge validation passes (\`node scripts/pre-merge-check.js\`)
- [ ] Ready to merge to main

---

## Notes

_Any additional context, decisions, or information about this work:_

- 
- 
- 

---

**Next Steps**: 
1. Complete the work described in Objectives
2. Write tests as described in Test Coverage
3. Fill out all sections of this document
4. Run \`node scripts/pre-merge-check.js\` to validate
5. Merge to main when all checks pass ✅
`;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  let branchName: string | undefined = args[0];

  if (!branchName) {
    const currentBranch = getCurrentBranch();
    if (!currentBranch) {
      console.error('❌ Could not determine current git branch');
      console.error(
        '   Provide branch name: node scripts/init-work-verification.js feature/my-feature',
      );
      process.exit(1);
    }
    branchName = currentBranch;
  }

  if (branchName === 'main') {
    console.error('❌ Cannot create work verification for main branch');
    console.error('   Create a feature branch first: git checkout -b feature/my-feature');
    process.exit(1);
  }

  const featureName = getFeatureName(branchName);
  const filename = 'WORK-VERIFICATION.md';

  // Check if file already exists
  if (fs.existsSync(filename)) {
    console.log(`⚠️  ${filename} already exists`);
    console.log('   Delete it first if you want to regenerate');
    process.exit(1);
  }

  // Generate and write template
  const template = generateTemplate(branchName, featureName);
  fs.writeFileSync(filename, template, 'utf8');

  console.log('═══════════════════════════════════════════════════════');
  console.log('  Work Verification Initialized');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`✅ Created: ${filename}`);
  console.log(`   Branch: ${branchName}`);
  console.log(`   Feature: ${featureName}`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Fill out the Objectives section');
  console.log('2. List your deliverables (files created/modified)');
  console.log('3. Write tests for each objective');
  console.log('4. Document test coverage in the table');
  console.log('5. Run: node scripts/pre-merge-check.js');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
}

// Run if called directly (ESM check)
const isMain =
  process.argv[1] &&
  (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1]));
if (isMain) {
  main();
}

export { generateTemplate, getFeatureName };
