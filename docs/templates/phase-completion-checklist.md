# Phase Completion Checklist Template

**Phase**: {PHASE_ID}  
**Started**: {DATE}  
**Completed**: {DATE}

---

## Pre-Completion Checklist

Use this checklist before marking any phase complete. All items must be checked.

### 🧪 Test Requirements

- [ ] All specified tests exist in `tests/phase-X/`
- [ ] All tests have been executed successfully
- [ ] Test execution recorded: `npm test && node scripts/test-evidence.js {PHASE_ID}`
- [ ] Test evidence verified: `node scripts/test-evidence.js --verify {PHASE_ID}`
- [ ] Metrics collected and saved to `docs/metrics/`
- [ ] Test evidence is recent (< 10 minutes old)

**Test Evidence Location**: `docs/phases/{PHASE_ID}/test-evidence/`

### 📁 File Organization

- [ ] No session files (SESSION, NOTES, PROGRESS) in root directory
- [ ] All working files in `docs/phases/{PHASE_ID}/`
- [ ] Only final deliverables moved to their permanent locations
- [ ] File locations validated: `node scripts/file-location-check.js`
- [ ] `.gitignore` rules prevent session files from being committed

**Verification**: Run `node scripts/file-location-check.js --staged`

### 📋 Deliverables

List all required deliverables for this phase:

- [ ] `{deliverable-1}` - {description}
- [ ] `{deliverable-2}` - {description}
- [ ] `{deliverable-3}` - {description}

**Verification**: Each deliverable exists and is in correct location

### 📝 Documentation

- [ ] `progress.md` completed in phase directory
- [ ] `notes.md` has design decisions documented
- [ ] `STATUS.md` updated with current phase and stats
- [ ] `README.md` (if new files added to project structure)
- [ ] All code has appropriate comments
- [ ] Any new patterns documented in `docs/`

### 🔍 Quality Gates

- [ ] Pre-commit hook installed and working
- [ ] Gate check passes: `node scripts/gate-check.js`
- [ ] No uncommitted changes (except this checklist)
- [ ] All lint errors resolved
- [ ] No console.log or debug statements left in code

**Verification**: Run `node scripts/gate-check.js --phase={PHASE_ID}`

### 🎯 Phase-Specific Requirements

Add phase-specific requirements here:

- [ ] {Requirement 1}
- [ ] {Requirement 2}
- [ ] {Requirement 3}

### ✅ Final Steps

- [ ] All checklist items above are complete
- [ ] Reviewed all changes one final time
- [ ] Commit message prepared: `feat: {PHASE_ID}-{description}`
- [ ] Ready to commit and push

---

## Commit Process

Once all items checked:

```bash
# 1. Stage all changes
git add -A

# 2. Run final gate check (pre-commit hook will run automatically)
node scripts/gate-check.js --phase={PHASE_ID}

# 3. Commit with proper message
git commit -m "feat: {PHASE_ID}-{description}

Completed:
- Item 1
- Item 2
- Item 3

Metrics:
- Tests: X passed
- Files created: Y
- Token count: Z (if applicable)

Closes #{ISSUE_NUMBER} (if applicable)"

# 4. Tag the release
git tag {PHASE_ID}

# 5. Push everything
git push origin main --tags
```

---

## Post-Completion

- [ ] Updated TODO list / project board
- [ ] Marked phase complete in tracking system
- [ ] Notified team (if applicable)
- [ ] Created session summary (in phase directory, not root)
- [ ] Prepared for next phase

---

## Common Issues & Solutions

### Issue: Test evidence too old
```bash
# Solution: Re-run tests and record evidence
npm test
node scripts/test-evidence.js {PHASE_ID}
```

### Issue: File location violations
```bash
# Solution: Check violations and move files
node scripts/file-location-check.js --fix
git mv {wrong-location} {correct-location}
```

### Issue: Missing deliverables
```bash
# Solution: Check phase README for requirements
cat docs/phases/{PHASE_ID}/README.md
# Create missing files or update checklist if requirements changed
```

### Issue: Gate check fails
```bash
# Solution: Run detailed check and fix issues
node scripts/gate-check.js --phase={PHASE_ID}
# Fix each reported issue, then re-run
```

### Issue: Session files in root
```bash
# Solution: Move to phase directory
git mv SESSION-SUMMARY.md docs/phases/{PHASE_ID}/session-summary.md
# Or delete if not needed
git rm SESSION-SUMMARY.md
```

---

## Emergency Bypass

**⚠️ USE ONLY IN EMERGENCIES ⚠️**

If you absolutely must commit without passing gates:

```bash
git commit --no-verify -m "emergency: {reason}"
```

**Requirements for emergency bypass:**
1. Document reason in commit message
2. Create follow-up issue to fix
3. Fix within 24 hours
4. Never use for phase completion commits

---

## Verification Commands

Quick reference for all verification commands:

```bash
# Check file locations
node scripts/file-location-check.js

# Verify test evidence
node scripts/test-evidence.js --verify {PHASE_ID}

# Run full gate check
node scripts/gate-check.js --phase={PHASE_ID}

# Check git status
git status --porcelain

# View test evidence
cat docs/phases/{PHASE_ID}/test-evidence/latest-run.json

# List deliverables
cat docs/phases/{PHASE_ID}/README.md | grep "^\- \`"
```

---

## Notes

Add any phase-specific notes or deviations from standard process:

- 
- 
- 

---

**Completed By**: {NAME}  
**Completion Date**: {DATE}  
**Next Phase**: {NEXT_PHASE}
