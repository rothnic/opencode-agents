# OpenCode Agents: Installation & Framework Strategy

**Last Updated**: 2025-01-19  
**Status**: Design Document  
**Goal**: Enable opencode-agents as an installable framework for any project

---

## Executive Summary

Transform `opencode-agents` from a standalone project into an **installable framework** that brings AI coding agents, quality gates, and automated testing to any repository. The framework integrates:

- **OpenCode agents** for multi-agent collaboration
- **Evalite** for measurable agent benchmarking
- **ZLI + Zod** for type-safe CLI tooling
- **Container-use** (optional) for isolated change management

## Installation Models

### Model 1: Global Installation (Recommended)

```bash
# Install framework globally
npm install -g opencode-agents

# Initialize in any project
cd my-project
opencode-agents init

# Interactive setup wizard
? Project type: (web-app / api-service / library / other)
? Enable agents: (orchestrator / container-task-executor / test-writer / all)
? Quality gates: (strict / balanced / minimal)
? Model preferences: (gpt-4o-mini / claude-3-5-sonnet / custom)

# Framework creates:
# - .opencode/ with agent definitions
# - opencode.json with project config
# - AGENTS.md with conventions
# - scripts/ with validation tools (optional)
```

### Model 2: Template Repository

```bash
# Use as GitHub template
gh repo create my-project --template opencode-agents/template

# Or clone directly
git clone https://github.com/yourorg/opencode-agents-template my-project
cd my-project
npm install
opencode-agents setup
```

### Model 3: Per-Project Dependency

```bash
# Add to existing project
npm install --save-dev opencode-agents

# Initialize
npx opencode-agents init --local
```

## Framework Structure

### Global Configuration (`~/.config/opencode/`)

```text
~/.config/opencode/
├── agents/                        # Reusable agent definitions
│   ├── orchestrator.md
│   ├── container-task-executor.md
│   ├── test-writer.md
│   ├── doc-writer.md
│   └── refactor-engine.md
├── tools/                         # Shared TypeScript tools
│   ├── metrics-collector.ts
│   ├── cli-bridge.ts
│   └── eval-runner.ts
├── evals/                         # Standard benchmarks
│   ├── hello-world.eval.ts
│   ├── crud-api.eval.ts
│   └── refactor-quality.eval.ts
└── opencode.json                  # Global defaults
```

### Project Configuration (`.opencode/`)

```text
project/.opencode/
├── agents/                        # Project-specific agents
│   └── custom-specialist.md
├── tools/                         # Project-specific tools
│   └── domain-validator.ts
├── evals/                         # Project benchmarks
│   └── feature-correctness.eval.ts
├── validation-rules.json          # Quality rules
└── opencode.json                  # Extends global config
```

## CLI Commands

### Core Commands

```bash
# Initialization
opencode-agents init                     # Interactive setup
opencode-agents init --template api     # Use template
opencode-agents init --minimal          # Minimal setup

# Agent Management
opencode-agents agent list              # List available agents
opencode-agents agent add <name>        # Add agent to project
opencode-agents agent override <name>   # Create project override
opencode-agents agent test <name>       # Test agent with eval

# Benchmarking (Evalite Integration)
opencode-agents benchmark              # Run all evals
opencode-agents benchmark --agent code # Specific agent
opencode-agents benchmark --report     # Generate report
opencode-agents benchmark --watch      # Watch mode

# Validation
opencode-agents validate               # Run all quality gates
opencode-agents validate --fix         # Auto-fix issues
opencode-agents validate --report      # Detailed report

# Development
opencode-agents dev                    # Watch mode for agents
opencode-agents metrics                # View performance metrics
opencode-agents doctor                 # Diagnose issues
```

### Command Implementation (ZLI + Zod)

```typescript
// cli/commands/init.ts
import { defineCommand, defineOptions } from '@robingenz/zli';
import { z } from 'zod';

const InitOptionsSchema = z.object({
  template: z.enum(['web-app', 'api-service', 'library', 'minimal']).optional(),
  agents: z.array(z.string()).default(['orchestrator', 'container-task-executor']),
  minimal: z.boolean().default(false),
  force: z.boolean().default(false)
});

export const initCommand = defineCommand({
  description: 'Initialize OpenCode agents in current project',
  options: defineOptions(InitOptionsSchema, {
    t: 'template',
    m: 'minimal',
    f: 'force'
  }),
  action: async (options) => {
    // 1. Detect project type
    const projectType = await detectProjectType();
    
    // 2. Copy global agent templates
    await copyAgentTemplates(options.agents);
    
    // 3. Create .opencode/ structure
    await createOpencodeDirectory();
    
    // 4. Generate opencode.json
    await generateConfig(projectType, options);
    
    // 5. Create AGENTS.md
    await generateAgentsGuide();
    
    console.log('✅ OpenCode agents initialized!');
    console.log('Run: opencode-agents benchmark');
  }
});
```

## Evalite Integration

### Why Evalite?

- **TypeScript-native**: Works with our existing toolchain
- **Vitest-based**: Familiar testing patterns
- **No API key**: Works offline for deterministic tests
- **Flexible**: Supports custom evaluators

### Benchmark Structure

```typescript
// evals/hello-world.eval.ts
import { evalite } from 'evalite';
import { executeAgent } from '../src/agent-executor';

evalite('ContainerTaskExecutor: Hello World Function', {
  data: async () => [
    {
      input: "Create a function hello(name) that returns 'Hello, {name}!'",
      expected: {
        tokenCount: { max: 500 },
        executionTime: { max: 30000 },
        codeQuality: { minScore: 0.8 },
        syntaxValid: true
      }
    }
  ],
  task: async (input) => {
    return await executeAgent('container-task-executor', input);
  },
  scorers: [
    (input, output, expected) => {
      // Token efficiency
      const tokenScore = output.tokenCount <= expected.tokenCount.max ? 1 : 0;
      
      // Time efficiency
      const timeScore = output.executionTime <= expected.executionTime.max ? 1 : 0;
      
      // Code quality (syntax + conventions)
      const qualityScore = output.lintErrors === 0 && output.syntaxValid ? 1 : 0;
      
      // Functional correctness
      const correctnessScore = testGeneratedCode(output.code) ? 1 : 0;
      
      return {
        name: 'composite',
        score: (tokenScore + timeScore + qualityScore + correctnessScore) / 4,
        details: {
          tokenEfficiency: tokenScore,
          timeEfficiency: timeScore,
          codeQuality: qualityScore,
          correctness: correctnessScore
        }
      };
    }
  ]
});
```

### Standard Eval Suite

```typescript
// evals/standard-suite.ts
export const standardEvals = [
  'hello-world',           // Baseline simplicity
  'crud-operations',       // Basic data operations
  'error-handling',        // Edge case coverage
  'refactor-quality',      // Code improvement
  'test-generation',       // Test writing
  'multi-file-feature'     // Complex coordination
];

// Run all with: opencode-agents benchmark
// Run specific: opencode-agents benchmark --eval hello-world
```

## Configuration Inheritance

```json
// ~/.config/opencode/opencode.json (Global)
{
  "version": "1.0.0",
  "agents": {
    "defaultModel": "gpt-4o-mini",
    "orchestrator": { "model": "claude-3-5-sonnet-20241022" }
  },
  "evals": {
    "enabled": true,
    "suites": ["standard"]
  }
}

// project/.opencode/opencode.json (Project Override)
{
  "extends": "~/.config/opencode/opencode.json",
  "agents": {
    "container-task-executor": {
      "model": "gpt-4o",  // Override for this project
      "temperature": 0.1
    },
    "custom-specialist": {  // Project-specific agent
      "enabled": true
    }
  },
  "evals": {
    "suites": ["standard", "project-specific"]
  }
}
```

## Package Structure

```text
opencode-agents/
├── package.json                  # Published npm package
├── bin/
│   └── opencode-agents.js        # CLI entry point
├── dist/                         # Compiled TypeScript
├── templates/                    # Project templates
│   ├── web-app/
│   ├── api-service/
│   └── minimal/
├── global-config/                # Default global config
│   ├── agents/
│   ├── tools/
│   └── evals/
├── src/
│   ├── cli/                      # CLI commands
│   ├── agent-executor.ts         # Agent runtime
│   ├── eval-runner.ts            # Evalite integration
│   └── config-manager.ts         # Config inheritance
└── README.md                     # Installation guide
```

## Developer Experience Flow

### First-Time Setup

```bash
# 1. Install globally
npm install -g opencode-agents

# 2. Create new project
mkdir my-api && cd my-api
npm init -y

# 3. Initialize agents
opencode-agents init --template api-service

# Output:
# ✅ Created .opencode/ directory
# ✅ Added 3 agents: orchestrator, container-task-executor, test-writer
# ✅ Generated opencode.json
# ✅ Created AGENTS.md with conventions
# ✅ Added quality gates to package.json
```

### Daily Development

```bash
# Start working
opencode

# Agent implements feature
> Implement user authentication endpoint

# Verify with benchmark
opencode-agents benchmark --eval auth-security

# Results:
# ✅ Token efficiency: 0.92
# ✅ Time efficiency: 0.88
# ✅ Code quality: 0.95
# ✅ Security score: 0.85
# Overall: 0.90 (Good)
```

### Continuous Integration

```yaml
# .github/workflows/agent-quality.yml
name: Agent Quality Gates

on: [push, pull_request]

jobs:
  benchmarks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      - name: Install OpenCode Agents
        run: npm install -g opencode-agents
        
      - name: Run Benchmarks
        run: opencode-agents benchmark --report
        
      - name: Validate Quality Gates
        run: opencode-agents validate --strict
        
      - name: Upload Results
        uses: actions/upload-artifact@v4
        with:
          name: eval-results
          path: .opencode/eval-results.json
```

## Container-Use Integration (Optional)

For complex multi-file changes, integrate container-use.com for isolated execution:

```typescript
// .opencode/tools/container-executor.ts
import { containerUse } from 'container-use';

export async function executeInContainer(agentTask: string) {
  const result = await containerUse({
    image: 'node:20',
    command: `opencode-agents agent run ${agentTask}`,
    files: ['src/**', 'tests/**'],
    isolation: 'full'
  });
  
  return {
    changes: result.files,
    logs: result.output,
    success: result.exitCode === 0
  };
}
```

## Migration Path

### Phase 1: Extract Core (Current)

- ✅ Existing agents work in this repo
- ⏳ Extract to `src/` with clean interfaces
- ⏳ Add Evalite benchmarks
- ⏳ Create ZLI command structure

### Phase 2: Package Creation

- ⏳ Create `bin/opencode-agents.js`
- ⏳ Build installation logic
- ⏳ Test local installation
- ⏳ Publish to npm (scoped: `@yourorg/opencode-agents`)

### Phase 3: Template Validation

- ⏳ Create template repositories
- ⏳ Test init flow on fresh projects
- ⏳ Document override patterns
- ⏳ CI/CD examples

### Phase 4: Community Release

- ⏳ Public npm package
- ⏳ Documentation site
- ⏳ Example projects
- ⏳ Contributor guide

## Success Metrics

### Installation Success

- ✅ `opencode-agents init` completes in <30 seconds
- ✅ Works on empty directory, existing npm project, git repo
- ✅ No manual file editing required
- ✅ Clear error messages for issues

### Agent Performance (Evalite)

- ✅ Hello World: 100% success, <500 tokens, <30s
- ✅ CRUD API: 90% success, <2000 tokens, <120s
- ✅ Refactor: 80% improvement score, <1500 tokens
- ✅ Multi-file: 85% correctness, <5000 tokens

### Developer Experience

- ✅ First contribution within 10 minutes
- ✅ Override agent behavior in <5 minutes
- ✅ Add custom eval in <15 minutes
- ✅ CI integration in <20 minutes

## Next Steps

1. **Add Evalite dependency** → `npm install --save-dev evalite`
2. **Create first eval** → `evals/hello-world.eval.ts`
3. **Build CLI init command** → `cli/commands/init.ts`
4. **Extract agent executor** → `src/agent-executor.ts`
5. **Test locally** → Install in test project
6. **Document** → Update README with installation
7. **Publish** → npm publish (alpha release)

---

## References

- [Evalite Documentation](https://www.evalite.dev/)
- [Container-Use Docs](https://container-use.com/introduction)
- [ZLI Framework](https://github.com/robingenz/zli)
- [OpenCode Agent Strategy](./architecture/opencode-config-strategy-with-cli.md)
