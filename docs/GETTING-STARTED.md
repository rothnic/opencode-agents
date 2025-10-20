# Getting Started Guide

**For resuming work on OpenCode Agents project**

---

## Quick Start (30 seconds)

1. Open `STATUS.md` to see current state
2. Go to phase working directory (e.g., `docs/phases/phase-0.2/`)
3. Read phase `README.md`
4. Start working, create `notes.md` and `progress.md`
5. Complete task, update `STATUS.md`, commit

---

## Project Structure

```text
opencode-agents/
├── STATUS.md                 # ← Start here! Current state
├── README.md                 # Project overview
├── docs/
│   ├── project-plan.md      # Master plan (all phases)
│   ├── GETTING-STARTED.md   # This file
│   ├── SUMMARY.md           # Executive summary
│   ├── diagrams/            # Architecture diagrams
│   ├── templates/           # Reusable templates
│   └── phases/              # Phase working directories
│       ├── phase-0.2/       # ← Next: Work here
│       ├── phase-1.1/
│       ├── phase-1.2/
│       └── phase-1.3/
├── .opencode/               # (Created in Phase 0.2)
├── tests/                   # (Created in Phase 0.2)
└── scripts/                 # (Created in Phase 0.2)
```text
---

## Phase Working Directory Pattern

Each phase has a dedicated folder: `docs/phases/phase-X.Y/`

**Purpose**: Keep all working documents colocated and organized

### Standard Files

```text
docs/phases/phase-X.Y/
├── README.md           # Phase overview (already created)
├── notes.md            # Design decisions (you create)
├── progress.md         # Detailed work log (you create)
├── draft-*.md          # Draft configs/code (as needed)
├── issues.md           # Problems & solutions (as needed)
└── metrics.json        # Test results (if applicable)
```text
### Why This Pattern?

- **Colocated**: All phase-related files in one place
- **Organized**: Easy to find phase-specific work
- **Clean**: Doesn't clutter main docs
- **Traceable**: Complete history of decisions and progress

---

## Workflow for Each Phase

### 1. Start Phase

```bash
# Check current status
cat STATUS.md

# Go to phase directory
cd docs/phases/phase-X.Y/

# Read the phase README
cat README.md

# Create working files
touch notes.md progress.md
```text
### 2. Work on Phase

```bash
# Document decisions in notes.md
echo "## Design Decision: ..." >> notes.md

# Log progress in progress.md
echo "### Step 1: Created opencode.json" >> progress.md

# Create drafts first (before moving to root)
touch draft-opencode.json
# ... work on draft ...

# Reference the project plan for specs
# docs/project-plan.md (your phase section)

# Use templates
# docs/templates/*.md
```text
### 3. Complete Phase

```bash
# Move final files to appropriate locations
mv draft-opencode.json ../../opencode.json

# Run verification tests
npm test

# Update STATUS.md
nano ../../../STATUS.md
# Update: Current Phase, Last Updated, Quick Stats

# Commit with milestone tag
git add -A
git commit -m "feat: phase-X.Y-description"
git push

# Update TODO list (in GitHub Copilot)
# Mark phase as complete, move to next
```text
---

## Key References

### Must-Read Documents

1. **STATUS.md** (root) - Always check first
2. **docs/project-plan.md** - Detailed specifications for each phase
3. **Phase README.md** - Phase-specific overview
4. **docs/templates/** - Templates for agents, tools, tests

### Architecture Documents

- **docs/custom-coding-agents.md** - Multi-agent architecture patterns
- **docs/opencode-config.md** - Configuration deep dive
- **docs/diagrams/** - System diagrams

---

## Session Workflow

### Starting a New Session

1. ✅ Open `STATUS.md` - See what's next
2. ✅ Check TODO list - Confirm next task
3. ✅ Go to phase directory - `cd docs/phases/phase-X.Y/`
4. ✅ Read phase `README.md` - Understand objectives
5. ✅ Create `notes.md` - Document approach
6. ✅ Create `progress.md` - Log detailed steps

### During Work

1. 📝 Work in phase directory
2. 📝 Create drafts before finalizing
3. 📝 Reference `docs/project-plan.md` for specs
4. 📝 Use `docs/templates/` for boilerplate
5. 📝 Log progress continuously
6. 📝 Document decisions in notes

### Completing Work

1. ✅ Move final files to root locations
2. ✅ Run tests/verification
3. ✅ Update `STATUS.md`
4. ✅ Git commit with milestone tag
5. ✅ Update TODO list
6. ✅ Verify all changes pushed

---

## Project Principles

### Test-Driven Development

- Every feature has verification tests
- Boolean pass/fail (no subjective assessment)
- Tests written before or alongside code

### Incremental Progress

- Small steps with validation
- Commit frequently
- Each phase builds on previous

### Measurable Outcomes

- Track tokens, steps, execution time
- Compare to baselines
- Document metrics in phase directories

### Complete Documentation

- Working docs in phase directories
- Design decisions in notes.md
- Detailed progress in progress.md
- Everything version controlled

---

## Common Tasks

### Check Current Status

```bash
cat STATUS.md
```text
### Start Working on Current Phase

```bash
cd docs/phases/phase-0.2/  # or current phase
cat README.md
touch notes.md progress.md
```text
### Reference Project Plan

```bash
# Open in editor
code docs/project-plan.md
# Or view specific phase
grep -A 50 "Phase 0.2" docs/project-plan.md
```text
### Use a Template

```bash
# Copy agent template
cp docs/templates/agent-template.md docs/phases/phase-0.2/draft-agent.md
# Edit for your needs
```text
### Update Status After Completion

```bash
# Edit STATUS.md
nano STATUS.md
# Update:
# - Last Updated date
# - Current Phase (mark complete, set next)
# - Quick Stats (increment commits, etc.)
```text
### Commit Phase

```bash
git add -A
git status  # verify changes
git commit -m "feat: phase-X.Y-description"
git push
```text
---

## Next 5 Phases (Quick Reference)

### Phase 0.2: Create Project Structure (NEXT)

- **Work in**: `docs/phases/phase-0.2/`
- **Goal**: Set up OpenCode config and test infrastructure
- **Deliverables**: opencode.json, .opencode/, tests/, scripts/, AGENTS.md
- **Commit**: `feat: phase-0.2-project-structure`

### Phase 1.1: Hello World Baseline (⭐)

- **Work in**: `docs/phases/phase-1.1/`
- **Goal**: Establish baseline metrics
- **Deliverables**: First test, generated code, metrics
- **Commit**: `test: phase-1.1-baseline-single-agent`

### Phase 1.2: Orchestrator Pattern (⭐⭐)

- **Work in**: `docs/phases/phase-1.2/`
- **Goal**: Task decomposition and delegation
- **Deliverables**: Orchestrator agent, delegation test
- **Commit**: `feat: phase-1.2-orchestrator-pattern`

### Phase 1.3: Metrics System (⭐⭐)

- **Work in**: `docs/phases/phase-1.3/`
- **Goal**: Automated metrics collection
- **Deliverables**: Metrics framework, comparison tools
- **Commit**: `feat: phase-1.3-metrics-system`

### Phase 2.1: Two-Agent Collaboration (⭐⭐⭐)

- **Work in**: `docs/phases/phase-2.1/`
- **Goal**: Multi-agent integration
- **Deliverables**: CodeImplementer + TestWriter working together
- **Commit**: `feat: phase-2.1-two-agent-collaboration`

---

## Tips for AI Agents

### Context for New Sessions

- Read `STATUS.md` first for current state
- Phase directory contains all relevant work
- `project-plan.md` has detailed specifications
- Templates provide boilerplate

### Best Practices

- Work in phase directory first (drafts)
- Move to root only when finalized
- Document all decisions in notes.md
- Log detailed steps in progress.md
- Commit with descriptive milestone tags
- Update STATUS.md after each phase

### Phase 0.2 Specifics (Next Task)

- Create `opencode.json` with basic config
- Set up `.opencode/agent/` directory
- Create minimal `AGENTS.md` with conventions
- Set up test framework structure
- Create `scripts/measure.js` stub
- Verify with simple tests
- Document everything in phase directory

---

## Troubleshooting

### Can't find what's next?

→ Check `STATUS.md`, it always shows next action

### Don't know phase details?

→ Read `docs/phases/phase-X.Y/README.md`

### Need specifications?

→ See `docs/project-plan.md` (search for phase number)

### Need boilerplate?

→ Use files in `docs/templates/`

### Lost context?

→ Read phase `notes.md` and `progress.md`

---

## Project Goals (Reminder)

Build a reactive, predictable, measurable multi-agent coding system that:

- ✅ Demonstrates test-driven development
- ✅ Shows measurable improvement over single agents
- ✅ Includes adaptive learning (memory system)
- ✅ Completes complex real-world tasks
- ✅ Is fully documented and reproducible

---

**Ready to start?**  

1. Check `STATUS.md`  
2. Go to current phase directory  
3. Create `notes.md` and `progress.md`  
4. Begin work!
