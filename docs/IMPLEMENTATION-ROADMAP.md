# OpenCode Agents: Implementation Roadmap

**Last Updated**: 2025-01-19  
**Goal**: Get agents working with measurable Evalite benchmarks ASAP  
**Priority**: Prove the system works, then scale

---

## Immediate Next Steps (Week 1)

### 1. Add Evalite Integration ⏱️ 2 hours

```bash
npm install --save-dev evalite
```

**Create**: `evals/hello-world.eval.ts`

```typescript
import { evalite } from 'evalite';

evalite('ContainerTaskExecutor: Hello World', {
  data: async () => [{
    input: "Create hello(name) function",
    expected: { maxTokens: 500, maxTime: 30000 }
  }],
  task: async (input) => {
    // Execute agent, return metrics
  },
  scorers: [/* validation logic */]
});
```

**Run**: `npx evalite evals/`

**Success Criteria**:

- ✅ Eval runs and produces score
- ✅ Pass/fail based on token/time limits
- ✅ Results saved to `.evalite/results.json`

---

### 2. Extract Agent Executor ⏱️ 3 hours

**Create**: `src/agent-executor.ts`

```typescript
export interface AgentResult {
  success: boolean;
  output: string;
  metrics: {
    tokenCount: number;
    executionTime: number;
    stepCount: number;
  };
  errors?: string[];
}

export async function executeAgent(
  agentName: string,
  task: string,
  options?: ExecuteOptions
): Promise<AgentResult> {
  // 1. Load agent from .opencode/agents/${agentName}.md
  // 2. Execute with OpenCode
  // 3. Collect metrics
  // 4. Return standardized result
}
```

**Test**: Existing test uses this executor

**Success Criteria**:

- ✅ `executeAgent('container-task-executor', 'task')` works
- ✅ Returns structured metrics
- ✅ All existing tests pass

---

### 3. Create Benchmark Command ⏱️ 2 hours

**Create**: `scripts/commands/benchmark.ts`

```typescript
import { defineCommand } from '@robingenz/zli';
import { $ } from 'execa';

export const benchmarkCommand = defineCommand({
  description: 'Run agent benchmarks with Evalite',
  options: defineOptions(z.object({
    agent: z.string().optional(),
    watch: z.boolean().default(false),
    report: z.boolean().default(false)
  })),
  action: async (options) => {
    await $`npx evalite evals/ --reporter json`;
    if (options.report) {
      await generateReport();
    }
  }
});
```

**Add to**: `scripts/cli.ts`

**Run**: `npm run benchmark` (or `npx opencode-agents benchmark`)

**Success Criteria**:

- ✅ Command runs evals
- ✅ Shows pass/fail summary
- ✅ Optional detailed report

---

### 4. Prove System Works ⏱️ 1 hour

**Test End-to-End**:

```bash
# 1. Run benchmark
npm run benchmark

# Expected output:
# ✅ ContainerTaskExecutor: Hello World - PASS (450 tokens, 24s, score: 0.95)
# ✅ ContainerTaskExecutor: CRUD function - PASS (1200 tokens, 45s, score: 0.88)

# 2. Verify metrics saved
cat .evalite/results.json

# 3. Check quality gates still work
npm run ci
```

**Success Criteria**:

- ✅ At least 1 eval passes
- ✅ Metrics are accurate
- ✅ Can iterate and improve scores

---

## Phase 2: CLI Framework (Week 2)

### 5. Create Init Command

**File**: `src/cli/commands/init.ts`

```typescript
export const initCommand = defineCommand({
  description: 'Initialize OpenCode agents',
  action: async () => {
    // 1. Create .opencode/ directory
    await fs.mkdir('.opencode/agents', { recursive: true });
    
    // 2. Copy agent templates
    await copyAgents(['container-task-executor', 'test-writer']);
    
    // 3. Generate opencode.json
    await createConfig();
    
    // 4. Create AGENTS.md
    await createAgentsGuide();
    
    console.log('✅ Initialized!');
  }
});
```

**Test**: Run in empty directory

---

### 6. Package for Distribution

**Update**: `package.json`

```json
{
  "name": "opencode-agents",
  "bin": {
    "opencode-agents": "./bin/cli.js"
  },
  "files": [
    "dist/",
    "bin/",
    "global-config/",
    "templates/"
  ]
}
```

**Create**: `bin/cli.js`

```javascript
#!/usr/bin/env node
import { cli } from '../dist/cli.js';
cli.run(process.argv);
```

**Test Local Install**:

```bash
npm link
cd ../test-project
opencode-agents init
```

---

## Phase 3: Documentation Consolidation (Week 2-3)

### 7. Update Core Docs

**Files to Consolidate**:

- `README.md` → Installation + Quick Start
- `AGENTS.md` → Keep as-is (agent guidelines)
- `STATUS.md` → Update with new roadmap
- `docs/GETTING-STARTED.md` → Merge into README
- `docs/INSTALLATION-FRAMEWORK.md` → Primary reference

**Remove/Archive**:

- Redundant session notes in `docs/phases/`
- Old planning docs (keep in `docs/archive/`)

---

### 8. Update Phase Documentation

**Current**: `docs/phases/phase-X.Y/`

**Proposed**: Align with actual implementation stages

```text
docs/phases/
├── phase-1-foundation/
│   ├── README.md             # Evalite integration + first agent
│   ├── benchmarks.md         # Eval design
│   └── results.md            # Actual results
├── phase-2-cli/
│   ├── README.md             # CLI commands + packaging
│   └── testing.md            # Local install testing
└── phase-3-distribution/
    ├── README.md             # npm publish + templates
    └── examples.md           # Real-world usage
```

---

## Phase 4: Advanced Features (Week 4+)

### 9. Multi-Agent Orchestration

**Create**: `evals/multi-agent.eval.ts`

```typescript
evalite('Orchestrator: Feature Implementation', {
  data: async () => [{
    input: "Implement user registration with tests",
    expected: {
      agents: ['orchestrator', 'container-task-executor', 'test-writer'],
      coverage: 0.8,
      maxTokens: 5000
    }
  }],
  task: async (input) => {
    // Orchestrator delegates to subagents
  }
});
```

---

### 10. Container-Use Integration (Optional)

**Evaluate**: Is isolation needed?

**Decision Criteria**:

- If agents frequently break project state → Yes
- If evals are deterministic and fast → No
- If working on large codebases → Maybe

**If Yes**:

```typescript
import { containerUse } from 'container-use';

export async function executeAgentIsolated(agent, task) {
  return await containerUse({
    image: 'node:20',
    command: `opencode-agents agent run ${agent} "${task}"`,
    files: ['src/**', 'tests/**']
  });
}
```

---

## Success Metrics

### Phase 1 Complete When

- [x] Evalite dependency added
- [ ] At least 2 evals passing
- [ ] Benchmark command works
- [ ] Metrics are measurable and improving

### Phase 2 Complete When

- [ ] `opencode-agents init` works in empty directory
- [ ] Can install locally with `npm link`
- [ ] CLI has 4+ commands (init, benchmark, validate, agent)
- [ ] Documentation is clear

### Phase 3 Complete When

- [ ] Published to npm (alpha)
- [ ] Tested on 3 different project types
- [ ] Template repositories available
- [ ] CI/CD examples working

### Phase 4 Complete When

- [ ] Multi-agent evals passing
- [ ] Orchestration measurably better than single-agent
- [ ] Optional container isolation tested
- [ ] Performance optimized (faster than baseline)

---

## Development Workflow

### Daily Workflow

```bash
# 1. Check status
cat STATUS.md

# 2. Work on current task
# (implement feature)

# 3. Run benchmarks
npm run benchmark

# 4. Validate quality
npm run ci

# 5. Update STATUS.md
# 6. Commit with conventional format
git commit -m "feat(evals): add hello-world benchmark"
```

### When Adding New Eval

```bash
# 1. Create eval file
touch evals/new-feature.eval.ts

# 2. Implement eval
# (use existing as template)

# 3. Run eval
npx evalite evals/new-feature.eval.ts

# 4. Iterate until passing
# 5. Add to suite
```

### When Adding New Agent

```bash
# 1. Create agent definition
touch .opencode/agents/new-specialist.md

# 2. Create eval for agent
touch evals/new-specialist.eval.ts

# 3. Test agent
npm run benchmark -- --agent new-specialist

# 4. Document in AGENTS.md
```

---

## Risk Mitigation

### Risk: Evals too slow

**Solution**: Start with fast, simple evals. Add complexity gradually.

### Risk: Agent inconsistency

**Solution**: Use Evalite to catch regressions. Pin model versions.

### Risk: Complex installation

**Solution**: Test init flow on fresh projects frequently.

### Risk: Feature creep

**Solution**: Complete Phase 1 before starting Phase 2. Prove it works.

---

## Quick Reference

### Run Everything

```bash
npm run ci                    # Full validation
npm run benchmark             # All evals
npm run benchmark -- --watch  # Watch mode
npm run type-check            # TypeScript
npm run lint:fix              # Auto-fix
```

### File Locations

- Agents: `.opencode/agents/`
- Evals: `evals/`
- CLI: `src/cli/`
- Executor: `src/agent-executor.ts`
- Config: `opencode.json`

### Key Commands

```bash
opencode-agents init          # Setup project
opencode-agents benchmark     # Run evals
opencode-agents validate      # Quality gates
opencode-agents agent list    # Show agents
```

---

## Next Immediate Action

**Start Here** (30 minutes):

1. `npm install --save-dev evalite`
2. Create `evals/hello-world.eval.ts`
3. Run `npx evalite evals/`
4. See first benchmark result

**Then** (2 hours):

1. Extract `src/agent-executor.ts`
2. Update existing test to use executor
3. Verify all tests still pass

**Finally** (1 hour):

1. Add benchmark command to CLI
2. Run `npm run benchmark`
3. Update STATUS.md with results
4. Commit progress

---

## Questions to Answer

- [ ] What's minimum passing score for each eval?
- [ ] How do we version control eval results?
- [ ] Should evals run in CI?
- [ ] What metrics matter most? (tokens vs quality vs speed)
- [ ] When do we publish to npm?

**Document answers in**: `docs/DECISION-LOG.md`
