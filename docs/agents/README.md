# Agent System Architecture

**Version:** 0.1  
**Date:** October 18, 2025  
**Status:** Initial Design

## Overview

The OpenCode Agents project uses autonomous agents to automate project maintenance, quality assurance, and content management. Each agent has a specific responsibility and operates independently while coordinating through shared state and event triggers.

## Agent Definition Schema

Each agent is defined with the following properties:

```yaml
agent:
  name: string                    # Unique agent identifier
  version: string                 # Semantic version
  description: string             # What the agent does
  triggers:                       # What activates this agent
    - type: string               # event|schedule|manual
      condition: string          # Trigger condition
  responsibilities:               # What the agent manages
    - string
  inputs:                         # Required data/state
    - name: string
      type: string
      required: boolean
  outputs:                        # What the agent produces
    - name: string
      type: string
      destination: string
  dependencies:                   # Other agents this depends on
    - string
  validation:                     # How to verify agent succeeded
    - check: string
      expected: string
```text
## Core Agents

### 1. Blog Maintenance Agent

**Purpose:** Automatically maintain blog post content based on project milestones

**Triggers:**

- Phase completion (commit message contains "phase-X.Y complete")
- Manual invocation with phase parameter
- Weekly freshness check

**Responsibilities:**

- Detect stub blog posts (posts with placeholder content)
- Update blog posts when corresponding phase completes
- Extract metrics and learnings from phase artifacts
- Ensure blog post metadata is current (last_updated, status)

**Inputs:**

- Phase completion event (phase ID, completion date)
- Phase artifacts (README.md, test results, session summary)
- Blog post templates
- Existing blog post content

**Outputs:**

- Updated blog post markdown files
- Blog post metadata (YAML frontmatter)
- Update log (what changed, why)

**Validation:**

- Blog post status changed from "stub" to "published"
- last_updated timestamp is current
- Post contains real data (no "TODO" or "Coming soon" markers)
- Word count exceeds minimum threshold (500 words)

**Implementation:**

```bash
# Trigger
scripts/agents/blog-maintenance-agent.js --phase phase-1.0

# Validation
scripts/agents/validate-blog-freshness.js
```text
---

### 2. Project Health Monitor Agent

**Purpose:** Continuously monitor project health and detect violations

**Triggers:**

- Daily at 9 AM
- Pre-commit hook (via gate-check.js)
- Manual invocation

**Responsibilities:**

- Run all quality gate checks
- Detect file location violations
- Check for stale documentation
- Verify test coverage meets thresholds
- Monitor metrics trends

**Inputs:**

- Current project state (files, tests, metrics)
- Historical metrics (past 30 days)
- Quality gate configurations
- Staleness thresholds

**Outputs:**

- Health report (markdown)
- Violation list (if any)
- Metrics dashboard data (JSON)
- Alerts (for critical issues)

**Validation:**

- All quality gates pass
- No critical violations detected
- Report generated successfully
- Metrics within acceptable ranges

**Implementation:**

```bash
# Trigger
scripts/agents/project-health-agent.js --report-path docs/health-report.md

# Daily cron
0 9 * * * cd /path/to/opencode-agents && npm run agent:health
```text
---

### 3. Test Evidence Recorder Agent

**Purpose:** Automatically capture and validate test execution evidence

**Triggers:**

- Test suite completion (npm test)
- Phase completion
- Manual invocation

**Responsibilities:**

- Record test execution timestamp
- Capture test results (passed/failed/total)
- Store test metrics (duration, coverage)
- Validate evidence freshness (< 10 minutes for phase completion)

**Inputs:**

- Test results (from Jest or other test runner)
- Phase identifier
- Test execution timestamp

**Outputs:**

- Evidence file (.evidence/phase-X.Y.json)
- Metrics file (docs/metrics/phase-X.Y-metrics.json)
- Test summary log

**Validation:**

- Evidence file created with valid JSON
- Timestamp is current
- All required fields present (timestamp, phase, status, results)

**Implementation:**

```bash
# Integrated with npm test
npm test && npm run test-evidence -- phase-1.0

# Validation
node scripts/test-evidence.js verify phase-1.0
```text
---

### 4. Documentation Sync Agent (Future)

**Purpose:** Keep documentation in sync with code changes

**Triggers:**

- Code commits that modify API or architecture
- Manual invocation

**Responsibilities:**

- Detect API changes (new functions, changed signatures)
- Update API documentation
- Refresh architecture diagrams
- Update code examples in docs

**Inputs:**

- Code diffs
- Existing documentation
- Diagram sources (Mermaid, PlantUML)

**Outputs:**

- Updated API docs
- Refreshed diagrams
- Change log

**Validation:**

- All public APIs documented
- Diagrams reflect current architecture
- Code examples compile/run

---

## Agent Coordination

### Event Flow

```text
User Action (commit, test, etc.)
    ↓
Trigger Detection
    ↓
Agent Activation
    ↓
Agent Execution
    ↓
Output Generation
    ↓
Validation Checks
    ↓
State Update / Notifications
```text
### Shared State

Agents coordinate through shared state stored in:

- `.evidence/` - Test execution records
- `docs/metrics/` - Performance and quality metrics
- `docs/phases/` - Phase artifacts and status
- `docs/blog/` - Blog post metadata

### Dependencies

```mermaid
graph TD
    A[Project Health Agent] --> B[File Location Check]
    A --> C[Test Evidence Recorder]
    A --> D[Blog Maintenance Agent]
    D --> C
    C --> E[Test Execution]
```text
## Integration with Quality Gates

Agents enhance quality gates by:

1. **Automating checks:** What was manual is now automatic
2. **Providing evidence:** Agents generate audit trails
3. **Closing loops:** Detect → Alert → Fix → Verify
4. **Trending:** Track metrics over time

## Implementation Plan

### Phase 1: Core Infrastructure (Current)

- ✅ Quality gate scripts (file-location-check, test-evidence, gate-check)
- ✅ Test suite for infrastructure
- ⏳ Fix remaining test failures

### Phase 2: First Agent (Next)

- [ ] Blog Maintenance Agent specification
- [ ] Blog post metadata schema
- [ ] Stub detection logic
- [ ] Phase artifact parser
- [ ] Blog update template engine

### Phase 3: Monitoring (Future)

- [ ] Project Health Agent
- [ ] Daily health reports
- [ ] Metric trending
- [ ] Alert system

### Phase 4: Advanced Automation (Future)

- [ ] Documentation Sync Agent
- [ ] Test Coverage Agent
- [ ] Dependency Update Agent
- [ ] Security Audit Agent

## Usage Examples

### Updating Blog After Phase Completion

```bash
# Manual trigger
npm run agent:blog -- --phase phase-1.0

# Automatic (via git hook)
git commit -m "chore: complete phase-1.0"
# → pre-commit hook detects phase completion
# → runs gate-check.js
# → triggers blog-maintenance-agent
# → updates docs/blog/03-corresponding-post.md
```text
### Daily Health Check

```bash
# Run all health checks
npm run agent:health

# Output: docs/health-report.md
# Includes:
# - File location violations
# - Stale documentation
# - Test coverage metrics
# - Blog freshness status
```text
### Verifying Agent System

```bash
# List all agents and their status
npm run agents:list

# Run validation on all agents
npm run agents:validate

# Test a specific agent
npm run agent:test -- blog-maintenance
```text
## Next Steps

1. **Implement Blog Maintenance Agent**
   - Create `scripts/agents/blog-maintenance-agent.js`
   - Add blog post metadata to all posts
   - Create phase artifact parser
   - Write integration tests

1. **Add Agent Registry**
   - Create `agents/registry.json` with all agent definitions
   - Build agent discovery system
   - Add agent validation tool

1. **Integrate with CI/CD**
   - Run health agent on every push
   - Block merges if critical violations found
   - Generate health badges for README

---

**See Also:**

- [Quality Gates Documentation](quality-gates.md)
- [Quality Gates Gaps Analysis](QUALITY-GATES-GAPS.md)
- [Blog Series Implementation](blog/README.md)
