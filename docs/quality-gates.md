# Quality Gates & Control System

**Purpose**: Prevent incomplete work and maintain project structure integrity  
**Last Updated**: 2025-10-18  
**Status**: Active

---

## Overview

This project uses a **defense-in-depth** approach to ensure quality and prevent common failure modes:

1. **Test Execution Gates**: Prevent marking work complete without running tests
2. **File Organization Gates**: Keep session files out of root, maintain clean structure
3. **Automated Validation**: Scripts that check requirements before commits
4. **Git Hooks**: Enforce rules automatically at commit time

---

## System Architecture

```
┌─────────────────────────────────────────────────┐
│              Developer / Agent                   │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │  Create Code  │
         │  + Tests      │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │  Run Tests    │───────┐
         └───────┬───────┘       │
                 │                │
                 ▼                ▼
         ┌───────────────┐  ┌──────────────────┐
         │ Record Evidence│  │ Test Evidence    │
         │ (test-evidence)│  │ JSON + Timestamp │
         └───────┬───────┘  └──────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │  Check Files  │
         │  (location)   │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │  Git Add      │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │  Git Commit   │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │ PRE-COMMIT    │◄───── Automatic
         │     HOOK      │
         └───────┬───────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
  ┌─────────┐      ┌──────────┐
  │ BLOCKED │      │ ALLOWED  │
  │ (Fix &  │      │ Commit   │
  │  Retry) │      │ Success  │
  └─────────┘      └──────────┘
```

---

## Control Layers

### Layer 1: Documentation (Educate)

**Purpose**: Help developers understand requirements  
**Enforcement**: Soft (guidance)

- Phase README files with requirements
- `docs/GETTING-STARTED.md` workflow guide
- Templates with embedded reminders
- This documentation

**When it fails**: Developer/agent doesn't read documentation

### Layer 2: Automated Scripts (Detect)

**Purpose**: Validate requirements on demand  
**Enforcement**: Medium (can be skipped)

#### `scripts/file-location-check.js`

Validates file placement rules

```bash
# Check all files
node scripts/file-location-check.js

# Check staged files only
node scripts/file-location-check.js --staged

# Show move commands for violations
node scripts/file-location-check.js --fix
```

#### `scripts/test-evidence.js`

Records and verifies test execution

```bash
# Record test evidence after running tests
npm test && node scripts/test-evidence.js phase-1.1

# Verify evidence exists and is recent
node scripts/test-evidence.js --verify phase-1.1

# Record even if tests failed (emergency)
node scripts/test-evidence.js phase-1.1 --force
```

#### `scripts/gate-check.js`

Comprehensive pre-commit validation

```bash
# Full check (auto-detects phase from commit msg)
node scripts/gate-check.js

# Check specific phase
node scripts/gate-check.js --phase=phase-1.1

# Skip test validation (for non-phase commits)
node scripts/gate-check.js --skip-tests

# Skip file validation
node scripts/gate-check.js --skip-files
```

**When it fails**: Developer forgets to run scripts

### Layer 3: Git Hooks (Prevent)

**Purpose**: Automatically enforce rules  
**Enforcement**: Hard (blocks commits)

#### `.git/hooks/pre-commit`

Runs automatically before every commit

```bash
# Calls: node scripts/gate-check.js
# Result: Blocks commit if any gate fails
```

**Bypass (emergency only)**:

```bash
git commit --no-verify -m "emergency: {reason}"
```

**When it fails**: Developer bypasses with `--no-verify`

### Layer 4: `.gitignore` Rules (Filter)

**Purpose**: Prevent session files from being tracked  
**Enforcement**: Hard (prevents staging)

```gitignore
# Session files blocked at root
/*SESSION*.md
/*NOTES*.md
/*PROGRESS*.md
/*DRAFT*.md

# But allowed in phase directories
!docs/phases/**/SESSION*.md
!docs/phases/**/NOTES*.md
```

**When it fails**: Developer forces add with `git add -f`

---

## Failure Modes & Controls

### Failure Mode 1: Work Marked Complete Without Running Tests

**Scenario**: Agent/developer updates STATUS.md, commits without executing tests

**Prevention**:

1. **Test Evidence Required**: `test-evidence.js` creates timestamped proof
2. **Gate Check**: `gate-check.js` verifies evidence exists and is recent (< 10 min)
3. **Pre-commit Hook**: Automatically blocks commit if evidence missing
4. **Phase Completion Checklist**: Explicit reminder to run tests

**Example**:

```bash
$ git commit -m "feat: phase-1.1-complete"
🔒 Running pre-commit quality gates...

═══════════════════════════════════════════════════════
  Gate Check - OpenCode Agents
═══════════════════════════════════════════════════════

📝 Commit message: "feat: phase-1.1-complete"
🎯 Detected phase completion: phase-1.1

3️⃣  Checking test evidence for phase-1.1...
❌ No test evidence found for phase-1.1
   Expected: docs/phases/phase-1.1/test-evidence/latest-run.json

   Run: npm test && node scripts/test-evidence.js phase-1.1

═══════════════════════════════════════════════════════
❌ GATE CHECK FAILED - Fix issues before committing
═══════════════════════════════════════════════════════

# Commit blocked!
```

### Failure Mode 2: Session Files in Root Directory

**Scenario**: `SESSION-SUMMARY.md` created in root and committed

**Prevention**:

1. **.gitignore**: Blocks staging of `/*SESSION*.md`
2. **File Location Check**: Validates all staged files
3. **Pre-commit Hook**: Blocks commit if violations found
4. **Gate Check**: Comprehensive validation

**Example**:

```bash
$ git add SESSION-SUMMARY.md
$ git commit -m "docs: add session summary"
🔒 Running pre-commit quality gates...

1️⃣  Checking file locations...
❌ Found 1 staged file(s) in wrong location:

1. SESSION-SUMMARY.md
   Should be: docs/phases/phase-X.Y/session-summary.md

═══════════════════════════════════════════════════════
❌ GATE CHECK FAILED - Fix issues before committing
═══════════════════════════════════════════════════════

# Commit blocked!
```

### Failure Mode 3: Missing Phase Deliverables

**Scenario**: Phase marked complete but deliverables not created

**Prevention**:

1. **Phase README**: Lists all required deliverables
2. **Gate Check**: Extracts and verifies deliverables exist
3. **Completion Checklist**: Explicit list to check off
4. **Universal Gate Test**: Automated test for all deliverables

**Example**:

```bash
$ node scripts/gate-check.js --phase=phase-0.2

4️⃣  Checking phase requirements for phase-0.2...
❌ Missing deliverables:
   - opencode.json
   - .opencode/agent/orchestrator.md
   - AGENTS.md

═══════════════════════════════════════════════════════
❌ GATE CHECK FAILED
═══════════════════════════════════════════════════════
```

### Failure Mode 4: Tests Exist But Haven't Been Executed

**Scenario**: Test files created but never run

**Prevention**:

1. **Test Evidence Timestamp**: Proves tests were executed, not just created
2. **Recency Check**: Evidence must be < 10 minutes old
3. **Test Status File**: Simple PASSED/FAILED indicator
4. **Metrics Collection**: Shows test results, not just existence

**Example**:

```bash
$ node scripts/test-evidence.js --verify phase-1.1

🔍 Verifying test evidence for phase-1.1...

❌ Test evidence is too old (45 minutes)
   Evidence must be < 10 minutes old

   Run: npm test && node scripts/test-evidence.js phase-1.1
```

---

## Concrete Requirements for Each Phase Transition

### Before Marking ANY Phase Complete

Run this sequence:

```bash
# 1. Run all tests for the phase
npm test tests/phase-X/

# 2. Record test evidence
node scripts/test-evidence.js phase-X.Y

# 3. Verify all requirements
node scripts/gate-check.js --phase=phase-X.Y

# 4. Check file locations
node scripts/file-location-check.js --staged

# 5. Review completion checklist
cat docs/templates/phase-completion-checklist.md
# Copy to phase dir and fill out

# 6. Commit (pre-commit hook runs automatically)
git add -A
git commit -m "feat: phase-X.Y-description"

# 7. Tag the release
git tag phase-X.Y

# 8. Push
git push origin main --tags
```

### Phase-Specific Gate Tests

Each phase should have a gate test:

```bash
tests/
  gates/
    test-phase-0.2-gate.js
    test-phase-1.1-gate.js
    test-phase-1.2-gate.js
    ...
```

Run before marking phase complete:

```bash
npm test tests/gates/test-phase-X.Y-gate.js
```

---

## File Organization Rules

### Allowed in Root

**Files**:

- `README.md` - Project overview
- `STATUS.md` - Current state
- `AGENTS.md` - Project conventions (created in Phase 0.2)
- `LICENSE` - License file
- `.gitignore` - Git ignore rules
- `opencode.json` - OpenCode configuration (created in Phase 0.2)
- `package.json` - Node dependencies

**Directories**:

- `.git/` - Git repository
- `.github/` - GitHub configuration
- `.opencode/` - Agent and tool configurations
- `docs/` - All documentation
- `tests/` - All tests
- `scripts/` - Utility scripts
- `node_modules/` - Dependencies
- `src/` - Source code (if applicable)

### Forbidden in Root

Any file matching these patterns:

- `*SESSION*.md`
- `*NOTES*.md`
- `*PROGRESS*.md`
- `*DRAFT*.md`
- `*WIP*.md`
- `*TODO*.md`
- `*TEMP*.md`

**Correct Location**: `docs/phases/phase-X.Y/`

### Working Files Structure

```
docs/phases/phase-X.Y/
  ├── README.md                # Phase overview & requirements
  ├── notes.md                 # Design decisions
  ├── progress.md              # Work log
  ├── session-summary.md       # Session notes (not in root!)
  ├── completion-checklist.md  # Filled-out checklist
  └── test-evidence/           # Test execution proof
      ├── latest-run.json
      ├── results-{timestamp}.json
      └── test-status.txt
```

---

## Testing Requirements

### Test Evidence Components

1. **Timestamped Proof**: `docs/phases/phase-X.Y/test-evidence/results-{timestamp}.json`
2. **Latest Run**: `docs/phases/phase-X.Y/test-evidence/latest-run.json`
3. **Status File**: `docs/phases/phase-X.Y/test-evidence/test-status.txt`
4. **Metrics**: `docs/metrics/phase-X.Y-metrics.json`

### Test Evidence Contents

```json
{
  "phase": "phase-1.1",
  "timestamp": "2025-10-18T12:34:56.789Z",
  "passed": true,
  "testResults": {
    "success": true,
    "summary": {
      "passed": 5,
      "failed": 0,
      "total": 5
    }
  },
  "gitCommit": {
    "commit": "abc123...",
    "branch": "main"
  },
  "environment": {
    "node": "v18.0.0",
    "platform": "darwin"
  }
}
```

### Test Recency Rules

- **Phase Completion**: Evidence must be < 10 minutes old
- **Regular Commits**: Evidence not required
- **Documentation Commits**: Skip with `--skip-tests`

### Test Execution Workflow

```bash
# 1. Write/modify code
# 2. Write/update tests
# 3. Run tests
npm test tests/phase-X/

# 4. If tests pass, record evidence
node scripts/test-evidence.js phase-X.Y

# 5. Verify evidence is valid
node scripts/test-evidence.js --verify phase-X.Y

# 6. Proceed with commit
git commit -m "feat: phase-X.Y-description"
```

---

## Bypassing Controls (Emergency Use Only)

### When to Bypass

- **Emergency hotfix**: Critical bug needs immediate fix
- **Infrastructure work**: Changes to control system itself
- **Documentation only**: Pure docs with no code/tests

### How to Bypass

```bash
# Skip pre-commit hook
git commit --no-verify -m "emergency: {reason}"

# Skip specific gate checks
node scripts/gate-check.js --skip-tests --skip-files
```

### Requirements for Bypass

1. **Document reason** in commit message
2. **Create follow-up issue** to properly fix
3. **Fix within 24 hours**
4. **Never use for phase completion**

### Audit Trail

All bypasses should be tracked:

```bash
# Search for bypassed commits
git log --grep="--no-verify"
git log --grep="emergency:"

# Review and create remediation issues
```

---

## Maintenance & Updates

### Adding New Phase

1. Create phase directory: `docs/phases/phase-X.Y/`
2. Copy README template
3. List deliverables in README
4. Copy gate test template: `tests/gates/test-phase-X.Y-gate.js`
5. Update DELIVERABLES constant in gate test
6. Copy completion checklist to phase directory

### Modifying Control Rules

1. Update script(s) in `scripts/`
2. Update documentation in this file
3. Test with example scenarios
4. Commit changes: `chore: update quality gates`
5. Notify team of changes

### Testing the Control System

```bash
# Test file location check
node scripts/file-location-check.js

# Test with violations (should fail)
touch SESSION-TEST.md
git add SESSION-TEST.md
node scripts/file-location-check.js --staged
# Should report violation

# Test test evidence
node scripts/test-evidence.js phase-test --force
node scripts/test-evidence.js --verify phase-test

# Test gate check
node scripts/gate-check.js --phase=phase-test
```

---

## Troubleshooting

### Pre-commit Hook Not Running

```bash
# Check hook exists and is executable
ls -la .git/hooks/pre-commit
# Should show: -rwxr-xr-x

# Make executable if needed
chmod +x .git/hooks/pre-commit

# Test hook manually
.git/hooks/pre-commit
```

### Test Evidence Won't Verify

```bash
# Check evidence file exists
cat docs/phases/phase-X.Y/test-evidence/latest-run.json

# Check timestamp is recent
date -u +"%Y-%m-%dT%H:%M:%S"
# Compare with evidence timestamp

# Re-run tests and record
npm test && node scripts/test-evidence.js phase-X.Y
```

### File Location Check Fails

```bash
# See detailed violations
node scripts/file-location-check.js

# See suggested fixes
node scripts/file-location-check.js --fix

# Move files as suggested
git mv {wrong-location} {correct-location}
```

### Gate Check Fails

```bash
# Run detailed check
node scripts/gate-check.js --phase=phase-X.Y

# Fix each reported issue
# Then re-run until all pass
```

---

## Metrics & Monitoring

### Success Metrics

- **Test Coverage**: 100% of phases have test evidence
- **False Positives**: < 5% of gate check failures are incorrect
- **Bypass Rate**: < 1% of commits use `--no-verify`
- **Session File Leaks**: 0 session files committed to root

### Audit Commands

```bash
# Check for session files in root
find . -maxdepth 1 -name "*SESSION*.md" -o -name "*NOTES*.md"

# Count bypassed commits
git log --oneline --grep="--no-verify" | wc -l

# Check test evidence completeness
for phase in docs/phases/phase-*; do
  phase_id=$(basename $phase)
  if [[ -f "$phase/test-evidence/latest-run.json" ]]; then
    echo "✓ $phase_id"
  else
    echo "✗ $phase_id - no evidence"
  fi
done
```

---

## Future Enhancements

### Planned Improvements

1. **CI/CD Integration**: GitHub Actions to run gate checks on PRs
2. **Web Dashboard**: Visual status of all phase gates
3. **Slack/Discord Notifications**: Alert on bypass usage
4. **Automated Remediation**: Scripts to auto-fix common violations
5. **Historical Metrics**: Track gate check success rates over time

### Enhancement Requests

Submit via GitHub Issues with label `enhancement:quality-gates`

---

## References

- **Phase Completion Checklist**: `docs/templates/phase-completion-checklist.md`
- **Gate Test Template**: `tests/gates/universal-gate.template.js`
- **Getting Started Guide**: `docs/GETTING-STARTED.md`
- **Project Plan**: `docs/project-plan.md`

---

## Questions & Support

**Issue**: Controls too strict / blocking legitimate work  
**Solution**: Use skip flags for appropriate cases: `--skip-tests` or `--skip-files`

**Issue**: Need to bypass for emergency  
**Solution**: Use `--no-verify` but document reason and fix within 24 hours

**Issue**: New phase type needs different rules  
**Solution**: Create phase-specific gate test, update this documentation

**Issue**: Control system has bugs  
**Solution**: Fix in `scripts/`, test thoroughly, commit with `chore:` prefix

---

**Last Updated**: 2025-10-18  
**Version**: 1.0.0  
**Status**: Production-ready
