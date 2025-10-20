# Documentation Consolidation Plan

**Last Updated**: 2025-01-19  
**Goal**: Streamline documentation for clear developer experience

---

## Current State Analysis

### Documentation Files (65 total)

**Root Level**:

- `README.md` - Project overview (good)
- `STATUS.md` - Current state (good, just updated)
- `AGENTS.md` - Agent guidelines (good, concise)

**docs/ Directory**:

- `GETTING-STARTED.md` - Onboarding guide
- `project-plan.md` - Comprehensive plan (1286 lines)
- `INSTALLATION-FRAMEWORK.md` - NEW: Installation strategy
- `IMPLEMENTATION-ROADMAP.md` - NEW: Actionable roadmap
- `CODE-STANDARDS.md` - Coding standards
- `SUMMARY.md` - Executive summary
- Multiple architecture docs
- 16 blog posts
- Phase directories with working notes

**Issues**:

- ❌ Redundancy between project-plan.md, GETTING-STARTED.md, and new docs
- ❌ Phase directories have stale working notes
- ❌ No clear "start here" path
- ❌ Installation model not reflected in main README

---

## Consolidation Strategy

### Primary Documentation (Keep & Enhance)

#### 1. README.md → Entry Point

**Current**: Overview + architecture diagram  
**Update to**:

```markdown
# OpenCode Agents

> Test-driven multi-agent framework for autonomous software development

## Quick Start

### Install

```bash
npm install -g opencode-agents
opencode-agents init
```

### Use

```bash
# Start working with agents
opencode

# Run benchmarks
opencode-agents benchmark

# Validate quality
opencode-agents validate
```

## Documentation

- [Installation Guide](docs/INSTALLATION-FRAMEWORK.md) - Setup & configuration
- [Implementation Roadmap](docs/IMPLEMENTATION-ROADMAP.md) - Development plan
- [Agent Guidelines](AGENTS.md) - For AI agents working on this project
- [Code Standards](docs/CODE-STANDARDS.md) - Coding conventions
- [Blog Series](docs/blog/) - Development journey

## Architecture

[Keep existing diagram]

## Development Status

See [STATUS.md](STATUS.md) for current progress.

```

#### 2. INSTALLATION-FRAMEWORK.md → Primary Reference

**Status**: ✅ Created  
**Purpose**: Complete installation & usage guide  
**Audience**: Developers adopting the framework

#### 3. IMPLEMENTATION-ROADMAP.md → Development Plan

**Status**: ✅ Created  
**Purpose**: Step-by-step implementation plan  
**Audience**: Contributors & agents working on this project

#### 4. AGENTS.md → Agent Guidelines

**Status**: ✅ Already good  
**Purpose**: Ultra-concise rules for AI agents  
**Keep as-is**: Already follows design

#### 5. STATUS.md → Current State

**Status**: ⏳ Needs update  
**Purpose**: Track current progress  
**Update**: Reflect new roadmap

---

### Archive/Consolidate

#### Merge into README.md

- ❌ `docs/SUMMARY.md` → Redundant with README overview
- ❌ `docs/GETTING-STARTED.md` → Most content in README + INSTALLATION-FRAMEWORK

#### Keep in docs/

- ✅ `CODE-STANDARDS.md` - Detailed standards (reference)
- ✅ `opencode-config.md` - Configuration details
- ✅ `custom-coding-agents.md` - Agent architecture
- ✅ `architecture/` - Technical deep dives
- ✅ `blog/` - Development journey

#### Reduce project-plan.md

**Current**: 1286 lines (too long)  
**Action**: Extract to focused docs

- Planning → `IMPLEMENTATION-ROADMAP.md` (done)
- Installation → `INSTALLATION-FRAMEWORK.md` (done)
- Architecture → `architecture/` directory
- **Keep**: High-level vision & principles

---

### Phase Documentation Cleanup

#### Current: `docs/phases/phase-X.Y/`

Contains working notes, session files, progress tracking from early development.

**Issues**:

- Mixed purpose (planning + execution notes)
- Some files stale
- Confusing for new contributors

**Proposed Structure**:

```text
docs/phases/
├── README.md                 # Phase overview
├── completed/                # Archive
│   ├── phase-0.2/
│   └── phase-1.1/
└── current/                  # Active work
    └── phase-1-foundation/
        ├── README.md         # Phase goals
        ├── benchmarks.md     # Eval design
        └── results.md        # Actual results
```

**OR Simpler**:

Remove `phases/` entirely. Track progress in:

- `STATUS.md` - Current work
- `IMPLEMENTATION-ROADMAP.md` - Next steps
- Git history - Past decisions

---

## Action Plan

### Step 1: Update Core Docs ⏱️ 1 hour

- [ ] Update `README.md` with quick start
- [ ] Update `STATUS.md` with new roadmap
- [ ] Add links between docs

### Step 2: Archive Redundant Docs ⏱️ 30 min

```bash
mkdir docs/archive
mv docs/SUMMARY.md docs/archive/
mv docs/GETTING-STARTED.md docs/archive/
```

### Step 3: Reduce project-plan.md ⏱️ 1 hour

- [ ] Extract detailed sections to other docs
- [ ] Keep high-level vision & principles
- [ ] Add "see also" links

### Step 4: Clean Phase Directories ⏱️ 30 min

**Option A**: Archive old phases

```bash
mkdir docs/phases/archive
mv docs/phases/phase-0.2 docs/phases/archive/
mv docs/phases/phase-1.1 docs/phases/archive/
```

**Option B**: Remove entirely

```bash
rm -rf docs/phases
# Track progress in STATUS.md instead
```

**Recommendation**: Option B (simpler)

---

## Documentation Tree (Proposed)

```text
opencode-agents/
├── README.md                          # ← START HERE
├── STATUS.md                          # Current progress
├── AGENTS.md                          # Agent guidelines
├── package.json
├── opencode.json
├── .opencode/
│   ├── agents/
│   └── validation-rules.json
├── docs/
│   ├── INSTALLATION-FRAMEWORK.md      # Installation guide
│   ├── IMPLEMENTATION-ROADMAP.md      # Development plan
│   ├── CODE-STANDARDS.md              # Coding standards
│   ├── architecture/                  # Technical details
│   │   ├── opencode-config-strategy-with-cli.md
│   │   └── [other architecture docs]
│   ├── blog/                          # Development blog
│   │   ├── README.md
│   │   └── [16 posts]
│   ├── diagrams/                      # Architecture diagrams
│   └── templates/                     # Reusable templates
├── src/                               # Source code
├── tests/                             # Tests
├── scripts/                           # CLI & utilities
└── evals/                             # Benchmarks (NEW)
```

**Clear Path**:

1. `README.md` → Quick start
2. `INSTALLATION-FRAMEWORK.md` → Full installation guide
3. `IMPLEMENTATION-ROADMAP.md` → Development plan
4. `STATUS.md` → Current progress
5. `AGENTS.md` → Agent guidelines
6. `docs/CODE-STANDARDS.md` → Coding standards

---

## Decision Log

### Why Remove phases/?

- **Pro**: Simpler structure, less confusion
- **Pro**: Git history tracks progress better
- **Pro**: STATUS.md + ROADMAP replace need
- **Con**: Lose some historical context
- **Decision**: Archive first, can restore if needed

### Why Keep blog/?

- **Pro**: Valuable development journey documentation
- **Pro**: Demonstrates thinking process
- **Pro**: Useful for others building similar systems
- **Decision**: Keep, ensure README.md links to it

### Why Two Main Guides?

- **INSTALLATION-FRAMEWORK.md**: For users adopting the framework
- **IMPLEMENTATION-ROADMAP.md**: For contributors building it
- **Separation of concerns**: Different audiences

---

## Success Criteria

### Documentation is Good When

- [ ] New developer can start in <10 minutes
- [ ] Clear "start here" path from README
- [ ] No redundant information
- [ ] Each doc has single clear purpose
- [ ] Links between related docs
- [ ] Old/stale content archived, not deleted

### Validation

```bash
# Ask someone unfamiliar to:
1. Clone repo
2. Follow README.md
3. Get first agent working
4. Run first benchmark

# Should take < 30 minutes
```

---

## Immediate Next Actions

1. Update README.md with quick start
2. Update STATUS.md with roadmap reference
3. Archive SUMMARY.md and GETTING-STARTED.md
4. Add cross-links between docs
5. Test documentation flow

**Time Estimate**: 2-3 hours total
