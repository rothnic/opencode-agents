# Version-Based Severity Escalation

> **Progressive quality enforcement that adapts as your project matures.**

## Overview

This project uses **version-based severity escalation** to automatically increase quality standards as the codebase matures. Rules that are warnings in early development become errors at production milestones.

**Philosophy**: Move fast early, lock down quality as you approach release.

## Current Status

```bash
npm run version:check
```

**Output**:

```text
📦 Current version: 0.1.0

🎯 Version Milestones:

✅ ACTIVE (v0.1.0)
   Initial development - warnings only

⏳ Upcoming (at v0.5.0)
   Pre-release - some warnings become errors
   Escalations:
     - outdatedReferences → error
     - statusFreshness → error

⏳ Upcoming (at v1.0.0)
   Production - strict enforcement
   Escalations:
     - uncommittedChanges → error
     - requiredFiles → error
```

## Milestone Definitions

### v0.1.0 - Development (CURRENT)

**Severity**: Warnings only  
**Focus**: Velocity, experimentation, rapid prototyping  
**Behavior**: Issues are flagged but don't block commits

**Rules active**:

- ⚠️ Outdated dependencies (jest, eslint, prettier)
- ⚠️ Outdated models (gpt-4, gpt-3.5-turbo, claude-2)
- ⚠️ Stale STATUS.md (>24 hours old)
- ⚠️ Too many uncommitted files (>10)

**Allowances**:

- Temporary `any` types with TODO comments
- Rapid prototyping with cleanup phase
- Lower test coverage initially

### v0.5.0 - Pre-Release (UPCOMING)

**Severity**: Some warnings → errors  
**Focus**: Prepare for beta/production  
**Behavior**: Critical issues block commits

**Escalations**:

- ❌ **outdatedReferences** → error (must use modern tools)
- ❌ **statusFreshness** → error (docs must be current)

**Still warnings**:

- ⚠️ uncommittedChanges (can still have >10 files)
- ⚠️ requiredFiles (can be missing temporarily)

### v1.0.0 - Production (FUTURE)

**Severity**: All critical rules are errors  
**Focus**: Production-ready quality  
**Behavior**: Strict enforcement

**Escalations**:

- ❌ **uncommittedChanges** → error (max 10 files)
- ❌ **requiredFiles** → error (must have AGENTS.md, STATUS.md, etc.)

**All errors now**:

- ❌ Outdated dependencies
- ❌ Outdated models
- ❌ Stale documentation
- ❌ Too many uncommitted changes
- ❌ Missing required files

## Configuration

Milestones are defined in `.opencode/validation-rules.json`:

```json
{
  "rules": {
    "versionSeverity": {
      "enabled": true,
      "milestones": {
        "0.1.0": {
          "description": "Initial development - warnings only",
          "severity": "warning",
          "rules": ["outdatedReferences", "uncommittedChanges", "statusFreshness"]
        },
        "0.5.0": {
          "description": "Pre-release - some warnings become errors",
          "escalations": {
            "outdatedReferences": "error",
            "statusFreshness": "error"
          }
        },
        "1.0.0": {
          "description": "Production - strict enforcement",
          "escalations": {
            "uncommittedChanges": "error",
            "requiredFiles": "error"
          }
        }
      }
    }
  }
}
```

## How It Works

1. **Check current version** from `package.json`
2. **Compare with milestones** using semantic versioning
3. **Apply escalations** from lowest to current version
4. **Enforce at runtime** during audits and commits

## Commands

```bash
# Check current milestone status
npm run version:check

# Preview severity escalations
npm run version:apply

# Run audit with version-based severity
npm run audit-repository
```

## Benefits

### For Early Development (0.1.0)

- ✅ Focus on velocity
- ✅ Experiment freely
- ✅ Get warnings without blocking
- ✅ Build momentum

### For Pre-Release (0.5.0)

- ✅ Clean up technical debt
- ✅ Modernize dependencies
- ✅ Ensure docs are current
- ✅ Prepare for users

### For Production (1.0.0)

- ✅ Enforce best practices
- ✅ Prevent sloppy commits
- ✅ Maintain high quality
- ✅ Protect stable releases

## Version Bumping Strategy

When to bump versions:

```bash
# Bug fixes, minor tweaks
npm version patch  # 0.1.0 → 0.1.1

# New features, improvements
npm version minor  # 0.1.0 → 0.2.0

# Breaking changes, major milestones
npm version major  # 0.1.0 → 1.0.0
```

**Pre-release approach**:

```bash
# Approaching 0.5.0 milestone
npm version 0.4.0  # Still warnings
npm version 0.4.5  # Getting close
npm version 0.5.0  # ESCALATION: Some rules → errors

# Approaching 1.0.0 milestone
npm version 0.9.0  # Last chance to clean up
npm version 1.0.0  # ESCALATION: All rules → errors
```

## Override Mechanism

If you need to commit despite errors:

### 1. Add inline directive

```typescript
// biome-ignore lint/rule: reason
// TODO(2025-11-01): Remove this workaround
```

### 2. Temporarily disable rule

Edit `.opencode/validation-rules.json`:

```json
{
  "rules": {
    "outdatedReferences": {
      "enabled": false  // Temporarily
    }
  }
}
```

### 3. Force commit (last resort)

```bash
git commit --no-verify
```

**Always**:

- Document WHY in commit message
- Create GitHub issue to track
- Add expiration date
- Plan to fix before next milestone

## Integration with Project Maturity

This system complements [project maturity levels](./CONFIGURATION-SYSTEM.md#project-maturity-levels):

| Version | Commits | Maturity | Severity |
|---------|---------|----------|----------|
| 0.1.0 | 0-100 | Bootstrap | Warnings |
| 0.5.0 | 100-500 | Development | Mixed |
| 1.0.0 | 500+ | Production | Errors |

**Dual enforcement**:

- **Commit count** → Project maturity (allowances)
- **Version number** → Quality gates (escalations)

## Customization

Add your own milestones:

```json
{
  "versionSeverity": {
    "milestones": {
      "0.3.0": {
        "description": "Alpha release - add security checks",
        "escalations": {
          "security": "error"
        }
      },
      "2.0.0": {
        "description": "Enterprise - add compliance",
        "escalations": {
          "compliance": "error"
        }
      }
    }
  }
}
```

## Philosophy

**Goal**: Create configurable guardrails that grow with your project.

**Principles**:

1. **Don't block early progress** - Let teams move fast
2. **Increase rigor over time** - Lock down as you mature
3. **Make it visible** - Show what's coming with `version:check`
4. **Allow overrides** - Emergency escape hatch with accountability
5. **Automate the change** - No manual config updates needed

## Future Enhancements

- [ ] Auto-escalate based on commit count (not just version)
- [ ] Team-specific severity profiles
- [ ] Custom rules per directory
- [ ] Staged escalation warnings (2 weeks before milestone)
- [ ] Dashboard showing readiness for next milestone
- [ ] Integration with GitHub branch protection rules
