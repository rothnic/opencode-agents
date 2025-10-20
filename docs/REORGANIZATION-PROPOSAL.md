# Project Organization Quality Issues - Comprehensive Plan

**Date**: 2025-10-19  
**Status**: Proposal - Awaiting Approval  
**Priority**: HIGH - Foundation for extensible, reusable system

## Executive Summary

This document proposes a comprehensive reorganization to address multiple quality issues:

1. **Scripts folder clutter** (14 files in root, threshold: 5)
2. **Mixed .js and .ts files** (should be TypeScript only)
3. **Inconsistent configuration** (4 different config files in .opencode/)
4. **No validation for organization rules**
5. **Missing model sync capability** (no way to update from models.dev)
6. **Insufficient test coverage** for validation systems
7. **Missing agent-based test framework** architecture

## Current Issues Analysis

### Issue 1: Scripts Folder Organization

**Problem**: 14 files in `scripts/` root directory exceeds maintainability threshold (>5)

**Current State**:

```text
scripts/
├── agents/ (1 subdir)
├── audit-repository-state.ts
├── check-document-overlap.js
├── convert-to-esm.js
├── docs-conventions.js
├── file-location-check.js
├── gate-check-file-size.js
├── gate-check.js
├── init-work-verification.js
├── pre-merge-check.js
├── project-status.ts
├── run-agent.js
├── test-evidence.js
├── verify-tools.ts
└── version-severity-check.ts
```text
**Root Cause**: As project grows, we add scripts without grouping them logically.

**Impact**:

- Hard to find relevant scripts
- No clear ownership or categorization
- Doesn't scale as we add more automation
- Violates our own "N files threshold" principle

### Issue 2: Mixed JavaScript and TypeScript Files

**Problem**: 10+ `.js` files remain after "ES module migration" was marked complete

**Current State**:

```text
scripts/*.js:           10 files
tests/*.js:             6+ files
agents/*.js:            1+ files
```text
**Root Cause**: Incomplete migration, no automated check to prevent `.js` in new PRs

**Impact**:

- Inconsistent codebase
- No TypeScript safety in old scripts
- Confusion about which language to use
- Technical debt accumulation

### Issue 3: Configuration File Inconsistency

**Problem**: 4 different config files in `.opencode/` with overlapping purposes

**Current State**:

```text
.opencode/
├── conventions.json        # Naming conventions
├── conventions.yaml        # Duplicate in YAML?
├── override.yaml           # Override mechanism unclear
└── validation-rules.json   # Main validation config
```text
**Root Cause**: Organic growth without unified design

**Impact**:

- Hard to understand which config takes precedence
- No clear extension/override mechanism
- Users won't know how to customize for their projects
- Not packageable/distributable in current state

### Issue 4: No Organization Validation

**Problem**: We define rules but don't enforce them automatically

**Missing Checks**:

- Directory file count threshold (>5 files → error)
- Mixed file extensions (.js + .ts → error)
- Config file consistency
- Backup file detection already exists but needs integration

**Impact**:

- Rules decay over time
- Manual enforcement is error-prone
- Can't use project as template without cleanup

### Issue 5: No Model Sync Capability

**Problem**: OpenCode uses models.dev but we have no way to stay current

**Missing**: Script to sync from `https://models.dev/api.json`

**Needed Data**:

- Model IDs (e.g., `gpt-4o-mini`, `claude-3-5-sonnet-20241022`)
- Pricing (input/output tokens)
- Capabilities (attachments, reasoning, tool_call, temperature)
- Context limits
- Release dates and status (deprecated, etc.)

**Impact**:

- Manually tracking model changes
- Outdated references in validation rules
- Can't automatically update model recommendations

### Issue 6: Insufficient Test Coverage

**Problem**: Validation scripts lack comprehensive tests

**Current Coverage**:

- Some tests for gates (gate-check.test.js)
- Some tests for file-location-check
- No tests for organization rules
- No tests for config merging
- No integration tests for full validation flow

**Impact**:

- Can't confidently refactor
- Regressions slip through
- Users won't trust validation system

### Issue 7: No Agent Test Framework Architecture

**Problem**: No clear path to test agent teams on real tasks

**Needed Architecture**:

1. Initialize test repository (clean slate or specific scenario)
2. Give agent team a task (e.g., "add authentication")
3. Capture output (files changed, commits made)
4. Measure performance (time, iterations, errors)
5. Assert correctness (tests pass, quality gates pass)

**Current State**: Concept exists but no implementation plan

## Proposed Solutions

### Solution 1: Reorganize Scripts Directory

**New Structure**:

```text
scripts/
├── agents/                      # AI agent implementations
│   ├── blog-maintenance-agent.js → .ts
│   └── run-agent.js → .ts
├── validation/                  # Repository validation (non-blocking)
│   ├── audit-repository-state.ts
│   ├── check-document-overlap.js → .ts
│   ├── docs-conventions.js → .ts
│   ├── validate-organization.ts (NEW)
│   └── version-severity-check.ts
├── gates/                       # Quality gates (blocking)
│   ├── file-location-check.js → .ts
│   ├── gate-check-file-size.js → .ts
│   ├── gate-check.js → .ts
│   ├── init-work-verification.js → .ts
│   └── pre-merge-check.js → .ts
├── testing/                     # Test utilities
│   └── test-evidence.js → .ts
└── utils/                       # General utilities
    ├── convert-to-esm.js → .ts (archive after use)
    ├── project-status.ts
    ├── sync-models.ts (NEW)
    └── verify-tools.ts
```text
**Categorization Rules**:

- **agents/**: Runs AI agents or agent workflows
- **validation/**: Checks repository state (informational, can run anytime)
- **gates/**: Blocks commits/merges if quality criteria not met
- **testing/**: Test infrastructure and evidence collection
- **utils/**: General-purpose tools (doesn't fit other categories)

**Migration Process**:

1. Create subdirectories
2. Move files (git mv preserves history)
3. Update all imports
4. Update package.json scripts
5. Test all npm commands
6. Update documentation

### Solution 2: Complete TypeScript Migration

**Scope**: Convert all remaining `.js` files to `.ts`

**Priority Order**:

1. Scripts (highest impact, used in CI/CD)
2. Tests (type safety in assertions)
3. Agents (catch errors before runtime)

**Process**:

1. For each .js file:
   - Rename .js → .ts
   - Add type annotations
   - Fix any TypeScript errors
   - Update imports (remove .js extensions)
   - Test functionality
2. Add Biome rule to block new .js files in scripts/tests/agents
3. Update CI to fail on .js files in protected directories

**Validation**: Add to `audit-repository-state.ts`:

```typescript
// Check for mixed .js/.ts in directories
function checkMixedExtensions(dir: string): Issue[] {
  const files = getFiles(dir);
  const hasJS = files.some(f => f.endsWith('.js'));
  const hasTS = files.some(f => f.endsWith('.ts'));
  
  if (hasJS && hasTS) {
    return [{
      type: 'error',
      message: `Mixed .js and .ts files in ${dir}. Should be TypeScript only.`,
      files: files.filter(f => f.endsWith('.js'))
    }];
  }
  return [];
}
```text
### Solution 3: Unified Configuration System

**Goal**: Single, extensible configuration in `.opencode/validation-rules.json`

**New Structure**:

```text
.opencode/
├── config/                      # Archived/legacy configs
│   ├── conventions.json         # Archive: merged into validation-rules
│   ├── conventions.yaml         # Archive: merged into validation-rules
│   └── override.yaml            # Archive: use validation-rules.overrides
├── models.json                  # Synced from models.dev (NEW)
├── tools/                       # Custom tool definitions
│   └── ...                      # (existing)
└── validation-rules.json        # Single source of truth
```text
**Enhanced validation-rules.json Schema**:

```json
{
  "version": "2.0.0",
  "lastUpdated": "2025-10-19",
  "extends": ["@opencode-agents/defaults"],  // NEW: Extensibility
  
  "organizationRules": {  // NEW SECTION
    "maxFilesPerDirectory": 5,
    "requiredExtensions": {
      "scripts": [".ts"],
      "tests": [".ts"],
      "docs": [".md"]
    },
    "directoryStructure": {
      "scripts": ["agents", "validation", "gates", "testing", "utils"],
      "docs": ["phases", "architecture", "blog", "diagrams"]
    }
  },
  
  "namingConventions": {  // MERGED from conventions.json/yaml
    "files": { "scripts": "kebab-case", "tests": "*.test.ts" },
    "folders": { "scripts": "kebab-case" },
    "variables": { "constants": "SCREAMING_SNAKE_CASE" }
  },
  
  "projectMaturity": { /* existing */ },
  "versionSeverity": { /* existing */ },
  "outdatedReferences": { /* existing */ },
  "backupFiles": { /* existing */ },
  
  "overrides": {  // NEW: Replaces override.yaml
    "rules": {
      "organizationRules.maxFilesPerDirectory": 10,  // Example override
      "allowedExceptions": ["scripts/legacy/*"]
    }
  }
}
```text
**Migration**:

1. Parse conventions.json → merge into namingConventions
2. Parse conventions.yaml → merge into namingConventions (resolve conflicts)
3. Parse override.yaml → merge into overrides section
4. Archive old files to .opencode/config/ (don't delete, for reference)
5. Update all scripts to read from validation-rules.json only
6. Add JSON schema for validation

### Solution 4: Organization Validation Script

**Create**: `scripts/validation/validate-organization.ts`

**Checks**:

```typescript
interface OrganizationCheck {
  name: string;
  check: () => Issue[];
}

const checks: OrganizationCheck[] = [
  {
    name: 'Directory file count',
    check: () => checkDirectoryFileCounts(),
  },
  {
    name: 'Mixed file extensions',
    check: () => checkMixedExtensions(),
  },
  {
    name: 'Required subdirectories',
    check: () => checkRequiredStructure(),
  },
  {
    name: 'File naming conventions',
    check: () => checkNamingConventions(),
  },
  {
    name: 'Backup files',
    check: () => checkBackupFiles(),
  },
];
```text
**Integration**:

- Add to `npm run audit-repository`
- Add to `npm run ci`
- Add to pre-commit hook (warnings only in bootstrap phase)
- Report in `npm run status`

### Solution 5: Model Sync Script

**Create**: `scripts/utils/sync-models.ts`

**Functionality**:

```typescript
import { writeFileSync } from 'node:fs';

async function syncModels() {
  // Fetch from models.dev API
  const response = await fetch('https://models.dev/api.json');
  const modelsData = await response.json();
  
  // Transform to our format
  const transformed = {
    version: new Date().toISOString(),
    source: 'https://models.dev',
    models: modelsData.providers.flatMap(provider => 
      provider.models.map(model => ({
        id: `${provider.id}/${model.id}`,
        name: model.name,
        provider: provider.name,
        capabilities: {
          attachment: model.attachment,
          reasoning: model.reasoning,
          toolCall: model.tool_call,
          temperature: model.temperature,
        },
        cost: {
          input: model.cost?.input,
          output: model.cost?.output,
          reasoning: model.cost?.reasoning,
        },
        limits: {
          context: model.limit?.context,
          output: model.limit?.output,
        },
        status: model.status || [],
        releaseDate: model.release_date,
        lastUpdated: model.last_updated,
      }))
    ),
  };
  
  // Write to .opencode/models.json
  writeFileSync(
    '.opencode/models.json',
    JSON.stringify(transformed, null, 2)
  );
  
  console.log(`✅ Synced ${transformed.models.length} models from models.dev`);
}
```text
**Usage**:

- `npm run sync-models` - Manual sync
- GitHub Action: Monthly auto-sync with PR
- Use in validation to check for outdated model refs

**Integration with Validation**:

```typescript
// In validation-rules.json, reference models.json
{
  "outdatedReferences": {
    "models": {
      "source": ".opencode/models.json",
      "deprecated": ["status.includes('deprecated')"],
      "recommended": ["reasoning: true", "attachment: true"]
    }
  }
}
```text
### Solution 6: Comprehensive Test Suite

**Create**: `tests/validation/` directory

**Test Files**:

```text
tests/validation/
├── organization-rules.test.ts      # File count, extensions, structure
├── config-merging.test.ts          # Validation rules merging
├── model-validation.test.ts        # Model sync and validation
├── naming-conventions.test.ts      # File/folder naming
└── integration.test.ts             # Full validation flow
```text
**Coverage Goals**:

- Organization rules: 100% (critical for maintaining quality)
- Config merging: 100% (complex logic)
- Model validation: 90%
- Integration: 80% (happy path + major error cases)

**Test Approach**:

```typescript
describe('Organization Rules', () => {
  it('should error when directory has >5 files', () => {
    const mockDir = createMockDirectory({
      files: ['a.ts', 'b.ts', 'c.ts', 'd.ts', 'e.ts', 'f.ts']
    });
    const issues = checkDirectoryFileCounts(mockDir);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('error');
  });
  
  it('should error when mixing .js and .ts', () => {
    const mockDir = createMockDirectory({
      files: ['script.ts', 'legacy.js']
    });
    const issues = checkMixedExtensions(mockDir);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('Mixed .js and .ts');
  });
});
```text
### Solution 7: Agent Test Framework Architecture

**Document**: `docs/testing-strategy.md`

**Architecture**:

```typescript
interface AgentTestScenario {
  name: string;
  description: string;
  setup: () => Promise<TestRepository>;
  task: string;
  agents: AgentTeam;
  assertions: Assertion[];
  performanceMetrics: MetricDefinition[];
}

class TestRepository {
  async init(template?: string): Promise<void>;
  async getState(): Promise<RepoState>;
  async cleanup(): Promise<void>;
}

class AgentTeam {
  async executeTask(task: string): Promise<TaskResult>;
  async getMetrics(): Promise<PerformanceMetrics>;
}

interface TaskResult {
  filesChanged: string[];
  commits: Commit[];
  errors: Error[];
  duration: number;
  iterations: number;
}
```text
**Example Scenario**:

```typescript
const authScenario: AgentTestScenario = {
  name: 'Add Authentication',
  description: 'Add user authentication to Express API',
  setup: async () => {
    const repo = new TestRepository();
    await repo.init('express-api-starter');
    return repo;
  },
  task: 'Add JWT authentication with login/signup endpoints',
  agents: new AgentTeam(['coder', 'tester', 'reviewer']),
  assertions: [
    { type: 'file-exists', path: 'src/auth/controller.ts' },
    { type: 'tests-pass', pattern: '**/*.test.ts' },
    { type: 'no-security-issues', tool: 'npm audit' },
  ],
  performanceMetrics: [
    { name: 'time-to-completion', target: '<5 minutes' },
    { name: 'iterations', target: '<3 rewrites' },
    { name: 'test-coverage', target: '>80%' },
  ],
};
```text
**Implementation Phases**:

1. **Phase 1**: Document architecture (this document)
2. **Phase 2**: Implement TestRepository class
3. **Phase 3**: Implement AgentTeam wrapper
4. **Phase 4**: Create 3-5 baseline scenarios
5. **Phase 5**: Run scenarios and capture baseline metrics
6. **Phase 6**: Iterate to improve agent performance

## Implementation Plan

### Phase 1: Foundation (Week 1)

**Priority: CRITICAL**

1. **Reorganize scripts directory** (2-3 hours)
   - Create subdirectories
   - Move files with git mv
   - Update package.json
   - Test all scripts
   - Update imports

1. **Convert .js → .ts** (3-4 hours)
   - Prioritize scripts/
   - Then tests/
   - Add Biome rule to prevent new .js
   - Update CI

1. **Add organization validation** (2 hours)
   - Create validate-organization.ts
   - Add file count checks
   - Add extension checks
   - Integrate with audit-repository

### Phase 2: Configuration (Week 1-2)

**Priority: HIGH**

1. **Unified config system** (4-5 hours)
   - Design final schema
   - Merge existing configs
   - Archive old files
   - Update all consumers
   - Add JSON schema validation

1. **Model sync script** (2-3 hours)
   - Implement sync-models.ts
   - Fetch and transform models.dev data
   - Store in .opencode/models.json
   - Add npm script
   - Document usage

### Phase 3: Testing (Week 2)

**Priority: HIGH**

1. **Test suite for validation** (4-6 hours)
   - Organization rules tests
   - Config merging tests
   - Model validation tests
   - Integration tests
   - Achieve 80%+ coverage

### Phase 4: Agent Framework (Week 2-3)

**Priority: MEDIUM**

1. **Agent test framework design** (2-3 hours)
   - Document architecture in testing-strategy.md
   - Define interfaces
   - Create example scenarios
   - Plan implementation phases

1. **Update documentation** (2 hours)
   - Update AGENTS.md with new structure
   - Document config system
   - Update STATUS.md
   - Create migration guide

## Success Criteria

✅ **Organization**:

- All script directories have ≤5 files in root
- Clear categorization (agents/validation/gates/testing/utils)
- All files are TypeScript (.ts)

✅ **Configuration**:

- Single source of truth: .opencode/validation-rules.json
- Legacy configs archived in .opencode/config/
- Clear extension mechanism documented

✅ **Validation**:

- Automated checks for organization rules
- CI fails on violations
- Comprehensive test coverage (>80%)

✅ **Models**:

- Can sync from models.dev API
- Models stored in .opencode/models.json
- Validation uses current model data

✅ **Extensibility**:

- Users can install as package
- Users can use as template
- Clear override mechanism
- Well-documented patterns

✅ **Testing**:

- Agent test framework architecture documented
- Clear path to implementation
- Baseline scenarios defined

## Risks & Mitigations

**Risk**: Breaking existing scripts during reorganization
**Mitigation**: Use git mv (preserves history), comprehensive testing, incremental rollout

**Risk**: Config migration loses data
**Mitigation**: Archive old files, validate merged config, manual review

**Risk**: TypeScript conversion introduces bugs
**Mitigation**: Convert one file at a time, test after each conversion, keep git history

**Risk**: models.dev API changes
**Mitigation**: Version our schema, add validation, graceful degradation

## Next Steps

1. ✅ Review this proposal
2. ⏳ Approve or provide feedback
3. ⏳ Execute Phase 1 (scripts reorganization + TS conversion)
4. ⏳ Execute Phase 2 (unified config + model sync)
5. ⏳ Execute Phase 3 (test suite)
6. ⏳ Execute Phase 4 (agent framework design)

## Questions for Discussion

1. Should we keep `convert-to-esm.js` in utils or archive it entirely?
2. Do we want monthly auto-sync for models.dev or manual only?
3. Should validation rules block commits in bootstrap phase or warn only?
4. What's the priority for agent test framework vs. other work?
5. Do we want to make this a separate npm package or keep monorepo?

---

**Prepared by**: AI Agent  
**Date**: 2025-10-19  
**Version**: 1.0  
**Status**: Awaiting Review
