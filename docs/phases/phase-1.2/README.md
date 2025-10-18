# Phase 1.2: Orchestrator Pattern Test

**Status**: Not Started  
**Complexity**: ⭐⭐ (Simple - Tests Delegation)  
**Working Directory**: `docs/phases/phase-1.2/`

## Objective

Implement and test the orchestrator pattern with task decomposition.

## Deliverables

1. `.opencode/agent/orchestrator.md` - Orchestrator agent config
2. `tests/phase-1/test-1.2-orchestrator.js` - Test implementation
3. `src/calculator.js` - Generated code
4. `tests/calculator.test.js` - Generated tests
5. Metrics comparing to Phase 1.1 baseline

## Expected Metrics

- Token Count: < 2000 tokens
- Step Count: 3-5 steps (plan → implement → test)
- Task Decomposition: ≥ 2 subtasks identified
- Success Rate: 100%

## Working Files

- `notes.md` - Orchestrator design
- `progress.md` - Implementation log
- `metrics-comparison.json` - vs baseline
- `task-decomposition.log` - Agent planning output

## References

- Main Plan: `../../project-plan.md` (Phase 1.2 section)
- Agent Template: `../../templates/agent-template.md`

## Task

Orchestrator should decompose "Create calculator with add/subtract + tests" into:
1. Implement calculator functions
2. Write tests for calculator
3. Verify tests pass
