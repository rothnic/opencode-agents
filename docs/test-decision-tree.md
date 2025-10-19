# Test Decision Tree - What to Test Before Each Step

**Purpose**: Concrete checklist of what must be verified before moving past any step  
**Last Updated**: 2025-10-18

---

## Universal Rules (Apply to ALL Steps)

Before moving to the next step in ANY phase:

```
✓ Current step's code/config exists
✓ Current step's tests exist
✓ Tests have been executed (not just written)
✓ Tests PASSED (not just ran)
✓ Test evidence recorded (< 10 minutes old)
✓ No session files in root
✓ File locations validated
✓ Changes committed to git
```

---

## Phase 0.2: Project Structure Setup

### Step 1: Create opencode.json
**Test Before Moving to Step 2**:
```bash
# Manual check
✓ File exists: opencode.json
✓ Is valid JSON: node -e "JSON.parse(require('fs').readFileSync('opencode.json'))"
✓ Has 'agents' property
✓ Has 'tools' property (if applicable)

# Automated test
✓ npm test tests/verify-config.test.js
```

### Step 2: Create .opencode/ directory structure
**Test Before Moving to Step 3**:
```bash
# Manual check
✓ Directory exists: .opencode/
✓ Subdirectory exists: .opencode/agent/
✓ Subdirectory exists: .opencode/tool/ (if applicable)

# Automated test
✓ npm test tests/verify-structure.test.js
```

### Step 3: Create agent configurations
**Test Before Moving to Step 4**:
```bash
# Manual check
✓ At least one agent config exists: .opencode/agent/*.md
✓ Agent config follows template format
✓ Front matter is valid YAML
✓ Agent has description, mode, instructions

# Automated test
✓ npm test tests/verify-agents.test.js
```

### Step 4: Create AGENTS.md
**Test Before Moving to Step 5**:
```bash
# Manual check
✓ File exists: AGENTS.md
✓ Contains "## Project Conventions" section
✓ Has at least 100 characters (not empty stub)

# Automated test
✓ npm test tests/verify-conventions.test.js
```

### Step 5: Create test structure
**Test Before Moving to Phase Completion**:
```bash
# Manual check
✓ Directory exists: tests/
✓ Subdirectory exists: tests/phase-1/
✓ Subdirectory exists: tests/helpers/
✓ Test framework executable: npm test -- --version

# Automated test
✓ npm test tests/verify-test-framework.test.js
```

### Phase 0.2 Completion Gate
**Test Before Marking Phase Complete**:
```bash
# Run ALL Phase 0.2 tests
✓ npm test tests/phase-0/

# Record test evidence
✓ node scripts/test-evidence.js phase-0.2

# Verify gate requirements
✓ node scripts/gate-check.js --phase=phase-0.2

# Manual checklist
✓ All 5 steps above completed
✓ All deliverables in correct locations
✓ STATUS.md updated
✓ progress.md documented
✓ No session files in root

# Commit
✓ git commit -m "feat: phase-0.2-project-structure"
```

---

## Phase 1.1: Hello World Baseline

### Step 1: Create baseline test
**Test Before Moving to Step 2**:
```bash
# Manual check
✓ File exists: tests/phase-1/test-1.1-hello-world.js
✓ Test imports agent runner helpers
✓ Test has clear expectations
✓ Test is executable

# Syntax check
✓ node -c tests/phase-1/test-1.1-hello-world.js
```

### Step 2: Run baseline test
**Test Before Moving to Step 3**:
```bash
# Execute test
✓ npm test tests/phase-1/test-1.1-hello-world.js

# Verify results
✓ Test PASSED (exit code 0)
✓ Output file created: src/hello.js (or expected location)
✓ Output functions correctly

# Manual verification
✓ node -e "console.log(require('./src/hello.js')())"
# Should output: "Hello, World!"
```

### Step 3: Collect metrics
**Test Before Phase Completion**:
```bash
# Manual check
✓ Metrics file exists: docs/metrics/phase-1.1-baseline.json
✓ Contains tokenCount
✓ Contains executionTime
✓ Contains stepCount

# Verify metrics are reasonable
✓ tokenCount < 1000 (baseline should be simple)
✓ executionTime < 60000 (1 minute)
```

### Phase 1.1 Completion Gate
**Test Before Marking Phase Complete**:
```bash
# Run ALL Phase 1.1 tests
✓ npm test tests/phase-1/

# Functional verification
✓ src/hello.js exists and works correctly
✓ node -e "console.log(require('./src/hello.js')())" outputs "Hello, World!"

# Record test evidence
✓ node scripts/test-evidence.js phase-1.1

# Verify gate requirements
✓ node scripts/gate-check.js --phase=phase-1.1

# Commit
✓ git commit -m "feat: phase-1.1-hello-world-baseline"
```

---

## Phase 1.2: Orchestrator Pattern

### Step 1: Create orchestrator config
**Test Before Moving to Step 2**:
```bash
# Manual check
✓ File exists: .opencode/agent/orchestrator.md
✓ Mode: subagent (or primary if specified)
✓ Has task decomposition instructions
✓ Permission: read, grep, todo allowed; edit, write denied

# Validation
✓ Front matter is valid YAML
✓ Instructions are clear
```

### Step 2: Create orchestrator test
**Test Before Moving to Step 3**:
```bash
# Manual check
✓ File exists: tests/phase-1/test-1.2-orchestrator.js
✓ Test prompts orchestrator with decomposable task
✓ Test verifies task decomposition
✓ Test verifies TODO list creation

# Syntax check
✓ node -c tests/phase-1/test-1.2-orchestrator.js
```

### Step 3: Run orchestrator test
**Test Before Phase Completion**:
```bash
# Execute test
✓ npm test tests/phase-1/test-1.2-orchestrator.js

# Verify results
✓ Test PASSED
✓ Orchestrator created TODO list
✓ TODO list has > 1 item
✓ Tasks are logical decomposition
```

### Phase 1.2 Completion Gate
**Test Before Marking Phase Complete**:
```bash
# Run ALL tests
✓ npm test tests/phase-1/

# Compare to baseline
✓ Orchestrator uses <= 130% of baseline tokens (from Phase 1.1)

# Record test evidence
✓ node scripts/test-evidence.js phase-1.2

# Verify gate requirements
✓ node scripts/gate-check.js --phase=phase-1.2

# Commit
✓ git commit -m "feat: phase-1.2-orchestrator-pattern"
```

---

## Phase 2.1: Two-Agent Collaboration

### Step 1: Create CodeImplementer agent
**Test Before Moving to Step 2**:
```bash
# Manual check
✓ File exists: .opencode/agent/codeimplementer.md
✓ Mode: subagent
✓ Permission: read, edit, write allowed
✓ Instructions focus on code creation

# Validation
✓ Agent can be invoked
✓ Agent config is valid
```

### Step 2: Create TestWriter agent
**Test Before Moving to Step 3**:
```bash
# Manual check
✓ File exists: .opencode/agent/testwriter.md
✓ Mode: subagent
✓ Permission: read, edit, write, bash (for npm test) allowed
✓ Instructions focus on test creation

# Validation
✓ Agent can be invoked
✓ Agent config is valid
```

### Step 3: Create collaboration test
**Test Before Moving to Step 4**:
```bash
# Manual check
✓ File exists: tests/phase-2/test-2.1-code-test-collaboration.js
✓ Test invokes orchestrator
✓ Test expects code + test files created
✓ Test verifies functionality
✓ Test verifies tests pass

# Syntax check
✓ node -c tests/phase-2/test-2.1-code-test-collaboration.js
```

### Step 4: Run collaboration test
**Test Before Phase Completion**:
```bash
# Execute test
✓ npm test tests/phase-2/test-2.1-code-test-collaboration.js

# Verify results
✓ Test PASSED
✓ Both agents were invoked (orchestrator delegated)
✓ Code file created: src/StringUtils.js
✓ Test file created: tests/StringUtils.test.js
✓ Implementation works: require('./src/StringUtils').reverse('hello') === 'olleh'
✓ Tests pass: npm test tests/StringUtils.test.js
✓ Test coverage >= 80%
```

### Phase 2.1 Completion Gate
**Test Before Marking Phase Complete**:
```bash
# Run ALL tests
✓ npm test tests/phase-2/

# Compare to single-agent baseline
✓ Multi-agent uses <= 130% of single-agent tokens

# Record test evidence
✓ node scripts/test-evidence.js phase-2.1

# Verify gate requirements
✓ node scripts/gate-check.js --phase=phase-2.1

# Commit
✓ git commit -m "feat: phase-2.1-two-agent-collaboration"
```

---

## Decision Tree Diagram

```
┌─────────────────────────┐
│   Start Step/Phase       │
└────────────┬─────────────┘
             │
             ▼
┌─────────────────────────┐
│  Write Code/Config      │
└────────────┬─────────────┘
             │
             ▼
┌─────────────────────────┐
│  Write Tests            │
└────────────┬─────────────┘
             │
             ▼
┌─────────────────────────┐
│  Run Tests              │
└────────────┬─────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
┌──────────┐  ┌──────────┐
│  PASS    │  │  FAIL    │
└────┬─────┘  └────┬─────┘
     │             │
     │             ▼
     │      ┌──────────────┐
     │      │ Debug & Fix  │
     │      └──────┬───────┘
     │             │
     │             └──────────┐
     │                        │
     ▼                        ▼
┌─────────────────────────────────┐
│  Record Test Evidence           │
│  (test-evidence.js)             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Verify File Locations          │
│  (file-location-check.js)       │
└────────────┬────────────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
┌──────────┐  ┌──────────┐
│  PASS    │  │  FAIL    │
└────┬─────┘  └────┬─────┘
     │             │
     │             ▼
     │      ┌──────────────┐
     │      │  Move Files  │
     │      └──────┬───────┘
     │             │
     │             └──────────┐
     │                        │
     ▼                        ▼
┌─────────────────────────────────┐
│  Run Gate Check                 │
│  (gate-check.js)                │
└────────────┬────────────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
┌──────────┐  ┌──────────┐
│  PASS    │  │  FAIL    │
└────┬─────┘  └────┬─────┘
     │             │
     │             ▼
     │      ┌──────────────────┐
     │      │  Fix Issues      │
     │      │  (per gate msg)  │
     │      └──────┬───────────┘
     │             │
     │             └──────────┐
     │                        │
     ▼                        ▼
┌─────────────────────────────────┐
│  Update Documentation           │
│  (STATUS.md, progress.md)       │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Git Commit                     │
│  (pre-commit hook runs)         │
└────────────┬────────────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
┌──────────┐  ┌──────────┐
│  PASS    │  │  FAIL    │
└────┬─────┘  └────┬─────┘
     │             │
     │             ▼
     │      ┌──────────────────┐
     │      │  Fix & Retry     │
     │      │  (per hook msg)  │
     │      └──────┬───────────┘
     │             │
     │             └──────────┐
     │                        │
     ▼                        ▼
┌─────────────────────────────────┐
│  Next Step/Phase                │
└─────────────────────────────────┘
```

---

## Quick Reference Card

### Before Every Code Change
```bash
# 1. Understand requirements
# 2. Write code
# 3. Write tests
```

### Before Every Commit
```bash
# 1. Run tests
npm test

# 2. Verify they pass
# (exit code 0)

# 3. Check file locations
node scripts/file-location-check.js --staged
```

### Before Every Phase Completion
```bash
# 1. Run all phase tests
npm test tests/phase-X/

# 2. Record evidence
node scripts/test-evidence.js phase-X.Y

# 3. Run gate check
node scripts/gate-check.js --phase=phase-X.Y

# 4. If all pass, commit
git commit -m "feat: phase-X.Y-description"
```

### If Gate Check Fails
```bash
# Read error message carefully
# Fix reported issues
# Re-run gate check
# Repeat until pass
```

### Emergency Bypass (RARE!)
```bash
# Only if absolutely necessary
git commit --no-verify -m "emergency: {reason}"

# Create follow-up issue
# Fix within 24 hours
```

---

## Red Flags (Things That Should Never Happen)

❌ **Marking phase complete without running tests**
- Gate check will block this

❌ **Committing session files to root**
- .gitignore + gate check will block this

❌ **Test evidence > 10 minutes old**
- Gate check will block this

❌ **Missing deliverables**
- Gate check will block this

❌ **Tests exist but never executed**
- Lack of evidence will block this

❌ **Using `--no-verify` for phase completion**
- Policy violation, creates technical debt

---

## Green Flags (Good Practices)

✅ **Tests written before code (TDD)**
✅ **Tests run after every code change**
✅ **Test evidence recorded immediately after test pass**
✅ **Gate check run before commit**
✅ **All session files in phase directories**
✅ **Commit messages follow convention**
✅ **Documentation updated with code**
✅ **No bypasses unless emergency**

---

## Example: Perfect Phase Completion Flow

```bash
# Phase 1.1 Example

# Step 1: Write test
vim tests/phase-1/test-1.1-hello-world.js

# Step 2: Run test (will fail, no implementation)
npm test tests/phase-1/test-1.1-hello-world.js
# Result: FAIL (expected)

# Step 3: Implement code
vim src/hello.js

# Step 4: Run test again
npm test tests/phase-1/test-1.1-hello-world.js
# Result: PASS ✓

# Step 5: Record evidence
node scripts/test-evidence.js phase-1.1
# Result: Evidence recorded ✓

# Step 6: Update documentation
vim docs/phases/phase-1.1/progress.md
vim STATUS.md

# Step 7: Check files
node scripts/file-location-check.js --staged
# Result: All files in correct locations ✓

# Step 8: Run gate check
node scripts/gate-check.js --phase=phase-1.1
# Result: ALL GATES PASSED ✓

# Step 9: Commit (pre-commit hook runs automatically)
git add -A
git commit -m "feat: phase-1.1-hello-world-baseline"
# Result: Commit successful ✓

# Step 10: Tag and push
git tag phase-1.1
git push origin main --tags
# Result: Phase 1.1 complete ✓
```

---

## When in Doubt

1. **Check gate check output**: It tells you exactly what's missing
2. **Review phase README**: Lists all requirements
3. **Consult quality-gates.md**: Comprehensive documentation
4. **Run tests first**: Always verify before committing
5. **Ask for help**: Better than bypassing controls

---

**Remember**: These controls exist to help you, not hinder you. They prevent mistakes and ensure quality. Follow the process, and you'll have a clean, well-tested, properly documented codebase.

---

**Last Updated**: 2025-10-18  
**Status**: Active  
**Applies To**: All phases
