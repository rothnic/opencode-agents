# Branch-Based Development with Mandatory Test Coverage

**Status**: Design Complete  
**Created**: 2025-10-19  
**Purpose**: Ensure all feature work includes verifiable tests before merging

---

## Problem Statement

Current issues with direct-to-main commits:

- No guarantee that new features include tests
- Agent might complete work without verification
- No structured reflection on "what was built" vs "how it's verified"
- Tests may exist but not clearly tied to the work
- No organization showing what tests verify what features

---

## Solution: Branch Workflow + Test Coverage Gates

### Workflow

```
1. Start Work
   ├─ Create feature branch: feature/[work-item]
   ├─ Record work objectives in branch metadata
   └─ Commit work + tests to branch

2. Before Merge
   ├─ Run test coverage validator
   ├─ Verify tests exist for work completed
   ├─ Require work verification document
   └─ Check test organization

3. Merge
   ├─ All checks pass → merge to main
   └─ Any check fails → blocked until fixed
```

---

## Branch Naming Convention

```
feature/[descriptive-name]     # New features
fix/[bug-description]          # Bug fixes
refactor/[component]           # Code refactoring
docs/[topic]                   # Documentation only
test/[coverage-improvement]    # Test additions
chore/[maintenance-task]       # Maintenance work
```

**Examples:**

- `feature/documentation-conventions`
- `feature/phase-1.1-agent-baseline`
- `fix/blog-validation-edge-case`
- `refactor/test-harness-metrics`

---

## Work Verification Document

Each branch must include a `WORK-VERIFICATION.md` in the branch root:

```markdown
# Work Verification: [Feature Name]

**Branch**: feature/[name]  
**Started**: YYYY-MM-DD  
**Completed**: YYYY-MM-DD

---

## Objectives

What was this work supposed to accomplish?

- [ ] Objective 1
- [ ] Objective 2
- [ ] Objective 3

---

## Deliverables

What files/features were created or modified?

### Created
- `path/to/new-file.js` - Purpose

### Modified
- `path/to/existing-file.js` - Changes made

---

## Verification Strategy

How do we know this work is correct?

### Test Coverage

| Objective | Test File | Test Description | Status |
|-----------|-----------|------------------|--------|
| Objective 1 | tests/feature/test-name.test.js | Verifies X behavior | ✅ Pass |
| Objective 2 | tests/feature/test-name.test.js | Verifies Y behavior | ✅ Pass |

### Manual Verification

Steps to manually verify (if applicable):
1. Step 1
2. Step 2
3. Expected result

---

## Test Organization

Tests are organized as follows:

```

tests/
├── feature/
│   └── test-documentation-conventions.test.js
│       ├── Suite: Documentation Conventions Validator
│       │   ├── validates file naming (5 tests)
│       │   ├── validates file locations (3 tests)
│       │   └── suggests fixes (4 tests)
│       └── Total: 12 tests

```

---

## Completion Checklist

- [ ] All objectives completed
- [ ] Tests written for all objectives
- [ ] All tests passing
- [ ] Test evidence recorded
- [ ] Documentation updated
- [ ] WORK-VERIFICATION.md complete
- [ ] Ready to merge
```

---

## Pre-Merge Validation Script

`scripts/pre-merge-check.js`:

```javascript
#!/usr/bin/env node
/**
 * Pre-Merge Validation
 * 
 * Ensures branch includes proper test coverage before merging.
 * 
 * Checks:
 * 1. WORK-VERIFICATION.md exists
 * 2. Test files referenced in verification doc exist
 * 3. Tests mentioned are actually passing
 * 4. Work objectives map to tests
 * 5. Test organization is documented
 */

// Validation logic
```

**Usage:**

```bash
# Before creating PR/merge
node scripts/pre-merge-check.js

# Output:
✅ WORK-VERIFICATION.md found
✅ 3 objectives defined
✅ 3 test files referenced
✅ All 12 tests passing
✅ Test organization documented
🎉 Ready to merge!
```

---

## Agent Prompts for Test Creation

### Prompt 1: Work Reflection

```
Before committing your work, step back and reflect:

1. What were you asked to build?
2. What did you actually build?
3. How can someone verify it works correctly?
4. What edge cases might break it?

Create WORK-VERIFICATION.md documenting your answers.
```

### Prompt 2: Test Strategy

```
For each objective you completed:

1. Identify the expected behavior
2. List ways that behavior could fail
3. Write tests covering:
   - Happy path (expected use)
   - Edge cases (boundaries, empty inputs)
   - Error cases (invalid inputs, failures)

Organize tests by feature/objective, not by file.
```

### Prompt 3: Test Organization

```
Your test file should be organized like:

describe('Feature: [Feature Name]', () => {
  describe('Objective 1: [What it does]', () => {
    test('handles normal case', ...);
    test('handles edge case X', ...);
    test('handles error case Y', ...);
  });
  
  describe('Objective 2: [What it does]', () => {
    test('...', ...);
  });
});

This makes it clear what each test verifies.
```

---

## Git Hooks Integration

### `.git/hooks/pre-push`

```bash
#!/bin/bash
# Pre-push hook - validates test coverage before pushing

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Skip checks for main branch
if [ "$CURRENT_BRANCH" = "main" ]; then
  exit 0
fi

# Run pre-merge validation
node scripts/pre-merge-check.js

if [ $? -ne 0 ]; then
  echo "❌ Pre-merge validation failed"
  echo "Fix issues before pushing or merging"
  exit 1
fi

exit 0
```

### `.github/workflows/pr-validation.yml` (if using GitHub)

```yaml
name: PR Validation

on:
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Validate work verification
        run: node scripts/pre-merge-check.js
        
      - name: Run tests
        run: npm test
        
      - name: Check test coverage
        run: npm run test:coverage
```

---

## Test Organization Standards

### Directory Structure

```
tests/
├── feature/                    # Feature-specific tests
│   ├── test-conventions.test.js
│   └── test-blog-agent.test.js
├── integration/                # Integration tests
│   └── test-quality-gates.test.js
├── unit/                       # Unit tests
│   └── test-validators.test.js
├── regression/                 # Regression tests
│   └── test-known-bugs.test.js
└── phase-[X]/                  # Phase-specific tests
    └── test-[phase-work].test.js
```

### Naming Conventions

**Test Files:**

- `test-[feature-name].test.js` - Feature tests
- `test-[component-name].spec.js` - Component specs
- `test-[issue-number].test.js` - Bug regression tests

**Test Suites:**

```javascript
describe('Feature: Documentation Conventions', () => {
  describe('File Naming Validation', () => {
    test('accepts lowercase-with-dashes', ...);
    test('rejects camelCase', ...);
    test('rejects PascalCase', ...);
  });
  
  describe('File Location Validation', () => {
    test('allows special docs in root', ...);
    test('blocks content docs in root', ...);
  });
});
```

**Benefits:**

- Clear hierarchy (Feature → Capability → Test)
- Easy to find tests for a feature
- Test output shows what broke at which level

---

## Enforcement Levels

### Level 1: Warning (Soft Block)

```
⚠️ WORK-VERIFICATION.md missing
   Tests may exist but aren't documented
   Run: node scripts/init-work-verification.js
```

**Action**: Warn but allow merge

### Level 2: Error (Hard Block)

```
❌ No tests found for branch work
   Work objectives: 3
   Test files: 0
   
   All feature work must include tests.
   See: docs/architecture/branch-workflow.md
```

**Action**: Block merge until fixed

### Level 3: Coverage Threshold

```
❌ Test coverage below threshold
   Current: 65%
   Required: 80%
   
   Add tests to increase coverage.
```

**Action**: Block merge until threshold met

---

## Configuration

### `opencode.json`

```json
{
  "git": {
    "workflow": {
      "requireBranches": true,
      "protectedBranches": ["main"],
      "branchPrefixes": ["feature/", "fix/", "refactor/", "docs/", "test/", "chore/"]
    },
    "preMerge": {
      "requireWorkVerification": true,
      "requireTests": true,
      "minCoverageIncrease": 0,
      "allowedWithoutTests": ["docs/", "chore/"]
    },
    "testOrganization": {
      "structure": "hierarchical",
      "namingConvention": "test-[feature].test.js",
      "requireDescriptiveSuites": true
    }
  }
}
```

---

## Workflow Examples

### Example 1: Feature Branch

```bash
# 1. Create branch
git checkout -b feature/documentation-conventions

# 2. Initialize work verification
node scripts/init-work-verification.js

# 3. Do the work
# ... create files, write code ...

# 4. Write tests
# ... create test files ...

# 5. Update work verification
# ... document objectives, tests, verification ...

# 6. Validate before merge
node scripts/pre-merge-check.js

# 7. Commit and push
git add -A
git commit -m "feat: documentation conventions system"
git push origin feature/documentation-conventions

# 8. Create PR (if using GitHub)
# 9. Merge after validation passes
```

### Example 2: Test-Only Branch

```bash
# 1. Create branch for adding missing tests
git checkout -b test/add-validator-coverage

# 2. Write tests for existing code
# ...

# 3. Verify tests pass
npm test

# 4. Update WORK-VERIFICATION.md
# Document what coverage was added

# 5. Merge
git checkout main
git merge test/add-validator-coverage
```

---

## Benefits

### For Quality

✅ **No untested features** - Every feature branch must include tests  
✅ **Clear verification** - Work verification doc shows what and how  
✅ **Test organization** - Easy to find tests for any feature  
✅ **Regression protection** - Tests are tied to work items  

### For Agents

✅ **Structured thinking** - Forced reflection on objectives vs verification  
✅ **Clear requirements** - Know exactly what's needed before merge  
✅ **Self-documenting** - Tests document expected behavior  
✅ **Quality feedback** - Can't skip testing step  

### For Developers

✅ **Protected main** - Main branch is always stable  
✅ **Easy review** - Work verification shows what changed and why  
✅ **Confidence** - Know work is tested before merging  
✅ **Debugging** - Tests show expected vs actual behavior  

---

## Implementation Plan

### Phase 1: Core Infrastructure

- [ ] Create `scripts/pre-merge-check.js`
- [ ] Create `scripts/init-work-verification.js`
- [ ] Add WORK-VERIFICATION.md template
- [ ] Update opencode.json with git workflow config

### Phase 2: Git Integration

- [ ] Add pre-push git hook
- [ ] Configure branch protection (if using GitHub)
- [ ] Add PR validation workflow

### Phase 3: Agent Integration

- [ ] Add work verification prompts to agent specs
- [ ] Create test organization guidelines
- [ ] Add to quality gates

### Phase 4: Documentation

- [ ] Update GETTING-STARTED.md with workflow
- [ ] Create workflow examples
- [ ] Document in project plan

---

## Edge Cases & Solutions

### Edge Case 1: Documentation-Only Changes

**Solution**: Branch prefix `docs/` can skip test requirements

### Edge Case 2: Chore/Maintenance Work

**Solution**: Branch prefix `chore/` has relaxed test requirements

### Edge Case 3: Urgent Hotfixes

**Solution**: `fix/` prefix requires regression test for the bug

### Edge Case 4: Refactoring

**Solution**: Existing tests must still pass, coverage can't decrease

---

## Validation Errors & Fixes

### Error: "WORK-VERIFICATION.md not found"

```bash
# Fix: Initialize verification document
node scripts/init-work-verification.js
```

### Error: "No tests referenced in verification"

```bash
# Fix: Add test files and update verification
# 1. Write tests
# 2. Update WORK-VERIFICATION.md with test references
```

### Error: "Test file referenced but doesn't exist"

```bash
# Fix: Create the test file or fix the reference
```

### Error: "Objectives don't map to tests"

```bash
# Fix: Add tests for uncovered objectives or remove objectives
```

---

## Success Metrics

- **Test Coverage**: % of code covered by tests
- **Feature Verification Rate**: % of features with documented tests
- **Merge Block Rate**: % of merges blocked for missing tests
- **Test Organization Score**: % of tests with descriptive suites

**Target**:

- 90%+ features have documented verification
- <5% merge blocks (high compliance)
- 100% tests organized by feature

---

**Result**: Foolproof system ensuring agents always include tests with clear verification before merging work.
