# OpenCode Agent Testing Strategy

**Last Updated**: 2025-01-19  
**Focus**: Testing REAL OpenCode agents, not mocks  
**Goal**: Measure actual agent performance with Evalite

---

## Critical Clarification

⚠️ **We are testing ACTUAL OpenCode agents**, not mock implementations.

The `agent-executor.ts` should:

1. Load real agent definitions from `.opencode/agents/`
2. Execute them using OpenCode's API/CLI
3. Collect real metrics from actual LLM calls
4. Use Evalite's `reportTrace` for tracking

**NOT**: Simulate or mock agent behavior

---

## OpenCode Agent Execution Model

### How OpenCode Agents Work

OpenCode agents are defined in markdown files (`.opencode/agents/*.md`) and can be invoked:

**Option 1: OpenCode CLI** (if available)

```bash
# Execute an agent directly
opencode run container-task-executor "Create hello function"
```

**Option 2: OpenCode API** (programmatic)

```typescript
import { opencode } from '@opencode/sdk';

const result = await opencode.runAgent('container-task-executor', {
  task: 'Create hello function',
  context: { ... }
});
```

**Option 3: OpenCode Session** (interactive)

```typescript
// Start a session and delegate to agent
const session = await opencode.startSession();
await session.delegateToAgent('container-task-executor', task);
```

### Our Approach

For benchmarking with Evalite, we need to:

1. **Execute real OpenCode agents** programmatically
2. **Track LLM calls** using `reportTrace`
3. **Collect metrics** (tokens, time, steps)
4. **Score results** based on actual output

---

## Updated Agent Executor Design

### Real Implementation (Not Mock)

```typescript
/**
 * Agent Executor - REAL OpenCode Integration
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { reportTrace } from 'evalite/traces';
import fs from 'node:fs/promises';
import path from 'node:path';

const execAsync = promisify(exec);

export interface AgentResult {
  success: boolean;
  output: string;
  metrics: {
    tokenCount: number;
    executionTime: number;
    stepCount: number;
  };
  syntaxValid: boolean;
  errors?: string[];
  traces?: TraceInfo[];  // LLM call traces
}

export interface TraceInfo {
  start: number;
  end: number;
  input: Array<{ role: string; content: string }>;
  output: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

/**
 * Execute an OpenCode agent via CLI
 */
export async function executeAgent(
  agentName: string,
  task: string,
  options: ExecuteOptions = {}
): Promise<AgentResult> {
  const startTime = performance.now();
  const traces: TraceInfo[] = [];
  
  try {
    // 1. Verify agent exists
    const agentPath = path.join(process.cwd(), '.opencode/agents', `${agentName}.md`);
    const agentExists = await fs.access(agentPath).then(() => true).catch(() => false);
    
    if (!agentExists) {
      throw new Error(`Agent '${agentName}' not found at ${agentPath}`);
    }
    
    // 2. Execute OpenCode agent
    // This assumes OpenCode CLI is installed and agents can be run via command
    const command = buildOpencodeCommand(agentName, task, options);
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: options.timeout || 60000,
      env: {
        ...process.env,
        OPENCODE_TRACE: '1',  // Enable tracing if supported
      }
    });
    
    // 3. Parse output and collect metrics
    const result = parseOpencodeOutput(stdout);
    
    // 4. Report trace for Evalite
    if (result.usage) {
      const trace: TraceInfo = {
        start: startTime,
        end: performance.now(),
        input: [{ role: 'user', content: task }],
        output: result.output,
        usage: result.usage
      };
      
      traces.push(trace);
      
      reportTrace({
        start: trace.start,
        end: trace.end,
        input: trace.input,
        output: trace.output,
        usage: trace.usage
      });
    }
    
    const executionTime = performance.now() - startTime;
    
    return {
      success: true,
      output: result.output,
      metrics: {
        tokenCount: result.usage?.totalTokens || 0,
        executionTime,
        stepCount: result.steps || 1
      },
      syntaxValid: await validateSyntax(result.output, options.language),
      traces
    };
    
  } catch (error) {
    const executionTime = performance.now() - startTime;
    
    return {
      success: false,
      output: '',
      metrics: {
        tokenCount: 0,
        executionTime,
        stepCount: 0
      },
      syntaxValid: false,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

/**
 * Build OpenCode CLI command
 */
function buildOpencodeCommand(
  agentName: string,
  task: string,
  options: ExecuteOptions
): string {
  // Escape task for shell
  const escapedTask = task.replace(/"/g, '\\"');
  
  let cmd = `opencode run ${agentName} "${escapedTask}"`;
  
  if (options.output) {
    cmd += ` --output "${options.output}"`;
  }
  
  if (options.language) {
    cmd += ` --language ${options.language}`;
  }
  
  // Request JSON output for easier parsing
  cmd += ' --format json';
  
  return cmd;
}

/**
 * Parse OpenCode JSON output
 */
function parseOpencodeOutput(stdout: string) {
  try {
    const json = JSON.parse(stdout);
    return {
      output: json.output || json.result || '',
      usage: json.usage || json.metrics?.usage,
      steps: json.steps || json.stepCount || 1
    };
  } catch {
    // Fallback to plain text output
    return {
      output: stdout,
      usage: null,
      steps: 1
    };
  }
}
```

---

## Evalite Integration with OpenCode Agents

### Updated Benchmark Structure

```typescript
// evals/hello-world.eval.ts
import { evalite } from 'evalite';
import { reportTrace } from 'evalite/traces';
import { executeAgent } from '../src/agent-executor.js';
import fs from 'node:fs';
import path from 'node:path';

evalite('ContainerTaskExecutor: Hello World Function', {
  data: async () => [
    {
      input: "Create a function called hello(name) that returns 'Hello, {name}!'",
      expected: {
        containsFunction: true,
        maxTokens: 500,
        maxTime: 30000
      }
    }
  ],
  
  task: async (input) => {
    // Execute REAL OpenCode agent
    const result = await executeAgent('container-task-executor', input);
    
    // Traces are already reported by executeAgent via reportTrace()
    
    return result;
  },
  
  scorers: [
    {
      name: 'Token Efficiency',
      description: 'Checks if token usage is under limit',
      scorer: ({ output, expected }) => {
        if (!output.success) return 0;
        
        const tokenScore = output.metrics.tokenCount <= expected.maxTokens ? 1 : 
          Math.max(0, 1 - ((output.metrics.tokenCount - expected.maxTokens) / expected.maxTokens));
        
        return {
          score: tokenScore,
          metadata: {
            tokensUsed: output.metrics.tokenCount,
            tokenLimit: expected.maxTokens
          }
        };
      }
    },
    {
      name: 'Time Efficiency',
      description: 'Checks if execution time is under limit',
      scorer: ({ output, expected }) => {
        if (!output.success) return 0;
        
        const timeScore = output.metrics.executionTime <= expected.maxTime ? 1 :
          Math.max(0, 1 - ((output.metrics.executionTime - expected.maxTime) / expected.maxTime));
        
        return {
          score: timeScore,
          metadata: {
            executionTime: output.metrics.executionTime,
            timeLimit: expected.maxTime
          }
        };
      }
    },
    {
      name: 'Functional Correctness',
      description: 'Checks if generated code contains expected function',
      scorer: ({ output, expected }) => {
        if (!output.success || !output.output) return 0;
        
        const hasFunction = 
          output.output.includes('function hello') ||
          output.output.includes('const hello') ||
          output.output.includes('export function hello');
        
        return {
          score: hasFunction ? 1 : 0,
          metadata: {
            outputLength: output.output.length,
            containsFunction: hasFunction
          }
        };
      }
    }
  ]
});
```

---

## Testing Real Agents

### Step 1: Ensure Agent Exists

```bash
# Verify agent definition exists
ls -la .opencode/agent/container-task-executor.md
```

### Step 2: Test Agent Manually

```bash
# Test the agent works via OpenCode CLI
opencode run container-task-executor "Create hello function"
```

### Step 3: Run Evalite Benchmark

```bash
# Run the eval
npx evalite evals/hello-world.eval.ts

# Watch mode for development
npx evalite evals/ --watch
```

### Step 4: Review Results

Evalite will show:

- Score for each scorer
- Metadata (tokens, time, correctness)
- Traces of LLM calls
- Pass/fail status

---

## Current Status & Next Steps

### What We Have

- ✅ `.opencode/agent/container-task-executor.md` exists
- ✅ Evalite installed
- ✅ Basic eval structure created
- ⏳ Agent executor needs real OpenCode integration

### What We Need

1. **Verify OpenCode CLI/API**
   - How do we programmatically run OpenCode agents?
   - What's the output format?
   - How do we get metrics (tokens, time)?

2. **Update Agent Executor**
   - Replace mock with real OpenCode calls
   - Add proper trace reporting
   - Handle errors and timeouts

3. **Test End-to-End**
   - Run eval with real agent
   - Verify metrics are collected
   - Validate scores are meaningful

4. **Iterate**
   - Adjust scoring thresholds
   - Add more evals
   - Optimize agent definitions

---

## Questions to Answer

### OpenCode Integration

- [ ] What's the command to run an OpenCode agent programmatically?
- [ ] Does OpenCode support JSON output format?
- [ ] How do we capture token usage from OpenCode?
- [ ] Can we get trace data from OpenCode LLM calls?
- [ ] What's the error handling model?

### Evalite Usage

- [x] How to structure scorers (inline vs reusable)
- [x] How to report traces from LLM calls
- [ ] How to test agent execution without actual LLM calls (for CI)
- [ ] How to version control eval results

---

## Implementation Priority

### Phase 1: Get One Real Agent Working

1. ⏱️ 1h - Research OpenCode programmatic API/CLI
2. ⏱️ 2h - Update agent-executor.ts with real integration
3. ⏱️ 1h - Test manually with container-task-executor agent
4. ⏱️ 30m - Run eval and verify metrics

### Phase 2: Expand Coverage

5. Add more scorers (syntax validation, test execution)
6. Create evals for other agents (test-writer, doc-writer)
7. Build reusable scorer library
8. Add CI integration for automated eval runs

---

## References

- [Evalite Scorers](https://evalite.dev/docs/scorers)
- [Evalite Traces](https://evalite.dev/docs/traces)
- [OpenCode Documentation](#) - TODO: Add link
- [Implementation Roadmap](./IMPLEMENTATION-ROADMAP.md)
