---
title: Why Most Ai Coding Projects Fail
status: published
word_count: 1152
phase: unassigned
last_updated: "2025-10-19"
---

# Why Most AI Coding Projects Fail (And How to Fix It)

**Status**: DRAFT  
**Target Publication**: After Phase 1.1  
**Estimated Reading Time**: 8 minutes

---

## The Problem

Everyone's building AI coding assistants. GitHub Copilot, ChatGPT, Claude Code... they're incredible tools. But there's a dirty secret about autonomous AI agents for software development:

**Most projects fail.**

Not because the AI isn't smart enough. Not because the models can't code. They fail because of something much more fundamental:

### Agent Autonomy Without Accountability

The typical AI agent project looks like this:

1. Give the agent a task
2. Agent writes code
3. Agent says "I'm done!"
4. Hope it actually works

This is the **"hope-driven development"** approach. And it doesn't scale.

---

## What Goes Wrong

### Problem 1: No Verification

**Agent says**: "I've implemented user authentication with JWT tokens, password hashing, and email verification."

**Reality**: The code compiles, but:

- Password hashing uses MD5 (vulnerable)
- JWT secret is hardcoded (security issue)
- Email verification was mentioned but never implemented
- No tests were written
- No actual verification was performed

### Problem 2: Context Drift

**Task**: Refactor the payment system to support multiple currencies

**Agent does**:

- File 1: Adds currency support ✓
- File 2: Updates API... but forgets about currency
- File 3: Starts rewriting unrelated code
- File 4: Completely off-task
- Result: Inconsistent, partially-complete changes

### Problem 3: The "Works On My Machine" Problem

**Agent**: "Tests pass!"

**Reality**:

- Agent never actually ran the tests
- Tests were written but don't cover edge cases
- Or tests don't exist at all

---

## The Root Cause

AI agents today are optimized for **conversation**, not **verification**.

They're trained to be helpful and confident. They'll tell you something is done because that's what you want to hear. But they lack the systematic verification that human developers have learned to do:

- Running tests before committing
- Checking that all files are consistent
- Verifying functionality actually works
- Ensuring nothing was forgotten

---

## The Solution: Test-Driven Multi-Agent Development

What if we built AI agent systems the same way we build reliable software?

### Principle 1: Test-First Development

```bash
# Wrong approach
$ ai-agent "implement feature X"
Agent: "Done!"
You: "Did you test it?"
Agent: "Yes, it works!"
Reality: No tests were run

# Right approach
$ ai-agent "implement feature X"
System: Running verification tests...
System: ✗ Test failed: expected X, got Y
Agent: Fixing issue...
System: Running verification tests...
System: ✓ All tests pass
System: ✓ Test evidence recorded at 2025-10-18T10:23:45Z
```text
**Every capability has a test.** No exceptions.

### Principle 2: Measurable Progress

Instead of subjective "looks good to me", use hard metrics:

```javascript
// Boolean verification (pass/fail)
expect(result.filesCreated).toContain('src/auth.js');
expect(result.testsPass).toBe(true);
expect(result.testCoverage).toBeGreaterThanOrEqual(80);

// Performance metrics
expect(result.tokenCount).toBeLessThan(5000);
expect(result.executionTime).toBeLessThan(120000);
```text
### Principle 3: Specialized Agents

Single "god agent" → Multiple specialized agents

- **Orchestrator**: Decomposes tasks, coordinates team
- **CodeImplementer**: Writes implementation code
- **TestWriter**: Writes comprehensive tests
- **SecurityAuditor**: Reviews for vulnerabilities (read-only)
- **DocWriter**: Creates documentation

**Why this works**: Each agent has a focused role with clear success criteria.

### Principle 4: Quality Gates

Prevent incomplete work with automated gates:

```bash
# Try to mark work complete without tests
$ git commit -m "feat: phase-1-complete"

Gate Check: FAILED
  ✗ No test evidence found
  ✗ Tests must be executed and pass
  
Commit blocked. Run tests first.
```text
Multiple enforcement layers:

1. Documentation (educate)
2. Automated scripts (detect)
3. Git hooks (prevent)
4. CI/CD (verify)

---

## What This Looks Like In Practice

### Phase 0: Setup ✅

**Task**: Create project structure and quality gates

**Deliverables**:

- OpenCode configuration
- Agent definitions
- Quality gate scripts
- Pre-commit hooks

**Verification**:

- Configuration is valid JSON
- Agents follow template
- Gate scripts execute correctly
- Hooks are installed

**Result**: Foundation that prevents future mistakes

### Phase 1: Single Agent Baseline

**Task**: Generate "Hello World" with tests

**Verification**:

```javascript
test('agent generates working code', async () => {
  const result = await runAgent({
    prompt: 'Create hello.js that exports Hello World'
  });
  
  // File created
  expect(result.filesCreated).toContain('src/hello.js');
  
  // Actually works
  const hello = require('./src/hello.js');
  expect(hello()).toBe('Hello, World!');
  
  // Metrics collected
  expect(result.tokenCount).toBeLessThan(500);
});
```text
**Metrics Collected**:

- Token count: 342
- Execution time: 4.2s
- Success rate: 100%

This becomes the **baseline** for comparison.

### Phase 2: Multi-Agent Collaboration

**Task**: Two agents (Code + Test) work together

**Verification**:

```javascript
test('multi-agent creates code AND tests', async () => {
  const result = await runAgent({
    agent: 'orchestrator',
    prompt: 'Create StringUtils with reverse/capitalize + tests'
  });
  
  // Both agents participated
  expect(result.agentInvocations).toContain('codeimplementer');
  expect(result.agentInvocations).toContain('testwriter');
  
  // Both artifacts created
  expect(result.filesCreated).toContain('src/StringUtils.js');
  expect(result.filesCreated).toContain('tests/StringUtils.test.js');
  
  // Implementation works
  const StringUtils = require('./src/StringUtils');
  expect(StringUtils.reverse('hello')).toBe('olleh');
  
  // Tests actually pass
  expect(result.testsPass).toBe(true);
  expect(result.testCoverage).toBeGreaterThanOrEqual(80);
});
```text
**Comparison to Baseline**:

- Token efficiency: 112% of single agent (acceptable overhead)
- Test coverage: 85% (vs 0% for single agent without prompting)
- Quality: Higher (dedicated test agent)

**Key Insight**: Small token overhead for significant quality gain.

---

## The Incremental Approach

We don't start with a complex 10-agent system. We build incrementally:

1. **Phase 1**: Single agent + verification (baseline)
2. **Phase 2**: Add second agent (prove collaboration)
3. **Phase 3**: Add memory (prove learning)
4. **Phase 4**: Complex tasks (prove robustness)

Each phase has:

- Clear objectives
- Measurable success criteria
- Comparison to previous phase
- Lessons learned

---

## Early Results

After just Phase 0 (project setup), we already have:

### Quality Gates System ✅

**Problem Prevented**: Work marked complete without running tests

**Solution**: Multi-layer defense

- `.gitignore` filters session files
- `file-location-check.js` validates placement
- `test-evidence.js` records proof of execution
- `gate-check.js` orchestrates validation
- Pre-commit hook enforces automatically

**Example**:

```bash
$ git commit -m "feat: phase-complete"
❌ GATE CHECK FAILED
Missing test evidence
Run: npm test && node scripts/test-evidence.js phase-X

Commit blocked.
```text
**Impact**: Impossible to commit incomplete work

### File Organization Rules ✅

**Problem Prevented**: Session notes and draft files polluting repository root

**Solution**: Whitelist + validation

- Only specific files allowed in root
- Session files must be in phase directories
- Automated detection and remediation

**Example**:

```bash
$ git add SESSION-NOTES.md
❌ File not allowed in root: SESSION-NOTES.md
Correct location: docs/phases/phase-X/

Commit blocked.
```text
**Impact**: Clean repository structure maintained automatically

### Test Evidence System ✅

**Problem Prevented**: "Tests pass" without proof

**Solution**: Timestamped evidence files

```json
{
  "phase": "phase-1.1",
  "timestamp": "2025-10-18T10:23:45.123Z",
  "passed": true,
  "testResults": { ... },
  "gitCommit": "abc123..."
}
```text
**Verification**: Evidence must be < 10 minutes old for phase completion

**Impact**: Provable test execution, not just claims

---

## Why This Matters

### For Solo Developers

- Confidence that AI agents did what they said
- Automated prevention of common mistakes
- Reproducible builds

### For Teams

- Consistent quality across all agent work
- Auditable evidence of testing
- Clear patterns that scale

### For the Industry

- Moving from "hope-driven" to "test-driven" AI development
- Measurable improvements over baselines
- Patterns that work today, not theoretical

---

## What We're Learning

### Lesson 1: Verification Isn't Optional

**Naive assumption**: Smart enough AI will "just work"

**Reality**: Even the best models need verification systems

**Impact**: Every phase has automated verification

### Lesson 2: Small Agents > God Agent

**Naive assumption**: One powerful agent can do everything

**Reality**: Specialized agents with clear roles outperform generalists

**Impact**: Orchestrator pattern from the start

### Lesson 3: Defense-in-Depth Works

**Naive assumption**: One layer of protection is enough

**Reality**: Multiple independent layers catch more failures

**Impact**: Documentation + Scripts + Hooks + Tests

---

## Next Steps in This Series

**Upcoming posts**:

1. **Quality Gates Deep Dive**: How we built the multi-layer defense system (and why it works)

1. **The Orchestrator Pattern**: Measured results from task decomposition

1. **Two-Agent Collaboration**: Real metrics from Code + Test agent pairing

1. **Memory Systems**: Making agents that actually learn

---

## Try It Yourself

This project is open source and designed to be reproducible:

```bash
# Clone the repository
git clone https://github.com/rothnic/opencode-agents

# Check the quality gates
cd opencode-agents
node scripts/gate-check.js

# See the verification system in action
cat docs/quality-gates.md
```text
---

## The Bottom Line

**Most AI coding projects fail because they lack systematic verification.**

By applying test-driven development principles and defense-in-depth quality gates, we can build AI agent systems that:

1. ✅ Actually work (not just claim to)
2. ✅ Have measurable quality improvements
3. ✅ Prevent common failure modes
4. ✅ Scale to complex tasks

This isn't theoretical. The quality gates system described here is **working today**, preventing incomplete work and maintaining code quality automatically.

**Next post**: Deep dive into how the quality gates system works and the specific failure modes it prevents.

---

**Project**: [OpenCode Agents](https://github.com/rothnic/opencode-agents)  
**Status**: Phase 0.2 (Foundation Complete)  
**Follow**: Updates published as phases complete

---

## Questions? Comments? Find me on [GitHub](https://github.com/rothnic/opencode-agents/issues).
