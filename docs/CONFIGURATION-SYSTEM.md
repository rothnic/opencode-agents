# Configuration-Driven Validation System

> **Goal**: Create a reusable, configurable package that enforces controlled best practices across any project.

## Overview

The `opencode-agents` package provides a configuration-driven validation system that adapts to project maturity and can be installed in any new project. This system balances **efficiency vs. quality** and **strictness vs. flexibility** through configurable guardrails with escape hatches.

## Project Maturity Levels

The system automatically adapts validation rules based on git commit count:

| Level | Commits | Focus | Characteristics |
|-------|---------|-------|----------------|
| **Bootstrap** | 0-100 | Velocity | Lenient rules, rapid prototyping allowed, temporary `any` types OK with TODO comments |
| **Development** | 100-500 | Balance | Moderate enforcement, 60%+ test coverage, type safety required |
| **Production** | 500+ | Quality | Strict rules, 80%+ test coverage, no `any` without justification |

**Current Project**: 13 commits → **Bootstrap** phase

Check your project's maturity:

```bash
git rev-list --count HEAD
```

## Configuration Files

### `.opencode/validation-rules.json`

Central configuration for all validation rules:

```json
{
  "version": "1.0.0",
  "rules": {
    "outdatedReferences": {
      "enabled": true,
      "severity": "warning",
      "patterns": {
        "dependencies": { "jest": { "replacement": "vitest", ... } },
        "models": { "gpt-4": { "replacement": "gpt-4o-mini", ... } }
      }
    },
    "backupFiles": {
      "enabled": true,
      "severity": "error",
      "patterns": ["*.backup", "*.old", "*.bak", "*.tmp", "*~", "*.orig"],
      "autoFix": "delete"
    },
    "projectMaturity": {
      "levels": {
        "bootstrap": { "maxCommits": 100, "allowances": [...] },
        "development": { "maxCommits": 500, "enforcements": [...] },
        "production": { "enforcements": [...] }
      }
    }
  }
}
```

**Benefits**:

- Update rules without code changes
- Add new tool/model references as they evolve
- Customize per project
- Version-controlled configuration

### `.gitignore` Patterns

Backup file patterns are automatically added:

```ignore
*.tmp
*.temp
*.backup
*.old
*.bak
*~
*.orig
```

These patterns are **configurable** in `validation-rules.json` so different projects can define their own unwanted patterns.

## TypeScript Type Safety

### Critical Rule: Never Hide Type Errors

❌ **NEVER DO THIS**:

```typescript
// BAD: Hiding the problem
const data = JSON.parse(response) as any;
const result = someFunction() as any;
```

✅ **DO THIS INSTEAD**:

```typescript
// GOOD: Proper type definition
interface ApiResponse {
  id: string;
  name: string;
}
const data = JSON.parse(response) as ApiResponse;

// GOOD: Use unknown when truly unknown
const result: unknown = someFunction();
if (typeof result === 'object' && result !== null) {
  // Type narrowing
}
```

### When `any` is Acceptable

Only use `any` in these scenarios:

1. **Truly dynamic APIs** - When type is genuinely unknowable
2. **Rapid prototyping** - Add `// TODO: type this` comment + GitHub issue
3. **Third-party wrappers** - Create proper interface later

**Always**:

- Add comment explaining WHY
- Create GitHub issue for tracking
- Add expiration date: `// TODO(2025-11-01): Remove workaround`

### Project Maturity Impact

- **Bootstrap** (0-100 commits): Temporary `any` allowed with TODO
- **Development** (100-500 commits): `any` requires justification comment
- **Production** (500+ commits): `any` requires GitHub issue + code review

## Automated Validation

### Repository Audit Script

Run comprehensive checks:

```bash
npm run audit-repository        # Check all issues
npm run audit-repository --fix  # Auto-fix what's possible
```

**Detects**:

- ✓ Outdated dependencies (jest → vitest, eslint → biome)
- ✓ Outdated model references (gpt-4 → gpt-4o-mini)
- ✓ Backup files committed
- ✓ Stale STATUS.md (>24 hours old)
- ✓ Too many uncommitted changes (>10 files)
- ✓ Missing required files (AGENTS.md, STATUS.md, CODE-STANDARDS.md)
- ✓ Incorrect opencode.json config

**Auto-fixable**:

- Delete backup files
- Update opencode.json (testingFramework, defaultModel)

### Git Hooks

Pre-commit checks ensure quality:

```bash
# .git/hooks/pre-commit
npm run type-check      # TypeScript errors
npm run lint:staged     # Biome linting
npm run test:changed    # Related tests
npm run security        # Vulnerabilities
```

Commit message format enforcement:

```bash
# .git/hooks/commit-msg
# Validates conventional commit format
```

## Escape Hatches

### Inline Directives

Temporarily override rules:

```typescript
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Will refactor in next iteration
function complexFunction() {
  // ...
}
```

**Best Practices**:

- Always add reason after colon
- Create GitHub issue for technical debt
- Add expiration: `// TODO(2025-11-01): Refactor this`

### Configuration Overrides

Adjust rules in `validation-rules.json`:

```json
{
  "rules": {
    "uncommittedChanges": {
      "maxFiles": 20  // Increase for large refactors
    }
  }
}
```

## Installation Vision

**Future Goal**: Install in any new project:

```bash
# Install the package
npm install opencode-agents

# Initialize with interactive setup
npx opencode-agents init

# Agent assists with:
# - Tool selection (Vitest/Jest, Biome/ESLint, etc.)
# - Model configuration
# - Validation rules customization
# - Git hooks setup
# - Initial project structure
```

**What you get**:

1. Automated best practices enforcement
2. Agent team to implement features
3. Quality gates adapting to maturity
4. Incremental, structured workflows
5. Configurable rules with escape hatches
6. Self-healing validation system

## Philosophy

### Balance Points

| Aspect | Approach |
|--------|----------|
| **Efficiency vs. Quality** | Move fast with automated safety nets |
| **Strictness vs. Flexibility** | Adapt rules to project maturity |
| **Automation vs. Control** | Self-healing with human overrides |
| **Standards vs. Innovation** | Best practices with experimentation room |

### Core Principles

1. **Configuration over Code** - Update rules without code changes
2. **Evolve with Project** - Lenient early, strict later
3. **Escape Hatches** - Override with accountability
4. **Self-Healing** - Catch issues automatically
5. **Incremental** - Small commits, logical changes

## Current State

**Repository Status**:

- Commits: 13 (Bootstrap phase)
- Uncommitted files: 79 (needs cleanup)
- Validation system: Operational
- Audit script: Working

**Next Steps**:

1. Make incremental commits (reduce 79 → <10)
2. Update model references in documentation
3. Create code review agent to flag `any` types
4. Package for npm distribution
5. Create interactive `init` command

## References

- **AGENTS.md** - Ultra-concise guidelines for AI agents
- **CODE-STANDARDS.md** - Comprehensive coding standards
- **validation-rules.json** - Central configuration
- **docs/project-plan.md** - Overall vision
