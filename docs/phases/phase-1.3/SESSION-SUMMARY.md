# Session Summary: OpenCode Agent Testing Strategy

**Date**: 2025-01-19  
**Focus**: Clarified testing strategy for REAL OpenCode agents with Evalite

---

## 🎯 Key Clarification Made

### Before

- Approach was unclear whether we're testing mock agents or real ones
- Agent executor had placeholder/mock implementation
- Evalite integration not properly aligned with OpenCode

### After

✅ **CLEAR DIRECTION**: We test **ACTUAL OpenCode agents** that make real LLM calls

- Agents defined in `.opencode/agents/*.md`
- Execute via OpenCode CLI/API (not simulations)
- Collect real metrics (tokens, time, steps)
- Use Evalite's `reportTrace` for LLM call tracking

---

## 📚 Documentation Created

### New Strategy Documents

1. **[docs/OPENCODE-AGENT-TESTING.md](../docs/OPENCODE-AGENT-TESTING.md)** (456 lines)
   - How OpenCode agents work
   - Real vs mock implementation
   - Evalite integration with `reportTrace`
   - Updated agent executor design
   - Testing workflow

### Files Created Today

2. **evals/hello-world.eval.ts** - First benchmark (needs refinement)
3. **src/agent-executor.ts** - Interface (needs real OpenCode integration)

### Updated Documentation

4. **STATUS.md** - Reflects new focus on real agent testing
5. Package updated - Evalite v0.16.1 installed

---

## 🔍 Critical Questions to Answer

### OpenCode Integration (Priority 1)

Before we can complete the agent executor, we need to know:

1. **How to programmatically run OpenCode agents?**
   - CLI command format?
   - Programmatic API?
   - Configuration needed?

2. **What output format does OpenCode provide?**
   - JSON support?
   - How to extract generated code?
   - Error handling?

3. **How to get metrics from OpenCode?**
   - Token usage tracking?
   - Execution time?
   - Step/iteration count?

4. **Does OpenCode support tracing?**
   - Can we get LLM call details?
   - Format for Evalite's `reportTrace`?

### Research Needed

```bash
# Test if OpenCode CLI exists
which opencode
opencode --help

# Try running the existing agent
ls -la .opencode/agents/
cat .opencode/agent/container-task-executor.md

# Attempt manual execution
opencode run container-task-executor "Create hello function"
# or
opencode --agent container-task-executor --task "Create hello function"
```

---

## 📋 Next Immediate Steps

### Step 1: Research OpenCode ⏱️ 1-2 hours

- [ ] Check OpenCode documentation for programmatic usage
- [ ] Test existing `container-task-executor` agent manually
- [ ] Determine output format and metrics availability
- [ ] Document findings

### Step 2: Update Agent Executor ⏱️ 2-3 hours

Once we know how OpenCode works:

- [ ] Replace mock implementation with real OpenCode calls
- [ ] Add proper error handling
- [ ] Integrate `reportTrace` for Evalite
- [ ] Test with hello-world eval

### Step 3: Refine Eval ⏱️ 1 hour

- [ ] Update scorers to use proper Evalite format (inline objects)
- [ ] Add metadata to scores
- [ ] Test scorer logic independently
- [ ] Run full eval: `npx evalite evals/`

### Step 4: Validate & Document ⏱️ 1 hour

- [ ] Verify metrics are accurate
- [ ] Test consistency across runs
- [ ] Document baseline performance
- [ ] Update STATUS.md with results

---

## 🏗️ Current Architecture

```
opencode-agents/
├── .opencode/
│   └── agents/
│       └── container-task-executor.md    # Real OpenCode agent definition
├── evals/
│   └── hello-world.eval.ts        # Evalite benchmark
├── src/
│   └── agent-executor.ts          # Needs real OpenCode integration
└── docs/
    └── OPENCODE-AGENT-TESTING.md  # Strategy & approach
```

### Flow

```
Evalite Benchmark
    ↓
executeAgent(agentName, task)
    ↓
OpenCode CLI/API (REAL execution)
    ↓
Collect metrics + reportTrace
    ↓
Return AgentResult
    ↓
Evalite Scorers
    ↓
Results & Metrics
```

---

## ✅ What's Working

- Evalite installed and ready
- Eval structure created
- Agent executor interface defined
- Clear testing strategy documented
- Proper Evalite scorer format understood

## ⏳ What's Blocked

**Waiting on**: OpenCode integration research

Until we know how to execute OpenCode agents programmatically, we cannot:

- Complete the agent executor
- Run real benchmarks
- Collect accurate metrics
- Validate the system works

---

## 📖 Key Learnings from Evalite Docs

### Scorer Format (Corrected Understanding)

```typescript
// Inline scorers use objects, not functions
scorers: [
  {
    name: 'Token Efficiency',
    description: 'Checks token usage',
    scorer: ({ input, output, expected }) => {
      return {
        score: 0.95,  // 0-1
        metadata: {   // Optional debugging info
          tokensUsed: 250,
          limit: 500
        }
      };
    }
  }
]
```

### Trace Reporting

```typescript
import { reportTrace } from 'evalite/traces';

// Inside task execution
reportTrace({
  start: performance.now(),
  end: performance.now(),
  input: [{ role: 'user', content: task }],
  output: result.output,
  usage: {
    inputTokens: result.usage.input,
    outputTokens: result.usage.output,
    totalTokens: result.usage.total
  }
});
```

---

## 🎯 Success Criteria

### Week 1 Complete When

- [ ] OpenCode programmatic execution working
- [ ] Agent executor uses real OpenCode (no mocks)
- [ ] At least 1 eval passes with real agent
- [ ] Metrics (tokens, time) verified accurate
- [ ] Trace reporting integrated

### What Success Looks Like

```bash
$ npx evalite evals/

Running: ContainerTaskExecutor: Hello World Function
  ✓ Token Efficiency: 0.92 (250/500 tokens)
  ✓ Time Efficiency: 0.88 (24s/30s)
  ✓ Functional Correctness: 1.00

Overall Score: 0.93 (Pass)
```

---

## 📝 Developer Notes

### Evalite Integration Patterns

1. **Keep scorers simple** - One concern per scorer
2. **Add metadata** - Makes debugging easier
3. **Use reportTrace** - Track LLM calls
4. **Type scorers** - Use TypeScript generics

### OpenCode Agent Best Practices

1. **Clear task descriptions** - Agents work better with specificity
2. **Verify agent exists** - Check `.opencode/agents/` before execution
3. **Handle timeouts** - Agents can stall
4. **Collect traces** - Every LLM call should be tracked

---

## 🚀 When to Proceed

**DO NOT proceed with** building more evals, CLI commands, or framework features **UNTIL**:

✅ We have working OpenCode integration  
✅ We can run ONE real agent successfully  
✅ We can collect accurate metrics  
✅ We've proven the testing approach works

**THEN** we can scale to:

- More agents (test-writer, doc-writer)
- More evals (CRUD, refactoring, multi-file)
- CLI commands (benchmark, init)
- Framework packaging

---

## 📚 References

- [Evalite Scorers](https://evalite.dev/docs/scorers)
- [Evalite Traces](https://evalite.dev/docs/traces)
- [OpenCode Agents Testing Strategy](../docs/OPENCODE-AGENT-TESTING.md)
- [Implementation Roadmap](../docs/IMPLEMENTATION-ROADMAP.md)
- [STATUS.md](../STATUS.md)

---

## Next Session Handoff

### Start Here

1. **Research OpenCode**: How to run agents programmatically
2. **Test manually**: Run `container-task-executor` agent via OpenCode
3. **Document findings**: Create `docs/OPENCODE-INTEGRATION.md`
4. **Update executor**: Replace mock with real implementation
5. **Run eval**: `npx evalite evals/hello-world.eval.ts`

### Files to Update

- `src/agent-executor.ts` - Real OpenCode integration
- `evals/hello-world.eval.ts` - Refine scorers
- `docs/OPENCODE-INTEGRATION.md` - NEW: Document OpenCode usage
- `STATUS.md` - Update progress

The path forward is clear: **prove we can test one real agent**, then scale.
