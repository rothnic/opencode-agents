# Documentation Conventions System

**Status**: In Progress  
**Created**: 2025-10-19  
**Purpose**: Self-documenting, self-healing repository with configurable conventions

---

## Problem Statement

The `/docs` folder has organizational issues:

- Mix of ALL-CAPS and lowercase file names
- No clear rules about which files belong in root vs subdirectories
- Inconsistent naming conventions (camelCase, PascalCase, lowercase-with-dashes)
- No way for agents to know where to place new documents
- Conventions are implicit, not enforced

---

## Solution: Configurable Conventions System

A lint-style system for documentation with:

1. **`.opencode/conventions.json`** - Configuration file defining all rules
2. **`scripts/docs-conventions.js`** - Validator script (like ESLint for docs)
3. **Quality Gate Integration** - Pre-commit hook to catch violations
4. **Agent Instructions** - Embedded rules for document placement

---

## Convention Rules

### File Naming

| Type | Pattern | Examples | Usage |
|------|---------|----------|-------|
| **ALL-CAPS** | `^[A-Z][A-Z-]*\.md$` | README.md, GETTING-STARTED.md | Special/mandatory docs only |
| **lowercase-with-dashes** | `^[a-z][a-z0-9-]*\.md$` | project-plan.md, quality-gates.md | All content documents |
| **Numbered** | `^[0-9]{2}-[a-z][a-z0-9-]*\.md$` | 01-introduction.md | Blog posts, ordered guides |

### Directory Structure

```text
docs/
├── README.md              # Project documentation index
├── GETTING-STARTED.md     # Quick start guide
├── SUMMARY.md             # High-level project summary
│
├── architecture/          # System design, ADRs, technical specs
├── planning/              # Project plans, roadmaps, milestones
├── guides/                # How-tos, tutorials, instructions
├── blog/                  # Blog posts (numbered)
├── agents/                # Agent specifications
├── diagrams/              # Mermaid diagrams
├── metrics/               # Performance analysis
├── phases/                # Phase-specific work
└── templates/             # Reusable document templates
```text
### Rules

1. **docs-root-limited** (ERROR)
   - Only ALL-CAPS special docs allowed in `/docs` root
   - Content documents must go in subdirectories
   - Auto-suggests correct subdirectory based on content

1. **consistent-naming** (ERROR)
   - File names must be lowercase-with-dashes
   - Exceptions: README.md, GETTING-STARTED.md, SUMMARY.md
   - Can auto-fix by converting to lowercase

1. **no-mixed-case** (ERROR)
   - Prevents camelCase, PascalCase
   - Use either ALL-CAPS (special) or lowercase-with-dashes (content)

1. **blog-numbering** (ERROR)
   - Blog posts must be numbered: `##-title.md`
   - Ensures proper ordering

---

## Current Violations (Need Migration)

Files that need to move:

```text
docs/CODE-QUALITY-FIXES.md       → docs/architecture/code-quality-fixes.md
docs/QUALITY-GATES-GAPS.md       → docs/architecture/quality-gates-gaps.md
docs/custom-coding-agents.md     → docs/guides/custom-coding-agents.md
docs/opencode-config.md          → docs/guides/opencode-configuration.md
docs/project-plan.md             → docs/planning/project-plan.md
docs/quality-gates-implementation.md → docs/architecture/quality-gates-implementation.md
docs/quality-gates.md            → docs/architecture/quality-gates.md
docs/test-decision-tree.md       → docs/architecture/test-decision-tree.md
docs/blog/IMPLEMENTATION-SUMMARY.md → Remove or convert to blog post
```text
---

## Implementation Status

### ✅ Completed

- [x] Analyzed current docs structure
- [x] Created `.opencode/conventions.json` config (simplified)
- [x] Built `scripts/docs-conventions.js` validator
- [x] Created subdirectories (architecture/, planning/, guides/)

### 🚧 In Progress

- [ ] Fix JSON corruption in conventions.json
- [ ] Add complete rule definitions
- [ ] Test validator with all rules

### ⏳ Pending

- [ ] Create migration script to move files
- [ ] Execute migration (move 8 files)
- [ ] Add docs-conventions to quality gates
- [ ] Update agent specifications with placement rules
- [ ] Add to opencode.json configuration
- [ ] Document in GETTING-STARTED.md

---

## Usage

### Check Conventions

```bash
node scripts/docs-conventions.js
```text
### Check with Warnings

```bash
node scripts/docs-conventions.js --warnings
```text
### Check Only Staged Files (Pre-commit)

```bash
node scripts/docs-conventions.js --staged
```text
### Auto-fix Issues (Future)

```bash
node scripts/docs-conventions.js --fix
```text
---

## Agent Instructions

When creating documentation:

1. **Determine document type**:
   - Architecture/design → `docs/architecture/`
   - Plans/roadmaps → `docs/planning/`
   - How-tos/guides → `docs/guides/`
   - Blog posts → `docs/blog/`
   - Agent specs → `docs/agents/`

1. **Name the file**:
   - Use lowercase-with-dashes: `my-document.md`
   - Never camelCase or PascalCase
   - Only use ALL-CAPS for special docs (README, GETTING-STARTED, SUMMARY)

1. **Check conventions**:
   - Run `node scripts/docs-conventions.js` before committing
   - Fix any violations
   - Pre-commit hook will catch issues

---

## Integration with Quality Gates

Added as 4th quality check:

```javascript
4️⃣ Checking documentation conventions...
✅ All documentation follows conventions
```text
Or:

```javascript
4️⃣ Checking documentation conventions...
❌ 8 files violate conventions
   Run: node scripts/docs-conventions.js --fix
```text
---

## Benefits

1. **Self-Documenting**: Rules are explicit in configuration
2. **Self-Healing**: Auto-fix can correct many issues
3. **Reusable**: conventions.json can be copied to other projects
4. **Enforceable**: Pre-commit hooks prevent violations
5. **Agent-Friendly**: Clear rules agents can follow
6. **Escape Hatches**: Warnings vs errors, can be disabled per-rule

---

## Next Steps

1. Complete conventions.json with all rules
2. Run migration to fix current violations
3. Add to quality gates
4. Document in agent specs
5. Test with new documents

---

## Configuration Example

```json
{
  "version": "1.0.0",
  "documentation": {
    "fileOrganization": {
      "rules": [
        {
          "id": "docs-root-limited",
          "level": "error",
          "message": "Move to subdirectory",
          "autofix": { "enabled": true }
        }
      ]
    }
  },
  "validation": {
    "preCommit": { "enabled": true },
    "autofix": { "interactive": true }
  }
}
```text
---

**Result**: Repository that self-documents its conventions and prevents agents from violating them through automated quality gates.
