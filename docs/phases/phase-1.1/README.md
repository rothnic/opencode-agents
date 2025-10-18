# Phase 1.1: Hello World Baseline Test

**Status**: Not Started  
**Complexity**: ⭐ (Trivial - Establishes Baseline)  
**Working Directory**: `docs/phases/phase-1.1/`

## Objective

Create the first test case for simple code generation and establish baseline metrics.

## Deliverables

1. `tests/phase-1/test-1.1-hello-world.js` - Test implementation
2. `src/hello.js` - Generated code (by agent)
3. Baseline metrics captured
4. Test passes with < 500 tokens

## Expected Metrics

- Token Count: < 500 tokens
- Step Count: 1-2 steps
- Success Rate: 100%
- Execution Time: < 30 seconds

## Working Files

- `notes.md` - Test design decisions
- `progress.md` - Execution log
- `metrics.json` - Captured baseline metrics
- `output.log` - Agent output

## References

- Main Plan: `../../project-plan.md` (Phase 1.1 section)
- Test Template: `../../templates/test-case-template.md`

## Task

Generate a simple Node.js function that passes this test:

```javascript
const hello = require('../src/hello.js');
expect(hello.hello('World')).toBe('Hello, World!');
```
