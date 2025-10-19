# AI Agent Guidelines

> **Ultra-concise rules for AI coding agents working in this repository.**

⚡ **NEW**: [Auto-fix on save](docs/AUTO-FIX-SUMMARY.md) saves 80% of formatting tokens!

## Core Rules

1. **Always check STATUS.md first** - Know the current phase, in-progress work, and next steps
2. **Read CODE-STANDARDS.md** - Follow ES modules, TypeScript strict, cognitive complexity ≤15
3. **Run tests after changes** - `npm test` (Vitest, must pass before commits)
4. **Type-check before commit** - `npm run type-check` (TypeScript strict mode)
5. **Lint all code** - `npm run lint` (Biome, auto-fix with `npm run lint:fix`)
6. **Update documentation** - Keep STATUS.md, README.md, and relevant docs current
7. **Make atomic commits** - Small, focused commits with conventional commit messages
8. **No backup files** - Never commit `*.backup`, `*.old`, `*.bak`, `*.tmp`, `*~`, `*.orig`
9. **Use modern tools** - Vitest (not Jest), Biome (not ESLint/Prettier), TypeScript, ES modules
10. **Use current models** - gpt-4o-mini (default), claude-3-5-sonnet (reasoning), gpt-4o (coding)

## Quick Commands

```bash
npm test                  # Run all tests with Vitest
npm run type-check        # TypeScript type checking
npm run lint              # Check code with Biome + markdownlint
npm run lint:fix          # Auto-fix lint issues (code + markdown)
npm run lint:md:fix       # Auto-fix markdown only (faster)
npm run security          # Check vulnerabilities (npm audit + madge)
npm run ci                # Full CI checks (type + lint + test + security)
npm run verify            # Verify all tools installed
npm run audit-repository  # Check for outdated refs, backup files, etc.
npm run version:check     # Check version milestones and severity escalations
```

## Commit Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `perf`, `ci`, `build`

**Examples**:

- `feat(agents): add blog maintenance agent`
- `fix(tests): resolve ES module import issues`
- `docs: update STATUS.md with Phase 1.2 progress`
- `test: add coverage for model selection`
- `refactor: reduce cognitive complexity in audit script`

## File Organization

| Location | Purpose | Naming | Notes |
|----------|---------|--------|-------|
| `/scripts/` | Utility scripts | `kebab-case.ts` | Prefer TypeScript, use ES modules |
| `/tests/` | Test files | `*.test.ts` | Vitest, collocate with code or centralize |
| `/.opencode/` | Project config | `*.json`, `*.md` | Validation rules, conventions |
| `/docs/` | Documentation | `SHOUTING-CASE.md` or `kebab-case.md` | See docs/README.md |
| `/docs/phases/` | Phase docs | `phase-X.Y/` | One folder per phase |

## Conventions

| Aspect | Rule | Example |
|--------|------|---------|
| Imports | Use `node:` protocol | `import { readFile } from 'node:fs/promises';` |
| Modules | ES modules only | `import`/`export`, no `require()` |
| Types | TypeScript strict | No `any`, explicit types, strict null checks |
| Complexity | Max 15 cognitive | Split functions, use helpers, add directives |
| Test Coverage | 80% minimum | Lines, branches, functions, statements |
| Directives | In-file overrides | `// biome-ignore lint/rule: reason` |
| Async | Prefer promises | `async`/`await`, avoid callbacks |
| Error Handling | Try/catch + types | Handle errors, don't swallow |

## VS Code Integration

**Auto-fix on Save**: Install recommended extensions (`.vscode/extensions.json`):

- `biomejs.biome` - Code linting/formatting
- `DavidAnson.vscode-markdownlint` - Markdown linting/formatting
- `vitest.explorer` - Test runner

**Settings** (`.vscode/settings.json` configured):

- ✅ Format on save enabled for all file types
- ✅ Markdown auto-fixes on save (blank lines, code fences, etc.)
- ✅ Biome auto-fixes on save (imports, formatting)
- ✅ Organize imports on save

**Manual fixes**: `npm run lint:md:fix` (markdown only, faster than full lint)

## Version-Based Severity

Rules automatically escalate based on package version:

| Version | Phase | Behavior |
|---------|-------|----------|
| 0.1.0 | Development | Warnings only, focus on velocity |
| 0.5.0 | Pre-release | Outdated refs & stale STATUS become errors |
| 1.0.0 | Production | Uncommitted changes & missing files become errors |

**Check current status**: `npm run version:check`

This ensures quality increases incrementally without blocking early development.

## When Things Break

1. **Check lint errors** - `npm run lint` shows Biome and markdownlint issues
2. **Check type errors** - `npm run type-check` shows TypeScript issues
3. **Check test failures** - `npm test` shows Vitest failures
4. **Check security issues** - `npm run security` shows vulnerabilities and circular deps
5. **Check repository state** - `npm run audit-repository` shows outdated refs, backup files, etc.
6. **Check version severity** - `npm run version:check` shows milestone status
7. **Read the docs** - CODE-STANDARDS.md, STATUS.md, .opencode/validation-rules.json

## TypeScript Guidelines

### NEVER Remove Types to "Fix" Errors

⚠️ **CRITICAL**: Never cast to `any` or remove types to hide TypeScript errors. Fix the root cause instead.

❌ **NEVER DO THIS**:

```typescript
// BAD: Hiding the real problem
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

// GOOD: Use unknown when truly unknown, then narrow
const result: unknown = someFunction();
if (typeof result === 'object' && result !== null) {
  // Type narrowing here
}
```

### When `any` is Acceptable

Only use `any` when:

1. Interfacing with truly dynamic APIs where type is impossible to know
2. Temporarily during rapid prototyping (add `// TODO: type this` comment)
3. Wrapping untyped third-party libraries (create proper interface later)

Always add a comment explaining WHY `any` is needed and create a tracking issue.

### Project Maturity Levels

Our validation rules adapt based on project maturity:

- **Bootstrap** (0-100 commits): More lenient, focus on velocity
- **Development** (100-500 commits): Balanced guardrails
- **Production** (500+ commits): Strict enforcement

Check project maturity: `git rev-list --count HEAD`

## Anti-Patterns

❌ **DON'T**:

- Commit backup files (`*.backup`, `*.old`, `*.bak`, `*.tmp`, `*~`, `*.orig`)
- Use outdated dependencies (jest → vitest, eslint → biome, prettier → biome)
- Reference outdated models (gpt-4 → gpt-4o-mini, gpt-3.5-turbo → gpt-4o-mini, claude-2 → claude-3-5-sonnet)
- Let STATUS.md get stale (>24 hours old)
- Make commits with >10 uncommitted files
- Use `require()` (use ES `import` instead)
- **Cast to `any` to hide TypeScript errors** (fix the actual problem)
- Remove types to make errors go away (add proper types instead)
- Exceed cognitive complexity 15 (refactor with helpers)
- Skip tests ("I'll test later" = never)
- Ignore lint errors ("It's just a warning" = tech debt)

✅ **DO**:

- Make small, atomic commits
- Update STATUS.md after significant work
- Run `npm run ci` before pushing
- Use inline directives for exceptions: `// biome-ignore lint/rule: reason`
- Extract complex logic into helper functions
- Add JSDoc comments for public APIs
- Keep test files next to source or in `/tests/`
- Use path aliases: `@/`, `@scripts/`, `@tests/`
- Fix issues immediately (don't accumulate tech debt)
- Update .opencode/validation-rules.json when tools/models evolve
- Flag `any` types in code review (needs justification)
- Track technical debt with GitHub issues

## Agent Workflow

When starting a new task:

1. Read STATUS.md → Understand current state
2. Read relevant phase docs → Know deliverables
3. Check project maturity → `git rev-list --count HEAD`
4. Run `npm run audit-repository` → Check for issues
5. Make atomic changes → One concern per commit
6. Run `npm run ci` → Ensure quality
7. Update STATUS.md → Document progress
8. Commit with conventional format → Clear history

## Code Review Checklist

Before committing, agents should verify:

- [ ] No `as any` casts without justification comment
- [ ] No backup files (`*.backup`, `*.old`, etc.)
- [ ] TypeScript errors are fixed, not hidden
- [ ] Tests pass (`npm test`)
- [ ] Types are explicit and correct
- [ ] Complexity ≤15 per function
- [ ] STATUS.md updated if significant work
- [ ] Conventional commit message
- [ ] ≤10 uncommitted files

---

---

## Philosophy: Controlled Best Practices

This project aims to create **configurable guardrails with escape hatches**:

### Balance Points

- **Efficiency vs. Quality**: Move fast, but with automated safety nets
- **Strictness vs. Flexibility**: Adapt rules based on project maturity
- **Automation vs. Control**: Self-healing, but humans can override
- **Standards vs. Innovation**: Best practices with room for experimentation

### Escape Hatches

When you need to break a rule:

1. Add inline directive: `// biome-ignore lint/rule: reason`
2. Document WHY in a comment
3. Create a GitHub issue if it's technical debt
4. Add expiration date: `// TODO(2025-11-01): Remove this workaround`

### Configuration-Driven

All validation rules live in `.opencode/validation-rules.json` so they can:

- Be updated without code changes
- Adapt to new tools/models
- Be customized per project
- Evolve as the project matures

**Remember**: This repository uses a self-healing approach. When you see patterns that should be caught automatically, update the rules instead of just fixing the instance.

### Future Vision

**Goal**: Install `opencode-agents` in any project and get:

1. Automated best practices enforcement
2. Agent team to help implement features
3. Quality gates that adapt to project maturity
4. Incremental, well-structured workflows
5. Configurable rules with escape hatches

**Questions?** Check:

- STATUS.md (current status)
- CODE-STANDARDS.md (detailed standards)
- docs/project-plan.md (overall vision)
- .opencode/validation-rules.json (automated checks)
