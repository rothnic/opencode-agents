# Agent Configuration Template

```markdown
---
description: "[One-line description of agent's purpose]"
mode: [primary|subagent|all]
model: "anthropic/claude-3-5-sonnet-20241022"  # or claude-3-haiku for lighter tasks
temperature: 0.1  # 0.0-1.0, lower for deterministic tasks
permission:
  read: [allow|ask|deny]
  write: [allow|ask|deny]
  edit: [allow|ask|deny]
  bash: [allow|ask|deny] # or specific commands: "npm test*": allow
  grep: [allow|ask|deny]
  glob: [allow|ask|deny]
  webfetch: [allow|ask|deny]
tools:
  - [tool_name]  # optional: specify tools explicitly
---

You are a [role] specialist. Your role is to:

1. [Primary responsibility]
2. [Secondary responsibility]
3. [Constraints/limitations]

## Guidelines

- [Specific instruction 1]
- [Specific instruction 2]
- Always check AGENTS.md for project conventions

## Examples

[Optional: Include examples of good outputs]
\```
