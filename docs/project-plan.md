# OpenCode Agents: Test-Driven Multi-Agent Development Project Plan

## Executive Summary

This project explores building a **reactive, predictable, and measurable** multi-agent coding system using opencode. The approach emphasizes:

- **Test-First Development**: Every capability increment includes verification tests
- **Measurable Progress**: Track token usage, step counts, and success rates
- **Incremental Complexity**: Start simple, add complexity gradually
- **Real Validation**: Boolean checks and performance metrics, not subjective assessment
- **Controlled Best Practices**: Configurable guardrails with escape hatches
- **Adaptive Quality**: Rules that evolve with project maturity

## Project Philosophy

This system aims to be **assistants in implementing controlled best practices** with incremental, well-structured workflows that balance:

### Core Principles

1. **Efficiency vs. Quality**: Move fast with automated safety nets
   - Automated validation catches common mistakes
   - Self-healing repository detects issues early
   - Git hooks prevent bad commits

1. **Strictness vs. Flexibility**: Adapt rules based on project maturity
   - **Bootstrap** (0-100 commits): Lenient, focus on velocity
   - **Development** (100-500 commits): Balanced guardrails
   - **Production** (500+ commits): Strict enforcement

1. **Automation vs. Control**: Self-healing, but humans can override
   - Configuration-driven validation (`.opencode/validation-rules.json`)
   - Inline directives for exceptions (`// biome-ignore lint/rule: reason`)
   - Escape hatches with accountability (GitHub issues, expiration dates)

1. **Standards vs. Innovation**: Best practices with room for experimentation
   - Modern tooling (Vitest, Biome, TypeScript)
   - Configurable rules that can be updated without code changes
   - Templates and conventions that guide without constraining

### Vision: Installable Agent Package

**Goal**: Package `opencode-agents` so it can be installed in any new project:

```bash
npm install opencode-agents
npx opencode-agents init
# Interactive setup with agent assistance
# Configure validation rules, pick tools, set standards
```text
**What you get**:

1. Automated best practices enforcement
2. Agent team to help implement features
3. Quality gates that adapt to project maturity
4. Incremental, well-structured workflows
5. Configurable rules with escape hatches
6. Self-healing validation system

## Project Architecture Overview

```mermaid
flowchart TB
    subgraph "Development Flow"
        Test[Test Case] --> Agent[Agent Team]
        Agent --> Verify[Verification]
        Verify -->|Pass| Commit[Git Commit]
        Verify -->|Fail| Debug[Debug & Iterate]
        Debug --> Agent
        Commit --> Metrics[Collect Metrics]
    end
    
    subgraph "Agent Team"
        Orch[Orchestrator] --> Code[CodeImplementer]
        Orch --> TestW[TestWriter]
        Orch --> Doc[DocuWriter]
        Orch --> Sec[SecurityAuditor]
        Orch --> Ref[RefactorEngine]
    end
    
    subgraph "Measurement System"
        Metrics --> Tokens[Token Count]
        Metrics --> Steps[Step Count]
        Metrics --> Success[Success Rate]
        Metrics --> Time[Execution Time]
    end
```text
## Project Phases & Timeline

```mermaid
gantt
    title OpenCode Agents Development Timeline
    dateFormat YYYY-MM-DD
    section Phase 0: Setup
    Git & Basic Config           :p0-1, 2025-10-18, 1d
    AGENTS.md Template           :p0-2, after p0-1, 1d
    
    section Phase 1: Foundation
    Single Agent Test            :p1-1, after p0-2, 2d
    Basic Orchestrator           :p1-2, after p1-1, 2d
    Measurement System           :p1-3, after p1-2, 2d
    
    section Phase 2: Multi-Agent
    Two-Agent Collaboration      :p2-1, after p1-3, 3d
    Permission System            :p2-2, after p2-1, 2d
    Full Team Setup              :p2-3, after p2-2, 3d
    
    section Phase 3: Memory
    Memory Tool Implementation   :p3-1, after p2-3, 3d
    Learning Loop                :p3-2, after p3-1, 3d
    
    section Phase 4: Optimization
    Performance Tuning           :p4-1, after p3-2, 4d
    Complex Task Testing         :p4-2, after p4-1, 4d
```text
---

## Phase 0: Project Setup & Infrastructure

**Goal**: Establish the foundation for test-driven agent development.

### Phase 0.1: ✅ Repository & Basic Configuration

**Status**: COMPLETE

- [x] Initialize GitHub repository
- [x] Initial documentation structure
- [x] First commit

**Verification**: Repository exists and is accessible

---

### Phase 0.2: Core Project Files

**Tasks**:

1. Create `opencode.json` with basic configuration
2. Create `.opencode/` directory structure
3. Set up `AGENTS.md` with initial project conventions
4. Create test harness structure

**Test Cases**:

- [ ] `tests/verify-config.test.js` - Validates opencode.json schema
- [ ] `tests/verify-structure.test.js` - Confirms directory structure exists

**Success Criteria**:

```javascript
// Boolean verification
✓ opencode.json exists and is valid JSON
✓ .opencode/ directory exists
✓ AGENTS.md follows template structure
✓ Test framework is executable
```text
**Deliverables**:

- `/opencode.json` - Main configuration
- `/.opencode/` - Agent and tool directory
- `/AGENTS.md` - Project conventions
- `/tests/` - Test framework
- `/scripts/measure.js` - Metrics collection script

**Git Milestone**: `feat: phase-0.2-project-structure`

---

## Phase 1: Single Agent Capabilities

**Goal**: Establish baseline functionality with measurable verification.

### Phase 1.1: Single Agent Test - "Hello World" Code Generation

**Complexity Level**: ⭐ (Trivial - establishes baseline)

**Test Case**: Generate a simple Node.js function

```javascript
// tests/phase-1/test-1.1-hello-world.js
describe('Phase 1.1: Simple Code Generation', () => {
  it('should generate a valid hello function', async () => {
    const result = await runAgentTask({
      prompt: 'Create a function called hello(name) that returns "Hello, {name}!"',
      expectedFile: 'src/hello.js'
    });
    
    // Boolean verifications
    expect(result.fileExists).toBe(true);
    expect(result.syntaxValid).toBe(true);
    expect(result.exports.hello).toBeDefined();
    expect(result.exports.hello('World')).toBe('Hello, World!');
    
    // Metrics
    expect(result.metrics).toMatchObject({
      tokenCount: expect.any(Number),
      stepCount: expect.any(Number),
      executionTime: expect.any(Number)
    });
  });
});
```text
**Success Metrics Baseline**:

- Token Count: < 500 tokens
- Step Count: 1-2 steps
- Success Rate: 100%
- Execution Time: < 30 seconds

**Deliverables**:

- Simple agent configuration
- Working test
- Baseline metrics

**Git Milestone**: `test: phase-1.1-baseline-single-agent`

---

### Phase 1.2: Orchestrator Pattern Test - Task Decomposition

**Complexity Level**: ⭐⭐ (Simple - tests delegation)

**Test Case**: Orchestrator decomposes a task into sub-tasks

```javascript
// tests/phase-1/test-1.2-orchestrator.js
describe('Phase 1.2: Basic Orchestration', () => {
  it('should decompose and track subtasks', async () => {
    const result = await runAgentTask({
      agent: 'orchestrator',
      prompt: 'Create a calculator with add and subtract functions, write tests',
      expectedFiles: ['src/calculator.js', 'tests/calculator.test.js']
    });
    
    // Verify decomposition
    expect(result.plan).toBeDefined();
    expect(result.plan.tasks.length).toBeGreaterThanOrEqual(2);
    
    // Verify execution
    expect(result.filesCreated).toEqual(
      expect.arrayContaining(['src/calculator.js', 'tests/calculator.test.js'])
    );
    
    // Verify functionality
    const calc = require('../src/calculator');
    expect(calc.add(2, 3)).toBe(5);
    expect(calc.subtract(5, 3)).toBe(2);
    
    // Verify tests run
    expect(result.testsPass).toBe(true);
  });
});
```text
**Success Metrics**:

- Token Count: < 2000 tokens (comparing to single-agent baseline)
- Step Count: 3-5 steps (plan → implement → test)
- Task Decomposition: Correctly identifies >= 2 subtasks
- Success Rate: 100%

**Agent Configuration**:

```json
// .opencode/agent/orchestrator.md
{
  "mode": "primary",
  "description": "Decomposes tasks and coordinates specialists",
  "temperature": 0.2,
  "tools": {
    "read": "allow",
    "grep": "allow",
    "todowrite": "allow",
    "todoread": "allow"
  },
  "permission": {
    "edit": "deny",
    "write": "deny",
    "bash": "ask"
  }
}
```text
**Deliverables**:

- Orchestrator agent configuration
- Task decomposition test
- Comparison metrics vs baseline

**Git Milestone**: `feat: phase-1.2-orchestrator-pattern`

---

### Phase 1.3: Measurement & Metrics System

**Test Case**: Automated metrics collection

```javascript
// tests/phase-1/test-1.3-metrics.js
describe('Phase 1.3: Metrics System', () => {
  it('should collect comprehensive metrics', async () => {
    const session = await runMeasuredTask({
      prompt: 'Create a simple fibonacci function'
    });
    
    expect(session.metrics).toMatchObject({
      tokenCount: expect.any(Number),
      stepCount: expect.any(Number),
      executionTime: expect.any(Number),
      agentInvocations: expect.any(Number),
      filesModified: expect.any(Array),
      testsPassed: expect.any(Boolean)
    });
    
    // Store baseline
    await saveBaseline('fibonacci', session.metrics);
  });
  
  it('should compare against baseline', async () => {
    const baseline = await loadBaseline('fibonacci');
    const current = await runMeasuredTask({
      prompt: 'Create a simple fibonacci function'
    });
    
    // Should be within 20% of baseline
    expect(current.metrics.tokenCount).toBeLessThan(baseline.tokenCount * 1.2);
  });
});
```text
**Deliverables**:

- `scripts/measure.js` - Metrics collection script
- `tests/helpers/metrics.js` - Metrics test utilities
- `.metrics/` - Stored baseline metrics (gitignored)
- `docs/metrics/` - Metrics documentation and reports

**Git Milestone**: `feat: phase-1.3-metrics-system`

---

## Phase 2: Multi-Agent Collaboration

**Goal**: Demonstrate that specialized agents improve quality and reduce drift.

### Phase 2.1: Two-Agent Collaboration - Code + Test

**Complexity Level**: ⭐⭐⭐ (Moderate - tests agent interaction)

**Test Case**: CodeImplementer and TestWriter work together

```javascript
// tests/phase-2/test-2.1-code-test-collaboration.js
describe('Phase 2.1: Code + Test Collaboration', () => {
  it('should implement code with tests', async () => {
    const result = await runAgentTask({
      agent: 'orchestrator',
      prompt: 'Create a StringUtils class with reverse() and capitalize() methods. Include comprehensive tests.',
      expectedAgents: ['codeimplementer', 'testwriter']
    });
    
    // Verify delegation happened
    expect(result.agentInvocations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ agent: 'codeimplementer' }),
        expect.objectContaining({ agent: 'testwriter' })
      ])
    );
    
    // Verify outputs
    expect(result.filesCreated).toContain('src/StringUtils.js');
    expect(result.filesCreated).toContain('tests/StringUtils.test.js');
    
    // Verify functionality
    const StringUtils = require('../src/StringUtils');
    expect(StringUtils.reverse('hello')).toBe('olleh');
    expect(StringUtils.capitalize('hello')).toBe('Hello');
    
    // Verify tests exist and pass
    expect(result.testCoverage).toBeGreaterThanOrEqual(80);
    expect(result.testsPass).toBe(true);
  });
  
  it('should use fewer tokens than single agent', async () => {
    const singleAgent = await runAgentTask({
      agent: 'build', // default all-in-one
      prompt: 'Create StringUtils with reverse/capitalize and tests'
    });
    
    const multiAgent = await runAgentTask({
      agent: 'orchestrator',
      prompt: 'Create StringUtils with reverse/capitalize and tests'
    });
    
    // Multi-agent should be more efficient or at least comparable
    const efficiency = multiAgent.metrics.tokenCount / singleAgent.metrics.tokenCount;
    expect(efficiency).toBeLessThan(1.3); // Allow 30% overhead max
  });
});
```text
**Success Metrics**:

- Token Efficiency: <= 130% of single-agent baseline
- Test Coverage: >= 80%
- Agent Delegation: Correctly identifies and invokes 2 agents
- Success Rate: >= 95%

**Agent Configurations**:

```markdown
<!-- .opencode/agent/codeimplementer.md -->
---
description: "Writes and modifies application code based on specifications"
mode: subagent
model: "anthropic/claude-3-5-sonnet-20241022"
temperature: 0.1
permission:
  edit: allow
  write: allow
  bash: deny
---

You are a code implementation specialist. Your role is to:
1. Follow the AGENTS.md coding standards precisely
2. Write clean, idiomatic code
3. Add inline documentation
4. Do NOT write tests (that's TestWriter's job)

Always check AGENTS.md before implementing code.
```text
```markdown
<!-- .opencode/agent/testwriter.md -->
---
description: "Generates and executes unit and integration tests"
mode: subagent
model: "anthropic/claude-3-haiku-20240307"
temperature: 0.1
permission:
  write: allow
  bash: "npm test*": allow, "*": deny
---

You are a test implementation specialist. Your role is to:
1. Write comprehensive tests following AGENTS.md conventions
2. Aim for >= 80% code coverage
3. Execute tests after writing them
4. Do NOT modify implementation code

Test files should be placed according to AGENTS.md structure.
```text
**Deliverables**:

- CodeImplementer agent config
- TestWriter agent config
- Updated Orchestrator to delegate
- Multi-agent collaboration test
- Comparison metrics

**Git Milestone**: `feat: phase-2.1-two-agent-collaboration`

---

### Phase 2.2: Permission System Validation

**Complexity Level**: ⭐⭐ (Simple - tests security)

**Test Case**: Verify agents respect permission boundaries

```javascript
// tests/phase-2/test-2.2-permissions.js
describe('Phase 2.2: Permission Boundaries', () => {
  it('should prevent SecurityAuditor from modifying files', async () => {
    const result = await runAgentTask({
      agent: 'securityauditor',
      prompt: 'Review src/auth.js and fix any vulnerabilities',
      expectedBehavior: 'report-only'
    });
    
    // Should NOT modify files
    expect(result.filesModified).toEqual([]);
    
    // Should produce a report
    expect(result.report).toBeDefined();
    expect(result.report.vulnerabilities).toEqual(expect.any(Array));
  });
  
  it('should allow TestWriter to run specific commands', async () => {
    const result = await runAgentTask({
      agent: 'testwriter',
      prompt: 'Run the test suite'
    });
    
    // Should execute npm test
    expect(result.commandsExecuted).toContain(
      expect.stringMatching(/npm test/)
    );
    
    // Should NOT execute other commands
    expect(result.commandsExecuted).not.toContain(
      expect.stringMatching(/rm -rf|git push/)
    );
  });
});
```text
**Agent Configuration**:

```markdown
<!-- .opencode/agent/securityauditor.md -->
---
description: "Scans code for security vulnerabilities without modifying it"
mode: subagent
temperature: 0.1
permission:
  read: allow
  grep: allow
  glob: allow
  edit: deny
  write: deny
  bash: deny
  webfetch: allow
---

You are a security auditor. Your role is to:
1. Identify security vulnerabilities (XSS, SQL injection, etc.)
2. Reference CWE numbers
3. Provide detailed reports with remediation guidance
4. NEVER modify code - only report findings
```text
**Success Criteria**:

- All permission tests pass
- No unauthorized file modifications
- No unauthorized command executions

**Git Milestone**: `test: phase-2.2-permission-validation`

---

### Phase 2.3: Full Agent Team Integration

**Complexity Level**: ⭐⭐⭐⭐ (Complex - tests full orchestration)

**Test Case**: Complex multi-step workflow

```javascript
// tests/phase-2/test-2.3-full-team.js
describe('Phase 2.3: Full Team Integration', () => {
  it('should complete a complex feature with all agents', async () => {
    const result = await runAgentTask({
      agent: 'orchestrator',
      prompt: `Create a UserService module with:
        - CRUD operations (create, read, update, delete)
        - Input validation
        - Error handling
        - Comprehensive tests
        - Documentation`,
      timeout: 300000 // 5 minutes
    });
    
    // Verify all relevant agents were invoked
    const invoked = result.agentInvocations.map(i => i.agent);
    expect(invoked).toEqual(
      expect.arrayContaining([
        'codeimplementer',
        'testwriter',
        'docuwriter'
      ])
    );
    
    // Verify all deliverables
    expect(result.filesCreated).toEqual(
      expect.arrayContaining([
        'src/UserService.js',
        'tests/UserService.test.js',
        'docs/UserService.md'
      ])
    );
    
    // Verify functionality
    const UserService = require('../src/UserService');
    const user = UserService.create({ name: 'Test', email: 'test@example.com' });
    expect(user).toHaveProperty('id');
    expect(UserService.read(user.id)).toEqual(user);
    
    // Verify tests pass
    expect(result.testsPass).toBe(true);
    expect(result.testCoverage).toBeGreaterThanOrEqual(80);
  });
  
  it('should show improved metrics vs single agent', async () => {
    const comparison = await compareAgentPerformance({
      task: 'Create UserService with CRUD, tests, and docs',
      agents: ['build', 'orchestrator']
    });
    
    // Multi-agent should show improvements in:
    // - Code quality (fewer issues)
    // - Test coverage (more comprehensive)
    // - Documentation quality (more detailed)
    
    expect(comparison.orchestrator.codeQualityScore).toBeGreaterThan(
      comparison.build.codeQualityScore
    );
  });
});
```text
**Success Metrics**:

- Token Count: < 5000 tokens
- Step Count: 5-8 steps
- Agent Invocations: 3-5 agents
- Test Coverage: >= 80%
- Code Quality: No critical linting errors
- Success Rate: >= 90%

**Deliverables**:

- Complete agent team (5+ agents)
- Complex integration test
- Performance comparison report
- Updated AGENTS.md with patterns

**Git Milestone**: `feat: phase-2.3-full-team-integration`

---

## Phase 3: Adaptive Memory System

**Goal**: Implement learning from past executions to improve future performance.

### Phase 3.1: Memory Tool Implementation

**Complexity Level**: ⭐⭐⭐⭐ (Complex - custom tool development)

**Test Case**: Store and retrieve semantic memories

```javascript
// tests/phase-3/test-3.1-memory-tool.js
describe('Phase 3.1: Memory System', () => {
  it('should store and retrieve memories', async () => {
    const memory = await memoryTool.store({
      content: 'The calculate_tax function in src/billing.js is computationally expensive',
      namespace: 'performance',
      tags: ['optimization', 'billing']
    });
    
    expect(memory.id).toBeDefined();
    
    const results = await memoryTool.query({
      query: 'expensive billing functions',
      namespace: 'performance',
      limit: 5
    });
    
    expect(results).toContainEqual(
      expect.objectContaining({
        content: expect.stringMatching(/calculate_tax/),
        relevanceScore: expect.any(Number)
      })
    );
  });
  
  it('should be accessible to agents', async () => {
    // Store a memory
    await memoryTool.store({
      content: 'API rate limiting: use exponential backoff with 2^n * 100ms delay',
      namespace: 'patterns'
    });
    
    // Agent should retrieve it
    const result = await runAgentTask({
      agent: 'codeimplementer',
      prompt: 'Implement API call with rate limiting'
    });
    
    // Check if agent used the stored pattern
    const code = await fs.readFile(result.filesCreated[0], 'utf-8');
    expect(code).toMatch(/exponential.*backoff/i);
  });
});
```text
**Custom Tool Structure**:

```javascript
// .opencode/tool/memory.ts
import { defineTool } from '@opencode-ai/plugin';
import { z } from 'zod';
import { ChromaClient } from 'chromadb';

const client = new ChromaClient();
const collection = await client.getOrCreateCollection({ name: 'agent_memory' });

export const memory_store = defineTool({
  name: 'memory_store',
  description: 'Store a memory for future retrieval',
  parameters: z.object({
    content: z.string().describe('The memory content to store'),
    namespace: z.string().optional().describe('Category/namespace for the memory'),
    tags: z.array(z.string()).optional().describe('Tags for filtering')
  }),
  execute: async ({ content, namespace, tags }) => {
    const id = await collection.add({
      documents: [content],
      metadatas: [{ namespace, tags: tags?.join(','), timestamp: Date.now() }]
    });
    return { success: true, id };
  }
});

export const memory_query = defineTool({
  name: 'memory_query',
  description: 'Query stored memories semantically',
  parameters: z.object({
    query: z.string().describe('The semantic query'),
    namespace: z.string().optional(),
    limit: z.number().default(5)
  }),
  execute: async ({ query, namespace, limit }) => {
    const results = await collection.query({
      queryTexts: [query],
      nResults: limit,
      where: namespace ? { namespace } : undefined
    });
    return results;
  }
});
```text
**Deliverables**:

- Memory custom tool implementation
- ChromaDB or SQLite integration
- Memory tool tests
- Tool documentation

**Git Milestone**: `feat: phase-3.1-memory-tool`

---

### Phase 3.2: Learning Loop Implementation

**Complexity Level**: ⭐⭐⭐⭐⭐ (Very Complex - tests learning)

**Test Case**: Demonstrate measurable learning improvement

```javascript
// tests/phase-3/test-3.2-learning-loop.js
describe('Phase 3.2: Learning Loop', () => {
  it('should learn from completed tasks', async () => {
    // Execute a task
    const result1 = await runAgentTask({
      agent: 'orchestrator',
      prompt: 'Optimize the data processing pipeline in src/processor.js'
    });
    
    // Memory should be created
    const memories = await memoryTool.query({
      query: 'processor optimization',
      limit: 10
    });
    
    expect(memories.length).toBeGreaterThan(0);
    expect(memories[0].content).toContain('processor');
  });
  
  it('should improve performance on similar tasks', async () => {
    // First execution - no memory
    await memoryTool.clear();
    const run1 = await runMeasuredTask({
      prompt: 'Create a data validator for email addresses'
    });
    
    // Store learnings
    await runAgentTask({
      agent: 'memoryformation',
      prompt: `Analyze the session and store learnings`,
      context: run1.sessionLog
    });
    
    // Second execution - with memory
    const run2 = await runMeasuredTask({
      prompt: 'Create a data validator for phone numbers'
    });
    
    // Should be faster and use fewer tokens
    expect(run2.metrics.tokenCount).toBeLessThan(run1.metrics.tokenCount);
    expect(run2.metrics.executionTime).toBeLessThan(run1.metrics.executionTime * 1.1);
    
    // Should produce higher quality (fewer revisions needed)
    expect(run2.metrics.revisionCount).toBeLessThanOrEqual(run1.metrics.revisionCount);
  });
});
```text
**MemoryFormation Agent**:

```markdown
<!-- .opencode/agent/memoryformation.md -->
---
description: "Analyzes completed tasks and extracts learnings for storage"
mode: subagent
temperature: 0.1
tools:
  - memory_store
permission:
  read: allow
  edit: deny
  write: deny
---

You are a learning specialist. Your role is to:
1. Analyze completed task sessions
2. Extract key facts, patterns, and insights
3. Store them using the memory_store tool
4. Focus on reusable knowledge, not task-specific details

Store memories as concise, factual statements.
```text
**Success Metrics**:

- **Learning Efficiency**: 2nd run uses 20-30% fewer tokens
- **Quality Improvement**: Fewer revisions on similar tasks
- **Memory Relevance**: >= 80% recall accuracy on stored patterns

**Deliverables**:

- MemoryFormation agent
- Learning loop test suite
- Before/after performance comparison
- Learning effectiveness report

**Git Milestone**: `feat: phase-3.2-learning-loop`

---

## Phase 4: Optimization & Complex Task Testing

**Goal**: Validate system on real-world complex scenarios and optimize performance.

### Phase 4.1: Performance Tuning

**Test Cases**: Stress tests and optimization

```javascript
// tests/phase-4/test-4.1-performance.js
describe('Phase 4.1: Performance & Optimization', () => {
  it('should handle large codebases efficiently', async () => {
    // Create a moderate-sized codebase (50 files)
    await setupLargeCodebase();
    
    const result = await runMeasuredTask({
      prompt: 'Add logging to all API endpoints',
      timeout: 600000 // 10 minutes
    });
    
    expect(result.filesModified.length).toBeGreaterThan(10);
    expect(result.metrics.tokenCount).toBeLessThan(15000);
    expect(result.testsPass).toBe(true);
  });
  
  it('should optimize token usage over time', async () => {
    const runs = [];
    
    for (let i = 0; i < 5; i++) {
      const run = await runMeasuredTask({
        prompt: `Create a utility function for task ${i}`,
        storeMemory: true
      });
      runs.push(run);
    }
    
    // Token usage should decrease or stabilize
    const firstAvg = average(runs.slice(0, 2).map(r => r.metrics.tokenCount));
    const lastAvg = average(runs.slice(3, 5).map(r => r.metrics.tokenCount));
    
    expect(lastAvg).toBeLessThanOrEqual(firstAvg * 1.1); // Allow 10% variance
  });
});
```text
**Deliverables**:

- Performance benchmark suite
- Optimization recommendations
- Token usage optimization guide
- Large codebase test scenarios

**Git Milestone**: `perf: phase-4.1-performance-tuning`

---

### Phase 4.2: Complex Real-World Tasks

**Complexity Level**: ⭐⭐⭐⭐⭐ (Very Complex - real-world scenarios)

**Test Cases**: Tasks that challenge single-agent approaches

#### Test 4.2.1: "Drift Prevention" - Multi-file Refactoring

```javascript
// tests/phase-4/test-4.2.1-drift-prevention.js
describe('Phase 4.2.1: Multi-file Refactoring (Drift Prevention)', () => {
  it('should refactor consistently across multiple files', async () => {
    // Setup: Create a codebase with inconsistent patterns
    await setupInconsistentCodebase();
    
    const result = await runAgentTask({
      agent: 'orchestrator',
      prompt: 'Refactor all API calls to use async/await instead of callbacks',
      expectedFiles: expect.arrayContaining([
        'src/api/users.js',
        'src/api/posts.js',
        'src/api/comments.js'
      ])
    });
    
    // Verify consistency
    const files = result.filesModified;
    const patterns = files.map(f => extractPattern(f, 'api-call'));
    
    // All should use async/await (no callbacks remaining)
    expect(patterns.every(p => p.type === 'async-await')).toBe(true);
    expect(patterns.some(p => p.type === 'callback')).toBe(false);
    
    // Verify tests still pass
    expect(result.testsPass).toBe(true);
  });
});
```text
**Why This Tests Drift**: Single agents often start with one pattern and drift to another halfway through, creating inconsistency. Multi-agent with RefactorEngine should maintain consistency.

#### Test 4.2.2: "Context Management" - API Integration

```javascript
// tests/phase-4/test-4.2.2-context-management.js
describe('Phase 4.2.2: API Integration (Context Management)', () => {
  it('should implement complete API integration with all aspects', async () => {
    const result = await runAgentTask({
      agent: 'orchestrator',
      prompt: `Integrate with Stripe API:
        - Payment processing endpoint
        - Webhook handling
        - Error handling with retry logic
        - Comprehensive tests
        - Security audit
        - Documentation`,
      timeout: 600000
    });
    
    // Should involve multiple specialists
    expect(result.agentInvocations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ agent: 'codeimplementer' }),
        expect.objectContaining({ agent: 'testwriter' }),
        expect.objectContaining({ agent: 'securityauditor' }),
        expect.objectContaining({ agent: 'docuwriter' })
      ])
    );
    
    // Verify all aspects are complete
    expect(result.filesCreated).toContain('src/payments/stripe.js');
    expect(result.filesCreated).toContain('src/webhooks/stripe.js');
    expect(result.filesCreated).toContain('tests/payments/stripe.test.js');
    expect(result.filesCreated).toContain('docs/integrations/stripe.md');
    
    // Security audit should flag any issues
    expect(result.securityReport).toBeDefined();
    expect(result.securityReport.criticalIssues).toEqual([]);
  });
});
```text
**Why This Tests Context Management**: Complex tasks require maintaining context across multiple domains (payments, security, testing). Single agents often lose track of requirements.

#### Test 4.2.3: "The Gauntlet" - Full Stack Feature

```javascript
// tests/phase-4/test-4.2.3-full-stack-feature.js
describe('Phase 4.2.3: Full Stack Feature Implementation', () => {
  it('should implement a complete user authentication system', async () => {
    const result = await runAgentTask({
      agent: 'orchestrator',
      prompt: `Implement user authentication:
        - User model with password hashing
        - Registration endpoint with validation
        - Login endpoint with JWT
        - Password reset flow
        - Email verification
        - Rate limiting
        - Unit and integration tests
        - Security audit
        - API documentation`,
      timeout: 900000 // 15 minutes
    });
    
    // Completeness check
    const requiredFiles = [
      'src/models/User.js',
      'src/controllers/auth.js',
      'src/middleware/auth.js',
      'src/utils/email.js',
      'tests/models/User.test.js',
      'tests/controllers/auth.test.js',
      'tests/integration/auth.test.js',
      'docs/api/authentication.md'
    ];
    
    requiredFiles.forEach(file => {
      expect(result.filesCreated).toContain(file);
    });
    
    // Functional verification
    expect(result.testsPass).toBe(true);
    expect(result.testCoverage).toBeGreaterThanOrEqual(85);
    
    // Security verification
    expect(result.securityReport.criticalIssues).toEqual([]);
    
    // Performance metrics
    expect(result.metrics.tokenCount).toBeLessThan(20000);
    expect(result.metrics.stepCount).toBeLessThan(20);
  });
  
  it('should outperform single agent significantly', async () => {
    const singleAgent = await runMeasuredTask({
      agent: 'build',
      prompt: 'Implement user authentication system (simplified)',
      timeout: 900000
    });
    
    const multiAgent = await runMeasuredTask({
      agent: 'orchestrator',
      prompt: 'Implement user authentication system',
      timeout: 900000
    });
    
    // Multi-agent should have:
    // - Higher test coverage
    // - Fewer security issues
    // - Better documentation
    // - Similar or better token efficiency
    
    expect(multiAgent.testCoverage).toBeGreaterThan(singleAgent.testCoverage);
    expect(multiAgent.securityScore).toBeGreaterThan(singleAgent.securityScore);
    expect(multiAgent.docQuality).toBeGreaterThan(singleAgent.docQuality);
  });
});
```text
**Success Metrics for "The Gauntlet"**:

- **Completeness**: 100% of required files created
- **Correctness**: All tests pass
- **Security**: Zero critical vulnerabilities
- **Coverage**: >= 85% test coverage
- **Efficiency**: < 20,000 tokens, < 20 steps
- **Comparison**: Multi-agent outperforms single-agent on quality metrics

**Deliverables**:

- Complex task test suite
- Comparison methodology
- Performance report with graphs
- Lessons learned document

**Git Milestone**: `test: phase-4.2-complex-real-world-tasks`

---

## Measurement Framework

### Core Metrics

```javascript
// scripts/metrics-framework.js
const MetricsCollector = {
  // Quantitative Metrics
  tokenCount: 0,
  stepCount: 0,
  executionTime: 0,
  agentInvocations: [],
  filesModified: [],
  
  // Quality Metrics
  testCoverage: 0,
  testsPassed: true,
  lintErrors: 0,
  securityIssues: [],
  
  // Efficiency Metrics
  tokensPerFile: 0,
  stepsPerTask: 0,
  revisionCount: 0,
  
  // Comparison Metrics
  vsBaseline: {},
  vsSingleAgent: {},
  
  // Learning Metrics
  memoryHits: 0,
  memoryUtilization: 0
};
```text
### Visualization Dashboard

```mermaid
flowchart LR
    subgraph "Metrics Collection"
        Run[Task Execution] --> Collect[Collect Metrics]
        Collect --> Store[Store in .metrics/]
    end
    
    subgraph "Analysis"
        Store --> Compare[Compare to Baseline]
        Compare --> Trend[Trend Analysis]
        Trend --> Report[Generate Report]
    end
    
    subgraph "Outputs"
        Report --> Console[Console Output]
        Report --> JSON[JSON Export]
        Report --> Graph[Charts/Graphs]
    end
```text
### Success Criteria Matrix

| Phase | Token Efficiency | Quality Score | Success Rate | Comparison to Baseline |
|-------|-----------------|---------------|--------------|----------------------|
| 1.1   | < 500           | N/A           | 100%         | Baseline             |
| 1.2   | < 2000          | >= 70%        | 100%         | 2-4x tokens          |
| 2.1   | <= 130% single  | >= 80%        | >= 95%       | Similar tokens       |
| 2.3   | < 5000          | >= 85%        | >= 90%       | Better quality       |
| 3.2   | 20-30% reduction| >= 90%        | >= 95%       | Improved learning    |
| 4.2   | < 20000         | >= 90%        | >= 85%       | Significant advantage|

---

## Testing Strategy

### Test Organization

```text
tests/
├── phase-1/
│   ├── test-1.1-hello-world.js
│   ├── test-1.2-orchestrator.js
│   └── test-1.3-metrics.js
├── phase-2/
│   ├── test-2.1-code-test-collaboration.js
│   ├── test-2.2-permissions.js
│   └── test-2.3-full-team.js
├── phase-3/
│   ├── test-3.1-memory-tool.js
│   └── test-3.2-learning-loop.js
├── phase-4/
│   ├── test-4.1-performance.js
│   └── test-4.2-complex-tasks.js
├── helpers/
│   ├── agent-runner.js
│   ├── metrics-collector.js
│   └── test-utils.js
└── fixtures/
    └── sample-codebases/
```text
### Test Execution

```bash
# Run all tests
npm test

# Run specific phase
npm test -- tests/phase-1/

# Run with metrics collection
npm run test:measured

# Compare performance
npm run test:compare

# Generate report
npm run test:report
```text
---

## Git Strategy

### Commit Convention

```text
<type>: <phase>-<description>

Types:
- feat: New feature/capability
- test: New test or test improvement
- perf: Performance improvement
- docs: Documentation update
- fix: Bug fix
- refactor: Code refactoring
```text
### Milestone Branches

```text
main
├── phase-0-setup
├── phase-1-foundation
├── phase-2-multi-agent
├── phase-3-memory
└── phase-4-optimization
```text
### Merge Strategy

- Each phase is a separate branch
- Merge to main only after all phase tests pass
- Tag each phase completion: `v0.1.0-phase1`, etc.

---

## Success Definition

The project is successful when:

1. **All Tests Pass**: 100% of verification tests pass
2. **Measurable Improvement**: Multi-agent shows >= 30% quality improvement over single-agent
3. **Learning Demonstrated**: Phase 3 shows measurable learning effect
4. **Complex Tasks**: Successfully completes "The Gauntlet" (Phase 4.2.3)
5. **Documentation**: Complete documentation of patterns and learnings
6. **Reproducible**: Any developer can clone and run tests with same results

---

## Next Steps

1. ✅ Phase 0.1: Repository initialized
2. **NEXT**: Phase 0.2: Create project structure and basic configuration
3. Begin Phase 1: Single agent baseline testing

---

## Appendix A: Test Scenario Library

### Simple Scenarios (⭐)

- Hello World function
- Calculator operations
- String manipulation
- Array operations

### Moderate Scenarios (⭐⭐⭐)

- CRUD API endpoints
- Data validation
- File processing
- Simple algorithms

### Complex Scenarios (⭐⭐⭐⭐⭐)

- Authentication system
- Payment integration
- Multi-step workflows
- Full-stack features

---

## Appendix B: Metrics Glossary

| Metric | Description | Good Value |
|--------|-------------|------------|
| Token Count | Total tokens used in conversation | Lower is better |
| Step Count | Number of agent invocations | Optimal: 3-8 for moderate tasks |
| Execution Time | Wall clock time | Varies by task |
| Test Coverage | % of code covered by tests | >= 80% |
| Security Score | Based on vulnerability count | 0 critical issues |
| Doc Quality | Completeness and clarity | >= 80% |
| Revision Count | Times code was modified | Lower is better |
| Memory Hits | Times stored memory was used | Higher is better |

---

## Appendix C: Tool and Agent Configuration Templates

See `docs/templates/` for:

- Agent configuration template
- Custom tool template
- Test case template
- Metrics report template

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-10-18  
**Status**: Planning Phase  
**Next Review**: After Phase 0.2 completion
