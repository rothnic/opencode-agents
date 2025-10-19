# Project Status Command

## Overview

The `npm run status` command provides a comprehensive dashboard of your project's current state in a single command. It intelligently combines information from git, tests, documentation, and validation systems to give you complete context for deciding what to do next.

## Usage

```bash
npm run status
```

## What It Shows

### 📦 Project Information

- **Name**: Project identifier
- **Version**: Current semantic version
- **Type**: Module system (ESM/CommonJS)
- **Maturity**: Bootstrap (0-100 commits) → Development (100-500) → Production (500+)
- **Description**: Phase-appropriate development approach

### 🔀 Git Status

- **Branch**: Current git branch
- **Commits**: Total commit count
- **Uncommitted**: Number of unstaged/uncommitted files (warns if >10)
- **Last Commit**: Most recent commit with relative time
- **Remote**: Repository URL

### 📍 Current Phase

- **Phase**: Current work phase from STATUS.md
- **Next Task**: Immediate next objective
- **STATUS.md Age**: Hours since last update (warns if >24 hours)

### 🧪 Test Status

- **Passing/Total**: Test pass rate
- **Failed**: Number of failing tests
- **Skipped**: Number of skipped tests
- Automatically detects failures and adds to recommendations

### 📊 Version Milestones

Shows progression through semantic versioning with severity escalation:

- **v0.1.0**: Development - warnings only
- **v0.5.0**: Pre-release - some warnings become errors
- **v1.0.0**: Production - strict enforcement

### 🛡️ Validation

- **Rules Version**: Current validation-rules.json version
- **Status**: Whether validation system is active
- **Last Updated**: When rules were last modified

### 🎯 In Progress

Automatically extracted from STATUS.md "In Progress" section:

- Current objectives
- Active work items
- Pending tasks

### 💡 Recommendations

Intelligently generated based on project state:

- **CRITICAL**: >10 uncommitted files → "Make incremental commits!"
- **WARNING**: STATUS.md stale (>24hr) → "Update with current progress"
- **ERROR**: Test failures → "Fix before moving forward"
- **SUCCESS**: Clean repo + passing tests → "Ready for next objective!"

### ⚡ Quick Actions

Common commands for immediate next steps:

- `npm run audit-repository` - Check for issues
- `npm run version:check` - Check version milestones
- `npm run ci` - Full quality check
- `npm test` - Run tests
- `git status` - See uncommitted changes

## When to Use

### For Developers

1. **After switching context**: "What was I working on?"
2. **Before starting work**: "What's the current state?"
3. **During code review**: "Are we ready to commit?"
4. **End of day**: "What's still pending?"

### For AI Agents

1. **Session start**: Get complete context in one command
2. **Before making changes**: Understand current state
3. **After changes**: Verify impact on project health
4. **Before committing**: Check if repository is ready

## Benefits

### Token Efficiency

- **Single Command**: All context in one tool call (vs 4-5 separate commands)
- **Structured Output**: Easy for agents to parse
- **Actionable**: Clear next steps without additional analysis

### Decision Support

- **Prioritized**: Recommendations ordered by severity
- **Contextual**: Based on actual project state
- **Comprehensive**: Nothing missed in assessment

### Phase-Appropriate

- **Bootstrap** (0-100 commits): Emphasizes velocity, warns lightly
- **Development** (100-500 commits): Balanced feedback
- **Production** (500+ commits): Strict standards

## Implementation Details

### File: `scripts/project-status.ts`

#### Key Functions

- `getGitInfo()`: Git repository state
- `getStatusInfo()`: STATUS.md parsing
- `getTestStatus()`: Vitest output parsing (handles errors)
- `getValidationStatus()`: Validation rules state
- `getMaturityLevel()`: Commit-based phase detection
- `getVersionMilestones()`: Semantic version progression
- `getCurrentObjectives()`: Extract in-progress tasks
- `generateRecommendations()`: Intelligent next-step suggestions

#### Error Handling

- **Graceful Degradation**: Missing files show as "not found" instead of crashing
- **Command Failures**: Captures stdout/stderr even if command exits non-zero
- **Missing Sections**: Returns sensible defaults if STATUS.md sections missing

#### Extensibility

- **Modular Design**: Each section is independently gettable
- **Exported Functions**: Can be imported by other scripts
- **Configurable**: Thresholds and patterns in code are clearly commented

## Integration with Other Systems

### Validation Rules

Uses `.opencode/validation-rules.json` for:

- Version milestone definitions
- Maturity level thresholds
- Rule escalation configuration

### STATUS.md

Automatically parses:

- Current phase
- Next task
- In-progress items
- Relies on specific markdown structure

### Version-Based Severity

Aligns with `npm run version:check`:

- Shows same milestones
- Consistent version comparison
- Progressive severity escalation

## Future Enhancements

### Potential Additions

1. **Dependency Status**: Show outdated dependencies
2. **Coverage Trends**: Test coverage percentage
3. **Build Status**: Whether build passes
4. **Lint Status**: Number of lint warnings/errors
5. **GitHub Integration**: PR status, branch protection
6. **Performance**: How long commands take
7. **Historical Trends**: Compare to previous runs

### Configuration Options

Future CLI flags:

- `--json`: Output as JSON for agent parsing
- `--verbose`: Include more detail
- `--compact`: Minimal output
- `--section=<name>`: Show only specific section
- `--check`: Exit code based on critical issues

## Examples

### Clean Repository

```text
🧪 TESTS
   Status:         45/45 passing ✅

🔀 GIT
   Uncommitted:    2 files ✅

💡 RECOMMENDATIONS
   ✅ Repository is clean. Ready to start next objective!
```

### Needs Attention

```text
🧪 TESTS
   Status:         26/38 passing ❌
   Failed:         3 tests need fixing

🔀 GIT
   Uncommitted:    87 files ⚠️  (>10 limit!)

💡 RECOMMENDATIONS
   ⚠️  CRITICAL: 87 uncommitted files. Make incremental commits!
   ❌ 3 test(s) failing. Fix before moving forward.
```

## Related Documentation

- [VSCODE-AUTO-FIX.md](./VSCODE-AUTO-FIX.md) - Auto-fix configuration
- [VERSION-SEVERITY.md](./VERSION-SEVERITY.md) - Version-based escalation
- [STATUS.md](../STATUS.md) - Current project status
- [AGENTS.md](../AGENTS.md) - AI agent guidelines

## Philosophy

The status command embodies the project's core principles:

1. **Self-Healing**: Provides all context needed for intelligent decisions
2. **Configuration-Driven**: Uses validation-rules.json for consistency
3. **Phase-Appropriate**: Adapts feedback to project maturity
4. **Token-Efficient**: Minimizes agent context-gathering overhead
5. **Developer-Friendly**: Equally useful for humans and AI
