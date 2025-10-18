# OpenCode Agents: Test-Driven Multi-Agent Development

> Exploring reactive, predictable, and measurable multi-agent coding systems with OpenCode

[![Status](https://img.shields.io/badge/status-in%20development-yellow)]()
[![Phase](https://img.shields.io/badge/phase-0.1%20complete-green)]()

## Overview

This project explores building a sophisticated multi-agent orchestration system for autonomous software development using OpenCode. The approach emphasizes:

- **Test-First Development**: Every capability includes verification tests
- **Measurable Progress**: Track token usage, step counts, and success rates  
- **Incremental Complexity**: Start simple, add complexity gradually
- **Real Validation**: Boolean checks and performance metrics

## Project Goals

1. **Build a Reactive Agent Team**: Create specialized agents that work together efficiently
2. **Prevent Drift**: Use multi-agent patterns to maintain consistency across complex tasks
3. **Enable Learning**: Implement adaptive memory so the system improves over time
4. **Measure Everything**: Track performance to demonstrate measurable improvements
5. **Stay Practical**: Use real-world test cases and scenarios

## Architecture

```
┌─────────────────────────────────────────────────┐
│              User / Developer                    │
└────────────────┬────────────────────────────────┘
                 │
          ┌──────▼──────┐
          │ Orchestrator │ (Primary Agent)
          │  Coordinator  │
          └──────┬───────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼───┐   ┌───▼───┐   ┌───▼────┐
│  Code │   │ Test  │   │ Docs   │  (Specialist Agents)
│ Impl. │   │Writer │   │ Writer │
└───────┘   └───────┘   └────────┘
    │            │            │
    └────────────┼────────────┘
                 │
          ┌──────▼──────┐
          │   Tests &    │
          │   Metrics    │
          └──────────────┘
```

See [System Architecture](docs/diagrams/system-overview.mmd) for detailed diagrams.

## Project Structure

```
opencode-agents/
├── docs/
│   ├── project-plan.md           # Comprehensive project plan
│   ├── custom-coding-agents.md   # Agent architecture guide
│   ├── opencode-config.md        # OpenCode configuration guide
│   ├── diagrams/                 # Architecture diagrams
│   ├── metrics/                  # Performance reports
│   └── templates/                # Reusable templates
├── .opencode/
│   ├── agent/                    # Agent configurations
│   └── tool/                     # Custom tools
├── tests/
│   ├── phase-1/                  # Foundation tests
│   ├── phase-2/                  # Multi-agent tests
│   ├── phase-3/                  # Memory system tests
│   ├── phase-4/                  # Complex scenario tests
│   └── helpers/                  # Test utilities
├── scripts/
│   └── measure.js                # Metrics collection
└── opencode.json                 # OpenCode configuration
```

## Development Phases

### Phase 0: Setup & Infrastructure ✅ (In Progress)
- [x] Initialize GitHub repository
- [x] Create documentation structure
- [ ] Set up OpenCode configuration
- [ ] Create test framework

### Phase 1: Single Agent Foundation
- [ ] Baseline "Hello World" test
- [ ] Orchestrator pattern implementation
- [ ] Metrics collection system

### Phase 2: Multi-Agent Collaboration
- [ ] Two-agent collaboration (Code + Test)
- [ ] Permission system validation
- [ ] Full team integration

### Phase 3: Adaptive Memory
- [ ] Memory tool implementation (Vector DB)
- [ ] Learning loop with measurable improvement
- [ ] MemoryFormation agent

### Phase 4: Optimization & Real-World Testing
- [ ] Performance tuning and stress tests
- [ ] Complex real-world scenarios
- [ ] "The Gauntlet" - Full-stack feature test

See the [Project Plan](docs/project-plan.md) for detailed timelines and test cases.

## Key Features

### 🎯 Test-Driven Verification
Every agent capability includes automated tests with boolean verification:
- File existence and syntax validation
- Functional correctness testing
- Test coverage requirements
- Code quality checks

### 📊 Comprehensive Metrics
Track and compare:
- **Token Count**: Measure efficiency
- **Step Count**: Track complexity
- **Quality Scores**: Test coverage, linting, security
- **Learning Metrics**: Memory utilization and improvement

### 🤖 Specialized Agents

| Agent | Role | Permissions |
|-------|------|-------------|
| **Orchestrator** | Task decomposition & coordination | Read-only, planning |
| **CodeImplementer** | Write application code | Full write access |
| **TestWriter** | Generate and run tests | Write + limited bash |
| **SecurityAuditor** | Scan for vulnerabilities | Read-only |
| **RefactorEngine** | Improve code quality | Supervised edits |
| **DocuWriter** | Create documentation | Write docs only |
| **MemoryFormation** | Extract learnings | Memory tool access |

### 🧠 Adaptive Memory System
- **Vector Database**: Semantic memory storage
- **Learning Loop**: Continuous improvement
- **Context Retrieval**: Reuse past solutions

## Getting Started

### Prerequisites
- Node.js >= 18
- OpenCode CLI installed
- GitHub Copilot subscription (for model access)

### Installation

```bash
# Clone repository
git clone https://github.com/rothnic/opencode-agents.git
cd opencode-agents

# Install dependencies
npm install

# Configure OpenCode
opencode auth login
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific phase
npm test -- tests/phase-1/

# Run with metrics
npm run test:measured

# Generate report
npm run test:report
```

## Test Scenarios

The project uses increasingly complex test scenarios to validate agent capabilities:

### ⭐ Simple (Baseline)
- Generate basic functions
- String/array manipulation
- Simple calculations

### ⭐⭐⭐ Moderate
- CRUD API endpoints
- Data validation
- File processing

### ⭐⭐⭐⭐⭐ Complex
- Authentication system
- Payment integration
- Full-stack features

See [Test Scenario Library](docs/project-plan.md#appendix-a-test-scenario-library) for complete list.

## Metrics & Success Criteria

### Performance Targets by Phase

| Phase | Token Efficiency | Quality | Success Rate |
|-------|------------------|---------|--------------|
| 1.1   | < 500 tokens     | N/A     | 100%         |
| 2.1   | ≤ 130% single    | ≥ 80%   | ≥ 95%        |
| 3.2   | 20-30% reduction | ≥ 90%   | ≥ 95%        |
| 4.2   | < 20,000 tokens  | ≥ 90%   | ≥ 85%        |

### Quality Metrics
- **Test Coverage**: ≥ 80%
- **Security**: 0 critical vulnerabilities
- **Documentation**: Complete and accurate
- **Code Quality**: No critical linting errors

## Documentation

- **[Project Plan](docs/project-plan.md)**: Comprehensive development plan with test cases
- **[Agent Architecture](docs/custom-coding-agents.md)**: Multi-agent system design
- **[OpenCode Configuration](docs/opencode-config.md)**: Configuration deep dive
- **[Templates](docs/templates/)**: Reusable configuration templates

## Contributing

This is an experimental research project. Contributions, ideas, and feedback are welcome!

1. Fork the repository
2. Create a feature branch
3. Include tests for new capabilities
4. Submit a pull request

## Learnings & Insights

Key insights will be documented as the project progresses:
- Multi-agent vs single-agent trade-offs
- Effective orchestration patterns
- Memory system effectiveness
- Real-world performance characteristics

## License

MIT

## Contact

**Nick Roth** - [@rothnic](https://github.com/rothnic)

---

**Current Status**: Phase 0.1 Complete - Repository initialized and documentation created  
**Next Milestone**: Phase 0.2 - Project structure and basic configuration  
**Project Start Date**: October 18, 2025
